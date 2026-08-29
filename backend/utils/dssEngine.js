// services/dssEngine.js
//
// Central "Decision Support System" module for the Reports & Analytics tab.
// Wraps json-rules-engine (rule-based interpretation), mathjs (statistics:
// mean, std dev, z-score, coefficient of variation), and lodash (grouping/
// counting) so reportController.js stays thin and every interpretation
// sentence traces back to an actual computed rule instead of a hardcoded
// if/else guess.

const { Engine } = require('json-rules-engine');
const math = require('mathjs');
const _ = require('lodash');

/* ────────────────────────────────────────────────────────────────────────
 * 1. PROGRAM CRITERIA / PURPOSE TAXONOMY
 *    Classifies each scholarship's title+description against common
 *    funding-purpose categories via keyword rules. A program can match
 *    more than one category (e.g. "STEM scholarship for indigent
 *    students" hits both Poverty Reduction and STEM).
 * ──────────────────────────────────────────────────────────────────────── */
const CRITERIA_TAXONOMY = [
  {
    category: 'Poverty Reduction & Financial Need',
    keywords: ['poverty', 'indigent', 'underprivileged', 'marginalized', 'low-income', 'low income', 'financial need', 'financially disadvantaged', 'less fortunate', 'impoverished']
  },
  {
    category: 'Academic Excellence & Merit',
    keywords: ['merit', 'excellence', 'honor', "dean's list", 'deans list', 'top performer', 'high achiever', 'academic scholar']
  },
  {
    category: 'Persons with Disability (PWD) Support',
    keywords: ['pwd', 'disability', 'disabled', 'special needs', 'differently-abled']
  },
  {
    category: 'Indigenous & Cultural Communities',
    keywords: ['indigenous', 'ip community', 'cultural minority', 'tribal', 'ethnic minority']
  },
  {
    category: 'Women & Gender Equity',
    keywords: ['women', 'girls', 'gender equity', 'female student']
  },
  {
    category: 'STEM & Technical Skills',
    keywords: ['stem', 'science', 'technology', 'engineering', 'mathematics', 'technical-vocational', 'tech scholar', 'it program', 'computer science']
  },
  {
    category: 'Arts, Culture & Sports',
    keywords: ['arts', 'sports', 'athletics', 'athlete', 'music', 'culture and the arts', 'creative']
  },
  {
    category: 'Community Service & Leadership',
    keywords: ['leadership', 'community service', 'volunteer', 'civic engagement', 'youth leader']
  },
  {
    category: 'Working Students & Family Dependents',
    keywords: ['working student', 'ofw', 'ofw dependent', 'solo parent', 'dependent of']
  }
];

const criteriaEngine = new Engine([], { allowUndefinedFacts: true });
criteriaEngine.addOperator('containsAny', (text, keywords) => {
  if (!text) return false;
  const haystack = String(text).toLowerCase();
  return keywords.some((k) => haystack.includes(k));
});
CRITERIA_TAXONOMY.forEach(({ category, keywords }) => {
  criteriaEngine.addRule({
    conditions: { any: [{ fact: 'programText', operator: 'containsAny', value: keywords }] },
    event: { type: 'criteria-matched', params: { category } }
  });
});

async function classifyProgramCriteria(title, description) {
  const programText = `${title || ''} ${description || ''}`.toLowerCase();
  const { events } = await criteriaEngine.run({ programText });
  const categories = events.map((e) => e.params.category);
  return categories.length > 0 ? categories : ['General / Unspecified'];
}

async function buildCriteriaReport(scholarships) {
  const matchedPerProgram = await Promise.all(
    scholarships.map(async (s) => ({
      id: s.id,
      title: s.title,
      categories: await classifyProgramCriteria(s.title, s.description)
    }))
  );

  const allTags = _.flatMap(matchedPerProgram, (p) => p.categories);
  const totalPrograms = scholarships.length || 1;

  const grouped = _.chain(allTags)
    .countBy()
    .map((count, category) => ({
      category,
      programCount: count,
      percentage: math.round((count / totalPrograms) * 100, 2)
    }))
    .orderBy(['programCount'], ['desc'])
    .value();

  let interpretation = 'No program records available to classify by funding criteria.';
  if (grouped.length > 0) {
    const top = grouped[0];
    interpretation = `Most-entered program criteria is "${top.category}", present in ${top.programCount} of ${totalPrograms} program(s) (${top.percentage}%). `;
    interpretation += top.percentage >= 50
      ? `DSS Recommendation: Provider's fund focus is heavily concentrated on this category — consider diversifying program offerings to cover under-addressed criteria.`
      : `Program purposes are reasonably spread across multiple criteria categories.`;
  }

  return { distribution: grouped, programBreakdown: matchedPerProgram, interpretation };
}

/* ────────────────────────────────────────────────────────────────────────
 * 2. GENDER-BY-DIMENSION PIVOT
 *    Takes flat {name, gender, count} rows from any grouped SQL query
 *    (per program, per course, per district, per barangay) and pivots
 *    them into {name, male, female, unspecified, total} rows, sorted by
 *    total descending. Shared by every breakdown in the demographics
 *    report so the shape is identical across dimensions.
 * ──────────────────────────────────────────────────────────────────────── */
function pivotGenderBreakdown(rows) {
  const grouped = _.groupBy(rows, 'name');
  return Object.entries(grouped)
    .map(([name, entries]) => {
      const male = Number(entries.find((e) => e.gender === 'Male')?.count || 0);
      const female = Number(entries.find((e) => e.gender === 'Female')?.count || 0);
      const unspecified = _.sumBy(
        entries.filter((e) => e.gender !== 'Male' && e.gender !== 'Female'),
        (e) => Number(e.count)
      );
      return { name, male, female, unspecified, total: male + female + unspecified };
    })
    .sort((a, b) => b.total - a.total);
}

/* ────────────────────────────────────────────────────────────────────────
 * 3. DEMOGRAPHIC CONCENTRATION (Z-SCORE BASED)
 *    Replaces the old "> 40%" magic number with a statistical imbalance
 *    test: a course is flagged as over-represented when its share of
 *    approved scholars is more than 1.5 standard deviations above the
 *    mean share across all courses.
 * ──────────────────────────────────────────────────────────────────────── */
function analyzeDemographicConcentration(demographics) {
  if (demographics.length === 0) {
    return { interpretation: 'No approved scholar records found for demographic analysis.', zScoreFlag: false };
  }

  const shares = demographics.map((d) => d.percentage);
  const mean = math.mean(shares);
  const std = demographics.length > 1 ? math.std(shares) : 0;
  const top = demographics[0];
  const zScore = std > 0 ? (top.percentage - mean) / std : 0;
  const zScoreFlag = zScore > 1.5;

  let interpretation = `Highest concentration of approved scholars is in ${top.course_name} (${top.percentage}% of total, z-score ${math.round(zScore, 2)}). `;
  interpretation += zScoreFlag
    ? `DSS Recommendation: This course is statistically over-represented versus the average program share — consider prioritizing applicants from under-represented degree programs.`
    : `Academic program distribution remains statistically balanced across applicants.`;

  return { interpretation, zScoreFlag, mean: math.round(mean, 2), std: math.round(std, 2) };
}

/* ────────────────────────────────────────────────────────────────────────
 * 4. FINANCIAL ALLOCATION STATISTICS
 *    Adds a coefficient-of-variation check (std dev / mean of program
 *    midpoints) on top of the missing-amount count, flagging when fund
 *    sizes are wildly inconsistent across programs (an equity signal).
 * ──────────────────────────────────────────────────────────────────────── */
function analyzeFinancialSpread(midpoints) {
  const nonZero = midpoints.filter((m) => m > 0);
  if (nonZero.length < 2) return { coefficientOfVariation: 0, highVarianceFlag: false };

  const mean = math.mean(nonZero);
  const std = math.std(nonZero);
  const coefficientOfVariation = mean > 0 ? math.round(std / mean, 2) : 0;
  return { coefficientOfVariation, highVarianceFlag: coefficientOfVariation > 0.5 };
}

module.exports = {
  buildCriteriaReport,
  pivotGenderBreakdown,
  analyzeDemographicConcentration,
  analyzeFinancialSpread
};
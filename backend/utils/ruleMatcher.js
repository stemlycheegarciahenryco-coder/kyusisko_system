// utils/ruleMatcher.js
const { Engine } = require('json-rules-engine');
const Fuse = require('fuse.js');

/**
 * Controlled vocabulary: criteria strings that map to a hard boolean flag
 * on the student's onboarding profile, checked with an EXACT match
 * (not fuzzy) via json-rules-engine. Add synonyms as sub-admins use them.
 */
const TAG_MAP = {
  'pwd': { field: 'is_pwd', label: 'PWD' },
  'person with disability': { field: 'is_pwd', label: 'PWD' },
  '4ps': { field: 'is_poverty_program', label: '4Ps / Poverty Program' },
  'poverty program': { field: 'is_poverty_program', label: 'Poverty Program' },
  'working student': { field: 'is_working_student', label: 'Working Student' },
  'indigenous': { field: 'is_indigenous', label: 'Indigenous' },
  'indigenous group': { field: 'is_indigenous', label: 'Indigenous' },
  'athlete': { field: 'is_athlete', label: 'Athlete' },
};

/**
 * Criteria strings that map to student.yearLevel instead of a boolean flag.
 * Adjust the accepted values to match your year_level_enum values exactly.
 */
const YEAR_LEVEL_MAP = {
  'freshmen': ['1', 'freshman', 'first year'],
  'freshman': ['1', 'freshman', 'first year'],
  'sophomore': ['2', 'sophomore', 'second year'],
  'junior': ['3', 'junior', 'third year'],
  'senior': ['4', 'senior', 'fourth year'],
  'graduate': ['graduate'],
  'postgraduate': ['postgraduate'],
  'masters': ['masters'],
  "master's": ['masters'],
  'doctorate': ['doctorate'],
  'phd': ['doctorate'],
};

/**
 * Classifies a single criterion string from scholarships.criteria into
 * one of: a demographic tag check, a year-level check, or a free-text
 * program/college name (handled by fuzzy match).
 */
function classifyCriterion(raw) {
  const norm = String(raw).trim().toLowerCase();
  if (TAG_MAP[norm]) return { type: 'tag', raw, ...TAG_MAP[norm] };
  if (YEAR_LEVEL_MAP[norm]) return { type: 'year_level', raw, values: YEAR_LEVEL_MAP[norm] };
  return { type: 'program', raw };
}

/**
 * Normalizes student profile data for both rule and fuzzy engines
 */
function buildStudentProfile(student, row, meta) {
  return {
    gwa: parseFloat(row.gwa || student.gwa || 0),
    sdistrict: row.sdistrict,
    courseName: meta.courseName || '',
    collegeName: meta.collegeName || '',
    yearLevel: student.year_level,
    // Free text, carried through only for the optional interest-ranking
    // signal (computeInterestScore) — never used in eligibility rules.
    bio: student.bio || '',
    profileSummary: row.profile_summary || '',
    gender: student.gender,
    is_working_student: !!row.is_working_student,
    is_pwd: !!row.is_pwd,
    is_indigenous: !!row.is_indigenous,
    is_poverty_program: !!row.is_poverty_program,
    is_athlete: !!row.is_athlete
  };
}

/**
 * Evaluates binary eligibility (Pass/Fail) using json-rules-engine & Fuse.js
 */
async function calculateRuleMatch(studentProfile, scholarship) {
  const criteriaResults = [];
  let isEligible = true;

  // 1. HARD RULE: GWA Threshold Check (json-rules-engine)
  if (scholarship.gwa_requirement) {
    const engine = new Engine();
    
    engine.addRule({
      conditions: {
        all: [{
          fact: 'gwa',
          operator: 'lessThanInclusive',
          value: parseFloat(scholarship.gwa_requirement)
        }]
      },
      event: { type: 'gwa-passed' }
    });

    const { events } = await engine.run(studentProfile);
    const passedGwa = events.some(e => e.type === 'gwa-passed');

    if (!passedGwa) isEligible = false;

    criteriaResults.push({
      criterion: `GWA Requirement (≤ ${scholarship.gwa_requirement})`,
      passed: passedGwa,
      details: passedGwa 
        ? `Student GWA (${studentProfile.gwa}) meets requirement.` 
        : `Student GWA (${studentProfile.gwa}) exceeds maximum allowable threshold (${scholarship.gwa_requirement}).`
    });
  }

  // 2. MIXED CRITERIA: demographic tags (exact) + year level (exact) + program/college (fuzzy)
  if (scholarship.criteria && Array.isArray(scholarship.criteria) && scholarship.criteria.length > 0) {
    const classified = scholarship.criteria.map(classifyCriterion);

    // 2a. Fuzzy program/college match — only for the leftover free-text entries
    const fuse = new Fuse(
      [{ text: studentProfile.courseName }, { text: studentProfile.collegeName }],
      { keys: ['text'], threshold: 0.4 }
    );

    // 2b. Evaluate every classified criterion, each producing its own pass/fail
    let anyMatched = false;
    for (const c of classified) {
      let passed = false;
      let label = c.raw;
      let detail = '';

      if (c.type === 'tag') {
        // Exact rule check via json-rules-engine — no fuzziness for eligibility flags
        const engine = new Engine();
        engine.addRule({
          conditions: { all: [{ fact: c.field, operator: 'equal', value: true }] },
          event: { type: 'tag-passed' }
        });
        const { events } = await engine.run(studentProfile);
        passed = events.some(e => e.type === 'tag-passed');
        label = c.label;
        detail = passed
          ? `Student is flagged as ${c.label}.`
          : `Student is not flagged as ${c.label}.`;
      } else if (c.type === 'year_level') {
        const studentYear = String(studentProfile.yearLevel || '').trim().toLowerCase();
        passed = c.values.includes(studentYear);
        label = `Year Level: ${c.raw}`;
        detail = passed
          ? `Student year level (${studentProfile.yearLevel}) matches "${c.raw}".`
          : `Student year level (${studentProfile.yearLevel || 'Unspecified'}) does not match "${c.raw}".`;
      } else {
        // program: fuzzy match against course/college name
        passed = fuse.search(c.raw).length > 0;
        label = `Program: ${c.raw}`;
        detail = passed
          ? `Student course/college (${studentProfile.courseName}) matches "${c.raw}".`
          : `Student program (${studentProfile.courseName || 'Unspecified'}) does not match "${c.raw}".`;
      }

      if (passed) anyMatched = true;
      criteriaResults.push({ criterion: label, passed, details: detail });
    }

    // Current semantics preserved: matching ANY listed criterion (tag, year, or program)
    // satisfies this block — mirrors the original "at least one program match" logic.
    // If a scholarship instead needs e.g. "PWD AND Freshmen" (all must hold), see note below.
    if (!anyMatched) isEligible = false;
  }

  return {
    is_eligible: isEligible,
    criteria_results: criteriaResults,
    summary: isEligible 
      ? 'Student satisfies all mandatory eligibility requirements.' 
      : 'Student is ineligible due to failing core threshold requirements.'
  };
}

/**
 * OPTIONAL SOFT SIGNAL — not eligibility.
 * Fuzzy-scores how well a scholarship's free-text description relates to a
 * student's own free-text (bio / profile_summary). Used only to order
 * already-eligible scholarships, never to include/exclude one. Not cached
 * in match_scores — that table is for deterministic eligibility facts only.
 * Returns a 0–1 relevance score (higher = more relevant), or null if either
 * side has no text to compare.
 */
function computeInterestScore(studentText, description) {
  if (!description || !studentText) return null;

  const fuse = new Fuse([{ text: description }], {
    keys: ['text'],
    includeScore: true,
    threshold: 0.6 // looser than eligibility matching — this is just ranking
  });

  const result = fuse.search(studentText);
  if (result.length === 0) return 0;

  // Fuse score: 0 = perfect match, 1 = no match. Invert so higher = better.
  return 1 - result[0].score;
}

module.exports = {
  calculateRuleMatch,
  buildStudentProfile,
  computeInterestScore
};
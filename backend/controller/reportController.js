const pool = require('../config/db');
const {
  buildCriteriaReport,
  pivotGenderBreakdown,
  analyzeDemographicConcentration,
  analyzeFinancialSpread
} = require('../utils/dssEngine');

// Financial & Fund Allocation Report
exports.getFinancialReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        amount_range, 
        slots, 
        (SELECT COUNT(*) FROM applications WHERE LOWER(status) = 'approved') AS approved_scholars
      FROM scholarships;
    `;
    const { rows } = await pool.query(query);

    let totalAllocatedMidpoint = 0;
    let missingAmountCount = 0;
    const midpoints = [];

    const parsedPrograms = rows.map((program) => {
      const matches = program.amount_range ? program.amount_range.match(/\d+/g) : null;
      let calculatedMidpoint = 0;

      if (matches && matches.length >= 2) {
        const min = parseFloat(matches[0]);
        const max = parseFloat(matches[1]);
        calculatedMidpoint = (min + max) / 2;
      } else if (matches && matches.length === 1) {
        calculatedMidpoint = parseFloat(matches[0]);
      } else {
        missingAmountCount++;
      }

      totalAllocatedMidpoint += calculatedMidpoint;
      midpoints.push(calculatedMidpoint);

      return {
        ...program,
        estimated_midpoint: calculatedMidpoint
      };
    });

    // Coefficient-of-variation check (mathjs) — flags when fund sizes are
    // wildly inconsistent across programs, which a flat total/missing-count
    // summary would never surface.
    const { coefficientOfVariation, highVarianceFlag } = analyzeFinancialSpread(midpoints);

    let interpretation = `Total estimated allocated budget across active programs is ₱${totalAllocatedMidpoint.toLocaleString()}. `;
    interpretation += missingAmountCount > 0
      ? `${missingAmountCount} program(s) contain missing or unparsed fund ranges requiring administrative review. `
      : `All program fund allocations are fully verified and parsed. `;
    interpretation += highVarianceFlag
      ? `Grant sizes vary sharply across programs (coefficient of variation ${coefficientOfVariation}) — consider reviewing for funding equity.`
      : `Grant sizes are reasonably consistent across programs (coefficient of variation ${coefficientOfVariation}).`;

    res.status(200).json({
      success: true,
      data: {
        totalAllocatedMidpoint,
        missingAmountCount,
        coefficientOfVariation,
        highVarianceFlag,
        programs: parsedPrograms,
        interpretation
      }
    });
  } catch (error) {
    console.error("Financial Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Demographic Report — Male/Female breakdown per program, course, district,
// and barangay. Every dimension is queried as flat {name, gender, count}
// rows, then pivoted into {name, male, female, unspecified, total} via
// pivotGenderBreakdown() so the shape is identical across all four.
//
// NOTE: assumes a `sbarangay` column on `students`, mirroring the existing
// `sdistrict` / `sgender` naming convention. Rename the column reference
// below if your actual schema differs.
exports.getDemographicReport = async (req, res) => {
  try {
    const genderExpr = `COALESCE(INITCAP(TRIM(s.sgender)), 'Unspecified')`;

    const byProgramQuery = `
      SELECT prog.title AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN scholarships prog ON a.scholarship_id = prog.id
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved'
      GROUP BY prog.title, ${genderExpr};
    `;

    const byCourseQuery = `
      SELECT COALESCE(c.name, sop.other_degree_program, 'Unspecified') AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN student_onboarding_profiles sop ON a.student_id = sop.student_id
      LEFT JOIN courses c ON sop.course_id = c.id
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved'
      GROUP BY COALESCE(c.name, sop.other_degree_program, 'Unspecified'), ${genderExpr};
    `;

    const byDistrictQuery = `
      SELECT COALESCE(s.sdistrict, 'Unassigned') AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved'
      GROUP BY COALESCE(s.sdistrict, 'Unassigned'), ${genderExpr};
    `;

    const byBarangayQuery = `
      SELECT COALESCE(s.sbarangay, 'Unassigned') AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved'
      GROUP BY COALESCE(s.sbarangay, 'Unassigned'), ${genderExpr};
    `;

    const [programRes, courseRes, districtRes, barangayRes] = await Promise.all([
      pool.query(byProgramQuery),
      pool.query(byCourseQuery),
      pool.query(byDistrictQuery),
      pool.query(byBarangayQuery)
    ]);

    const byProgram = pivotGenderBreakdown(programRes.rows);
    const byCourse = pivotGenderBreakdown(courseRes.rows);
    const byDistrict = pivotGenderBreakdown(districtRes.rows);
    const byBarangay = pivotGenderBreakdown(barangayRes.rows);

    const totalMale = byProgram.reduce((sum, r) => sum + r.male, 0);
    const totalFemale = byProgram.reduce((sum, r) => sum + r.female, 0);
    const totalUnspecified = byProgram.reduce((sum, r) => sum + r.unspecified, 0);
    const totalScholars = totalMale + totalFemale + totalUnspecified;

    // Statistical concentration check on the course dimension (mathjs
    // mean/std/z-score) — flags a course as over-represented rather than
    // relying on a fixed percentage cutoff.
    const courseShares = byCourse.map((c) => ({
      course_name: c.name,
      percentage: totalScholars > 0 ? parseFloat(((c.total / totalScholars) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.percentage - a.percentage);
    const { interpretation: concentrationNote, zScoreFlag } = analyzeDemographicConcentration(courseShares);

    let interpretation = totalScholars > 0
      ? `${totalMale} male and ${totalFemale} female approved scholars recorded (${totalUnspecified > 0 ? `${totalUnspecified} unspecified. ` : ''}${totalScholars} total). `
      : 'No approved scholar records found for demographic analysis. ';
    interpretation += concentrationNote;

    res.status(200).json({
      success: true,
      data: {
        totalScholars,
        totalMale,
        totalFemale,
        totalUnspecified,
        byProgram,
        byCourse,
        byDistrict,
        byBarangay,
        concentrationStats: { zScoreFlag },
        interpretation
      }
    });
  } catch (error) {
    console.error("Demographic Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Program Criteria / Funding Purpose Report
// Classifies each scholarship's title + description against a funding-
// purpose taxonomy (Poverty Reduction, Academic Merit, PWD Support, STEM,
// etc.) using a json-rules-engine keyword ruleset, then aggregates with
// lodash/mathjs to surface the most commonly entered program criteria.
exports.getCriteriaReport = async (req, res) => {
  try {
    const query = `SELECT id, title, description FROM scholarships;`;
    const { rows } = await pool.query(query);

    const { distribution, programBreakdown, interpretation } = await buildCriteriaReport(rows);

    res.status(200).json({
      success: true,
      data: {
        totalPrograms: rows.length,
        distribution,
        programBreakdown,
        interpretation
      }
    });
  } catch (error) {
    console.error("Criteria Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
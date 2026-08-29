const pool = require('../config/db');
const {
  buildCriteriaReport,
  pivotGenderBreakdown,
  analyzeDemographicConcentration,
  analyzeFinancialSpread
} = require('../utils/dssEngine');

// Import helper to resolve main org vs co-admin ID
async function resolveOrgId(requesterId) {
    const r = await pool.query(
        'SELECT account_type, parent_org_id FROM sub_admins WHERE id = $1',
        [requesterId]
    );
    if (r.rows.length === 0) return null;
    const { account_type, parent_org_id } = r.rows[0];
    return account_type === 'co_admin' ? parent_org_id : requesterId;
}

// 1. Financial & Fund Allocation Report (ISOLATED)
exports.getFinancialReport = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    const query = `
      SELECT 
        s.id, 
        s.title, 
        s.amount_range, 
        s.slots, 
        s.status,
        (SELECT COUNT(*) FROM applications a WHERE a.scholarship_id = s.id AND LOWER(a.status) = 'approved') AS approved_scholars
      FROM scholarships s
      WHERE s.sub_admin_id = $1;
    `;
    const { rows } = await pool.query(query, [orgId]);

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

// 2. Demographic Report (ISOLATED)
exports.getDemographicReport = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    const genderExpr = `COALESCE(INITCAP(TRIM(s.sgender)), 'Unspecified')`;

    const byProgramQuery = `
      SELECT prog.title AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN scholarships prog ON a.scholarship_id = prog.id
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved' AND prog.sub_admin_id = $1
      GROUP BY prog.title, ${genderExpr};
    `;

    const byCourseQuery = `
      SELECT COALESCE(c.name, sop.other_degree_program, 'Unspecified') AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN scholarships prog ON a.scholarship_id = prog.id
      JOIN student_onboarding_profiles sop ON a.student_id = sop.student_id
      LEFT JOIN courses c ON sop.course_id = c.id
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved' AND prog.sub_admin_id = $1
      GROUP BY COALESCE(c.name, sop.other_degree_program, 'Unspecified'), ${genderExpr};
    `;

    const byDistrictQuery = `
      SELECT COALESCE(s.sdistrict, 'Unassigned') AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN scholarships prog ON a.scholarship_id = prog.id
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved' AND prog.sub_admin_id = $1
      GROUP BY COALESCE(s.sdistrict, 'Unassigned'), ${genderExpr};
    `;

    const byBarangayQuery = `
      SELECT COALESCE(s.sbarangay, 'Unassigned') AS name, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN scholarships prog ON a.scholarship_id = prog.id
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved' AND prog.sub_admin_id = $1
      GROUP BY COALESCE(s.sbarangay, 'Unassigned'), ${genderExpr};
    `;

    const [programRes, courseRes, districtRes, barangayRes] = await Promise.all([
      pool.query(byProgramQuery, [orgId]),
      pool.query(byCourseQuery, [orgId]),
      pool.query(byDistrictQuery, [orgId]),
      pool.query(byBarangayQuery, [orgId])
    ]);

    const byProgram = pivotGenderBreakdown(programRes.rows);
    const byCourse = pivotGenderBreakdown(courseRes.rows);
    const byDistrict = pivotGenderBreakdown(districtRes.rows);
    const byBarangay = pivotGenderBreakdown(barangayRes.rows);

    const totalMale = byProgram.reduce((sum, r) => sum + r.male, 0);
    const totalFemale = byProgram.reduce((sum, r) => sum + r.female, 0);
    const totalUnspecified = byProgram.reduce((sum, r) => sum + r.unspecified, 0);
    const totalScholars = totalMale + totalFemale + totalUnspecified;

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

// 3. Program Criteria / Funding Purpose Report (ISOLATED)
exports.getCriteriaReport = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    const query = `SELECT id, title, description FROM scholarships WHERE sub_admin_id = $1;`;
    const { rows } = await pool.query(query, [orgId]);

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
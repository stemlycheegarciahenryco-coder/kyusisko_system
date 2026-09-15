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
        s.total_budget,
        s.remaining_budget,
        s.slots, 
        s.status,
        (SELECT COUNT(*) FROM applications a WHERE a.scholarship_id = s.id AND LOWER(a.status) = 'approved') AS approved_scholars
      FROM scholarships s
      WHERE s.sub_admin_id = $1;
    `;
    const { rows } = await pool.query(query, [orgId]);

    let totalBudget = 0;
    let totalDisbursed = 0;
    let totalRemaining = 0;
    let missingBudgetCount = 0;
    let draftProgramCount = 0;
    const budgets = [];

    const parsedPrograms = rows.map((program) => {
      const budget = program.total_budget !== null ? Number(program.total_budget) : null;
      const remaining = program.remaining_budget !== null ? Number(program.remaining_budget) : null;
      const disbursed = (budget !== null && remaining !== null) ? budget - remaining : 0;
      const utilizationPct = budget && budget > 0 ? Math.round((disbursed / budget) * 100) : 0;
      const isDraft = (program.status || '').toLowerCase() === 'draft';

      if (isDraft) {
        // Draft programs aren't published yet — no one can apply to them,
        // so their budget shouldn't count toward org-wide allocation
        // totals until the org sets status to something public.
        draftProgramCount++;
      } else if (budget === null) {
        missingBudgetCount++;
      } else {
        totalBudget += budget;
        totalDisbursed += disbursed;
        totalRemaining += remaining || 0;
        budgets.push(budget);
      }

      return {
        ...program,
        total_budget: budget,
        remaining_budget: remaining,
        disbursed,
        utilization_pct: utilizationPct,
        is_draft: isDraft,
        included_in_totals: !isDraft && budget !== null
      };
    });

    const { coefficientOfVariation, highVarianceFlag } = analyzeFinancialSpread(budgets);

    let interpretation = `Total program budget across all published scholarships is ₱${totalBudget.toLocaleString()}, of which ₱${totalDisbursed.toLocaleString()} has been disbursed to scholars (₱${totalRemaining.toLocaleString()} remaining). `;
    interpretation += missingBudgetCount > 0
      ? `${missingBudgetCount} published program(s) have no budget set and are excluded from allocation totals. `
      : `All published programs have a budget set. `;
    interpretation += draftProgramCount > 0
      ? `${draftProgramCount} program(s) are still in draft and excluded from totals until published. `
      : '';
    interpretation += highVarianceFlag
      ? `Budget sizes vary sharply across programs (coefficient of variation ${coefficientOfVariation}) — consider reviewing for funding equity.`
      : `Budget sizes are reasonably consistent across programs (coefficient of variation ${coefficientOfVariation}).`;

    res.status(200).json({
      success: true,
      data: {
        totalBudget,
        totalDisbursed,
        totalRemaining,
        missingBudgetCount,
        draftProgramCount,
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

// 4. Applications Overview Report (pending/needs-review counts + applicant demographics)
//
// ASSUMPTION ON STATUS STRINGS: this groups by whatever is actually stored
// in applications.status. It treats 'pending' and 'under_review'/'reviewing'
// as "needs review", and 'approved'/'active' as approved. If your app uses
// different literal status strings, adjust the three arrays below
// (PENDING_STATUSES, REVIEW_STATUSES, APPROVED_STATUSES, REJECTED_STATUSES)
// to match exactly what you write into applications.status elsewhere.
exports.getApplicationsOverviewReport = async (req, res) => {
  const PENDING_STATUSES = ['pending'];
  const REVIEW_STATUSES = ['under_review', 'reviewing', 'for_review'];
  const APPROVED_STATUSES = ['approved', 'active'];
  const REJECTED_STATUSES = ['rejected', 'declined'];

  try {
    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    const statusCountsQuery = `
      SELECT LOWER(a.status) AS status, COUNT(*) AS count
      FROM applications a
      JOIN scholarships s ON a.scholarship_id = s.id
      WHERE s.sub_admin_id = $1
      GROUP BY LOWER(a.status);
    `;
    const { rows: statusRows } = await pool.query(statusCountsQuery, [orgId]);

    let totalApplicants = 0;
    let pendingCount = 0;
    let underReviewCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let otherCount = 0;

    statusRows.forEach((r) => {
      const c = Number(r.count);
      totalApplicants += c;
      if (PENDING_STATUSES.includes(r.status)) pendingCount += c;
      else if (REVIEW_STATUSES.includes(r.status)) underReviewCount += c;
      else if (APPROVED_STATUSES.includes(r.status)) approvedCount += c;
      else if (REJECTED_STATUSES.includes(r.status)) rejectedCount += c;
      else otherCount += c;
    });

    const needsReviewCount = pendingCount + underReviewCount;

    // Demographics across ALL applicants (not just approved ones, unlike
    // the /demographics endpoint which is scoped to approved scholars only)
    const genderExpr = `COALESCE(INITCAP(TRIM(s.sgender)), 'Unspecified')`;
    const demoQuery = `
      SELECT ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN scholarships prog ON a.scholarship_id = prog.id
      JOIN students s ON a.student_id = s.id
      WHERE prog.sub_admin_id = $1
      GROUP BY ${genderExpr};
    `;
    const { rows: demoRows } = await pool.query(demoQuery, [orgId]);

    let totalMale = 0, totalFemale = 0, totalUnspecified = 0;
    demoRows.forEach((r) => {
      const c = Number(r.count);
      if (r.gender === 'Male') totalMale += c;
      else if (r.gender === 'Female') totalFemale += c;
      else totalUnspecified += c;
    });

    const interpretation = `${totalApplicants} total application(s) received. ${needsReviewCount} still need review` +
      `${pendingCount || underReviewCount ? ` (${pendingCount} pending, ${underReviewCount} under review)` : ''}. ` +
      `${approvedCount} approved, ${rejectedCount} rejected` +
      `${otherCount > 0 ? `, ${otherCount} in another status` : ''}. ` +
      `Applicant pool: ${totalMale} male, ${totalFemale} female${totalUnspecified > 0 ? `, ${totalUnspecified} unspecified` : ''}.`;

    res.status(200).json({
      success: true,
      data: {
        totalApplicants,
        pendingCount,
        underReviewCount,
        needsReviewCount,
        approvedCount,
        rejectedCount,
        otherCount,
        totalMale,
        totalFemale,
        totalUnspecified,
        interpretation
      }
    });
  } catch (error) {
    console.error("Applications Overview Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Successful / Closed Programs Report
// Programs that are marked closed OR whose deadline has already passed.
// For each, shows how many scholars are active, how much budget landed
// per scholar, and the gender breakdown of those scholars.
exports.getSuccessfulProgramsReport = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    const query = `
      SELECT
        s.id,
        s.title,
        s.status,
        s.deadline,
        s.slots,
        s.total_budget,
        s.remaining_budget,
        (SELECT COUNT(*) FROM applications a WHERE a.scholarship_id = s.id AND LOWER(a.status) IN ('approved','active')) AS active_scholars
      FROM scholarships s
      WHERE s.sub_admin_id = $1
        AND s.is_archived = false
        AND (LOWER(s.status) = 'closed' OR (s.deadline IS NOT NULL AND s.deadline < CURRENT_DATE))
      ORDER BY s.deadline DESC NULLS LAST;
    `;
    const { rows } = await pool.query(query, [orgId]);
    const scholarshipIds = rows.map((r) => r.id);

    let genderRows = [];
    if (scholarshipIds.length > 0) {
      const genderExpr = `COALESCE(INITCAP(TRIM(st.sgender)), 'Unspecified')`;
      const genderQuery = `
        SELECT a.scholarship_id, ${genderExpr} AS gender, COUNT(DISTINCT a.student_id) AS count
        FROM applications a
        JOIN students st ON a.student_id = st.id
        WHERE a.scholarship_id = ANY($1::int[]) AND LOWER(a.status) IN ('approved','active')
        GROUP BY a.scholarship_id, ${genderExpr};
      `;
      genderRows = (await pool.query(genderQuery, [scholarshipIds])).rows;
    }

    const genderByProgram = {};
    genderRows.forEach((r) => {
      if (!genderByProgram[r.scholarship_id]) {
        genderByProgram[r.scholarship_id] = { male: 0, female: 0, unspecified: 0 };
      }
      const c = Number(r.count);
      if (r.gender === 'Male') genderByProgram[r.scholarship_id].male += c;
      else if (r.gender === 'Female') genderByProgram[r.scholarship_id].female += c;
      else genderByProgram[r.scholarship_id].unspecified += c;
    });

    const programs = rows.map((p) => {
      const budget = p.total_budget !== null ? Number(p.total_budget) : null;
      const remaining = p.remaining_budget !== null ? Number(p.remaining_budget) : null;
      const disbursed = (budget !== null && remaining !== null) ? budget - remaining : 0;
      const activeScholars = Number(p.active_scholars) || 0;
      const budgetPerStudent = activeScholars > 0 ? Math.round(disbursed / activeScholars) : 0;
      const isPastDeadline = p.deadline && new Date(p.deadline) < new Date();

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        closed_reason: (p.status || '').toLowerCase() === 'closed' ? 'closed' : (isPastDeadline ? 'deadline_passed' : 'closed'),
        deadline: p.deadline,
        slots: p.slots,
        total_budget: budget,
        remaining_budget: remaining,
        disbursed,
        active_scholars: activeScholars,
        budget_per_student: budgetPerStudent,
        gender: genderByProgram[p.id] || { male: 0, female: 0, unspecified: 0 }
      };
    });

    const totalActiveScholars = programs.reduce((sum, p) => sum + p.active_scholars, 0);
    const totalDisbursed = programs.reduce((sum, p) => sum + p.disbursed, 0);

    const interpretation = programs.length > 0
      ? `${programs.length} program(s) have closed or passed their deadline, with ${totalActiveScholars} active scholar(s) sharing ₱${totalDisbursed.toLocaleString()} disbursed so far.`
      : `No programs have closed or passed their deadline yet.`;

    res.status(200).json({
      success: true,
      data: {
        totalPrograms: programs.length,
        totalActiveScholars,
        totalDisbursed,
        programs,
        interpretation
      }
    });
  } catch (error) {
    console.error("Successful Programs Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
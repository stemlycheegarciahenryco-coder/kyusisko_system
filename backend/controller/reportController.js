const pool = require('../config/db');

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

      return {
        ...program,
        estimated_midpoint: calculatedMidpoint
      };
    });

    let interpretation = `Total estimated allocated budget across active programs is ₱${totalAllocatedMidpoint.toLocaleString()}. `;
    interpretation += missingAmountCount > 0 
      ? `Attention: ${missingAmountCount} program(s) contain missing or unparsed fund ranges requiring administrative review.`
      : `All program fund allocations are fully verified and parsed.`;

    res.status(200).json({
      success: true,
      data: {
        totalAllocatedMidpoint,
        missingAmountCount,
        programs: parsedPrograms,
        interpretation
      }
    });
  } catch (error) {
    console.error("Financial Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Demographic & Gender Distribution Report
// Demographic & Gender Distribution Report (Safe Version)
exports.getDemographicReport = async (req, res) => {
  try {
    // 1. Fetch Course Distribution
    const courseQuery = `
      SELECT 
        COALESCE(c.name, sop.other_degree_program, 'Unspecified') AS course_name, 
        COUNT(DISTINCT a.student_id) AS scholar_count
      FROM applications a
      JOIN student_onboarding_profiles sop ON a.student_id = sop.student_id
      LEFT JOIN courses c ON sop.course_id = c.id
      WHERE LOWER(a.status) = 'approved'
      GROUP BY COALESCE(c.name, sop.other_degree_program, 'Unspecified')
      ORDER BY scholar_count DESC;
    `;

    // 2. Fetch Cleaned Gender Distribution
    const genderQuery = `
      SELECT 
        COALESCE(INITCAP(TRIM(s.sgender)), 'Unspecified') AS gender, 
        COUNT(DISTINCT a.student_id) AS count
      FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved'
      GROUP BY COALESCE(INITCAP(TRIM(s.sgender)), 'Unspecified');
    `;

    const [courseRes, genderRes] = await Promise.all([
      pool.query(courseQuery),
      pool.query(genderQuery)
    ]);

    const totalScholars = genderRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    // Format Course Data
    const demographics = courseRes.rows.map((r) => {
      const count = parseInt(r.scholar_count, 10);
      const percentage = totalScholars > 0 ? ((count / totalScholars) * 100).toFixed(2) : 0;
      return {
        course_name: r.course_name,
        count,
        percentage: parseFloat(percentage)
      };
    });

    // Format Gender Data
    const genderBreakdown = genderRes.rows.map((r) => {
      const count = parseInt(r.count, 10);
      const percentage = totalScholars > 0 ? ((count / totalScholars) * 100).toFixed(2) : 0;
      return {
        gender: r.gender,
        count,
        percentage: parseFloat(percentage)
      };
    });

    // Dynamic Interpretation
    let interpretation = '';
    if (demographics.length > 0) {
      const topCourse = demographics[0];
      interpretation = `Highest concentration of approved scholars is in ${topCourse.course_name} (${topCourse.percentage}% of total). `;
      if (topCourse.percentage > 40) {
        interpretation += `DSS Recommendation: Consider prioritizing applicants from under-represented degree programs.`;
      } else {
        interpretation += `Academic program distribution remains balanced across applicants.`;
      }
    } else {
      interpretation = 'No approved scholar records found for demographic analysis.';
    }

    res.status(200).json({
      success: true,
      data: {
        totalScholars,
        demographics,
        genderBreakdown,
        interpretation
      }
    });
  } catch (error) {
    console.error("Demographic Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// District Allocation DSS Decision Engine
exports.getDistrictDSSReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(s.sdistrict, 'Unassigned') AS district, 
        COUNT(DISTINCT a.student_id) AS current_scholars
      FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE LOWER(a.status) = 'approved'
      GROUP BY s.sdistrict;
    `;
    const { rows } = await pool.query(query);

    const DEFAULT_QUOTA = 50;

    const dssAnalysis = rows.map((row) => {
      const current = parseInt(row.current_scholars, 10);
      const quota = DEFAULT_QUOTA;
      const variance = quota - current;

      let decisionRule = '';
      let actionTag = '';

      if (variance > 0) {
        decisionRule = `Under-allocated area. Prioritize pending applications from ${row.district} (${variance} slots remaining).`;
        actionTag = 'HIGH_PRIORITY';
      } else if (variance === 0) {
        decisionRule = `Target quota reached for ${row.district}. Maintain standard review process.`;
        actionTag = 'NEUTRAL';
      } else {
        decisionRule = `Quota exceeded in ${row.district} by ${Math.abs(variance)} slots. Reallocate funds to under-represented districts.`;
        actionTag = 'WARNING';
      }

      return {
        district: row.district,
        current,
        quota,
        variance,
        decisionRule,
        actionTag
      };
    });

    const interpretation = `DSS decision rule model calculated variances across ${dssAnalysis.length} district group(s) to direct funding decisions.`;

    res.status(200).json({
      success: true,
      data: {
        analysis: dssAnalysis,
        interpretation
      }
    });
  } catch (error) {
    console.error("District DSS Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
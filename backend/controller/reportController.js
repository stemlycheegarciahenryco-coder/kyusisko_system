const pool = require('../config/db');

// Financial & Fund Allocation Report with Dynamic Interpretation
exports.getFinancialReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        amount_range, 
        slots, 
        (SELECT COUNT(*) FROM student_onboarding_profiles WHERE status = 'approved') AS approved_scholars
      FROM scholarship_programs;
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

    // Algorithmic Interpretation string generated for OrgLogs display
    let interpretation = `Total estimated allocated budget across active programs is ₱${totalAllocatedMidpoint.toLocaleString()}. `;
    if (missingAmountCount > 0) {
      interpretation += `Attention: ${missingAmountCount} program(s) contain missing or unparsed fund ranges requiring administrative review.`;
    } else {
      interpretation += `All program fund allocations are fully verified and parsed.`;
    }

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// Demographic Distribution Report with DSS Rule Interpretation
exports.getDemographicReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.course_name, 
        COUNT(s.id) AS scholar_count
      FROM student_onboarding_profiles s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.status = 'approved'
      GROUP BY c.course_name
      ORDER BY scholar_count DESC;
    `;
    const { rows } = await pool.query(query);

    const totalScholars = rows.reduce((sum, r) => sum + parseInt(r.scholar_count, 10), 0);

    const demographics = rows.map((r) => {
      const count = parseInt(r.scholar_count, 10);
      const percentage = totalScholars > 0 ? ((count / totalScholars) * 100).toFixed(2) : 0;
      return {
        course_name: r.course_name || 'Unspecified',
        count,
        percentage: parseFloat(percentage)
      };
    });

    // DSS Narrative Generator
    let interpretation = '';
    if (demographics.length > 0) {
      const topCourse = demographics[0];
      interpretation = `Course demographic is currently concentrated in ${topCourse.course_name} (${topCourse.percentage}% of total approved scholars). `;
      if (topCourse.percentage > 40) {
        interpretation += `DSS Recommendation: Rebalance review priorities toward applicants in minor degree programs to ensure equal distribution.`;
      } else {
        interpretation += `Scholar distribution across academic programs remains balanced.`;
      }
    } else {
      interpretation = 'No scholar records found to build demographic interpretation.';
    }

    res.status(200).json({
      success: true,
      data: {
        totalScholars,
        demographics,
        interpretation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// District Allocation DSS Decision Engine
// District Allocation DSS Decision Engine
exports.getDistrictDSSReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(sdistrict, 'Unassigned') AS district, 
        COUNT(id) AS current_scholars
      FROM student_onboarding_profiles
      WHERE LOWER(status) = 'approved'
      GROUP BY COALESCE(sdistrict, 'Unassigned');
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

    const interpretation = `DSS decision rule model calculated variances across ${dssAnalysis.length} district group(s) to direct organization funding decisions.`;

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

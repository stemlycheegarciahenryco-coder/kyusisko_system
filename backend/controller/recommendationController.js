// controllers/recommendationController.js
const pool = require('../config/db');
const { calculateRuleMatch, buildStudentProfile, computeInterestScore } = require('../utils/ruleMatcher');
const redisClient = require('../config/queueConnection'); 

// ─────────────────────────────────────────────────────────────────────────────
// CACHE LAYER (Redis + Postgres)
// ─────────────────────────────────────────────────────────────────────────────
async function getOrComputeMatch(studentId, scholarship, studentProfile, profileUpdatedAt) {
  const redisKey = `match:${studentId}:${scholarship.id}`;
  const scholarshipUpdatedAt = scholarship.updated_at ? new Date(scholarship.updated_at) : new Date(0);
  const profileUpdated = profileUpdatedAt ? new Date(profileUpdatedAt) : new Date(0);

  // 1. Check Redis In-Memory Cache
  try {
    const cachedRedis = await redisClient.get(redisKey);
    if (cachedRedis) {
      const parsed = JSON.parse(cachedRedis);
      const computedAt = new Date(parsed.computed_at);
      
      if (computedAt >= scholarshipUpdatedAt && computedAt >= profileUpdated) {
        return parsed; 
      }
    }
  } catch (err) {
    console.error("Redis Cache Error:", err.message);
  }

  // 2. Check PostgreSQL Database Cache
  const cached = await pool.query(
    `SELECT is_eligible, criteria_results, summary, computed_at FROM match_scores WHERE student_id = $1 AND scholarship_id = $2`,
    [studentId, scholarship.id]
  );

  if (cached.rows.length > 0) {
    const row = cached.rows[0];
    const computedAt = new Date(row.computed_at);
    const isFresh = computedAt >= scholarshipUpdatedAt && computedAt >= profileUpdated;
    
    if (isFresh) {
      const result = {
        is_eligible: row.is_eligible,
        criteria_results: row.criteria_results,
        summary: row.summary,
        computed_at: row.computed_at
      };
      try { await redisClient.setEx(redisKey, 86400, JSON.stringify(result)); } catch (e) {}
      return result;
    }
  }

  // 3. Compute Rule-Based Eligibility
  const result = await calculateRuleMatch(studentProfile, scholarship);

  // 4. Save to PostgreSQL and Redis
  const computedNow = new Date().toISOString();
  
  await pool.query(
    `INSERT INTO match_scores (student_id, scholarship_id, is_eligible, criteria_results, summary, computed_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (student_id, scholarship_id)
     DO UPDATE SET is_eligible = $3, criteria_results = $4, summary = $5, computed_at = NOW()`,
    [studentId, scholarship.id, result.is_eligible, JSON.stringify(result.criteria_results), result.summary]
  );

  const finalData = {
    is_eligible: result.is_eligible,
    criteria_results: result.criteria_results,
    summary: result.summary,
    computed_at: computedNow
  };

  try { await redisClient.setEx(redisKey, 86400, JSON.stringify(finalData)); } catch (e) {}

  return finalData;
}

// Fetches student profile data
async function getStudentProfile(studentId) {
  const profileResult = await pool.query(
    `SELECT sop.*, s.bio, s.portfolio_data, s.year_level, s.sgender AS gender,
            c.name AS course_name, col.name AS college_name
     FROM student_onboarding_profiles sop
     JOIN students s ON s.id = sop.student_id
     LEFT JOIN courses c ON c.id = sop.course_id
     LEFT JOIN colleges col ON col.id = sop.college_id
     WHERE sop.student_id = $1`,
    [studentId]
  );

  if (profileResult.rows.length === 0) return null;

  const row = profileResult.rows[0];
  const student = { bio: row.bio, portfolio_data: row.portfolio_data, year_level: row.year_level, gender: row.gender };
  const profile = buildStudentProfile(student, row, { courseName: row.course_name, collegeName: row.college_name });

  return { profile, updatedAt: row.updated_at };
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH SCORE (0-100) — drives frontend bucketing (Best For You / Recommended)
// ─────────────────────────────────────────────────────────────────────────────
function computeMatchScore({ is_eligible, criteria_results, interest_score }) {
  if (!is_eligible) return 0;

  const total = (criteria_results || []).length;
  const matched = (criteria_results || []).filter(c => c.passed).length;

  // No criteria at all (open to everyone) counts as a full hit rate.
  const hitRate = total === 0 ? 1 : matched / total;

  const base = Math.round(hitRate * 100);
  const interestBoost = Math.round((interest_score || 0) * 10);

  // Eligible items always land at least in the "Recommended" band (>=30),
  // even when only the single required criterion was hit.
  return Math.min(100, Math.max(30, base + interestBoost));
}

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION & STACK SORTING
// ─────────────────────────────────────────────────────────────────────────────
async function scoreScholarshipsForStudent(studentId, scholarships) {
  const profileData = await getStudentProfile(studentId);
  if (!profileData) return scholarships.map(s => ({ ...s, is_eligible: false, criteria_results: [], summary: null }));

  const evaluated = await Promise.all(scholarships.map(async (scholarship) => {
    const { is_eligible, criteria_results, summary } = await getOrComputeMatch(
      studentId, scholarship, profileData.profile, profileData.updatedAt
    );

    const matched_criteria = (criteria_results || []).filter(c => c.passed).map(c => c.criterion);
    const unmatched_criteria = (criteria_results || []).filter(c => !c.passed).map(c => c.criterion);

    // Soft ranking signal only — computed live, never cached, never affects
    // is_eligible. Falls back to null (treated as 0) when there's no bio/
    // profile_summary or no description to compare against.
    const studentText = [profileData.profile.bio, profileData.profile.profileSummary]
      .filter(Boolean)
      .join(' ');
    const interest_score = computeInterestScore(studentText, scholarship.description);
    const match_score = computeMatchScore({ is_eligible, criteria_results, interest_score });

    return {
      ...scholarship,
      is_eligible,
      criteria_results,
      matched_criteria,
      unmatched_criteria,
      summary,
      is_open_to_all: (criteria_results || []).length === 0,
      interest_score: interest_score ?? 0,
      match_score,
    };
  }));

  // Sort by match_score descending — this alone now handles both "eligible
  // before ineligible" (ineligible always scores 0) and "more criteria hit
  // ranks higher" in one pass.
  evaluated.sort((a, b) => b.match_score - a.match_score);

  // Flag only the single top-ranked eligible scholarship for the UI banner
  // (ScholarshipList.jsx shows one "Best Scholarship For You" banner — ties
  // are broken by array order after the sort above).
  evaluated.forEach((s, i) => {
    s.is_best_match = i === 0 && s.is_eligible && s.match_score > 0;
  });

  return evaluated;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
const getRecommendedScholarships = async (req, res) => {
  const studentId = req.user.id;

  try {
    const scholarshipResult = await pool.query(
      `SELECT sch.*, sa.org_name, sa.org_pic AS donor_photo
       FROM scholarships sch
       LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
       WHERE sch.status IN ('open')
       AND sch.deadline::date > CURRENT_DATE
       AND sch.taken_down = FALSE
       AND NOT EXISTS (
         SELECT 1 FROM applications a WHERE a.scholarship_id = sch.id AND a.student_id = $1
       )
       LIMIT 20`,
      [studentId]
    );

    const evaluated = await scoreScholarshipsForStudent(studentId, scholarshipResult.rows);
    res.status(200).json({ success: true, recommendations: evaluated });
  } catch (err) {
    console.error("Evaluation Engine Error:", err.message);
    res.status(500).json({ error: "Recommendation system unavailable." });
  }
};

const getAllScholarships = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: "Unauthorized: No student ID found." });
    }
    const studentId = req.user.id;

    const query = `
      SELECT sch.*, sa.org_name, sa.org_pic, sa.contact_number AS org_contact,
             sa.sub_email AS org_email, sa.city AS org_city, sa.provider_type,
             EXISTS (SELECT 1 FROM saved_scholarships ss WHERE ss.scholarship_id = sch.id AND ss.student_id = $1) AS is_saved
      FROM scholarships sch
      LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
      WHERE sch.status IN ('open', 'published')
      AND sch.status != 'closed'
      AND sch.deadline::date > CURRENT_DATE
      AND sch.taken_down = FALSE
      AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.scholarship_id = sch.id AND a.student_id = $1)
      LIMIT 20
    `;
    const result = await pool.query(query, [studentId]);
    const evaluated = await scoreScholarshipsForStudent(studentId, result.rows);

    res.status(200).json({ success: true, data: evaluated });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getRecommendedProviders = async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, org_name, org_pic, city FROM sub_admins LIMIT 5`);
    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load providers." });
  }
};

const saveScholarship = async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;
  try {
    await pool.query('INSERT INTO saved_scholarships (student_id, scholarship_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [studentId, id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const unsaveScholarship = async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM saved_scholarships WHERE student_id = $1 AND scholarship_id = $2', [studentId, id]);
    res.json({ success: true, message: "Scholarship unsaved" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const reportScholarship = async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query('INSERT INTO reports (student_id, scholarship_id, reason) VALUES ($1, $2, $3)', [studentId, id, reason]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getSavedScholarships = async (req, res) => {
  const studentId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT ss.scholarship_id, sch.title, sch.deadline, sch.fund_type, sch.amount_range, sa.org_name, sa.org_pic
      FROM saved_scholarships ss
      JOIN scholarships sch ON sch.id = ss.scholarship_id
      JOIN sub_admins sa ON sa.id = sch.sub_admin_id
      WHERE ss.student_id = $1 AND sch.taken_down = FALSE
    `, [studentId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getRecommendedScholarships,
  getAllScholarships,
  getRecommendedProviders,
  reportScholarship,
  saveScholarship,
  unsaveScholarship,
  getSavedScholarships
};
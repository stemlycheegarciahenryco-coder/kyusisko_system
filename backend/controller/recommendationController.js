const pool = require('../config/db');
const { getAIMatch, buildStudentProfileForAI } = require('../utils/engineMatcher');

const BEST_MATCH_THRESHOLD = 60; // % and above = "Top Match"
const GOOD_MATCH_THRESHOLD = 30; // % and above = "Good Match"

// ─────────────────────────────────────────────────────────────────────────────
// CACHE LAYER
// A match is recomputed only if it's missing, or older than the student's
// profile OR the scholarship's last update. Otherwise the cached row is
// used as-is — no AI call, no delay, no quota usage on normal browsing.
// ─────────────────────────────────────────────────────────────────────────────
async function getOrComputeMatch(studentId, scholarship, studentProfileForAI, profileUpdatedAt) {
  const cached = await pool.query(
    `SELECT * FROM match_scores WHERE student_id = $1 AND scholarship_id = $2`,
    [studentId, scholarship.id]
  );

  const scholarshipUpdatedAt = scholarship.updated_at ? new Date(scholarship.updated_at) : new Date(0);
  const profileUpdated = profileUpdatedAt ? new Date(profileUpdatedAt) : new Date(0);

  if (cached.rows.length > 0) {
    const row = cached.rows[0];
    const computedAt = new Date(row.computed_at);
    const isFresh = computedAt >= scholarshipUpdatedAt && computedAt >= profileUpdated;
    if (isFresh) {
      return {
        match_score: row.match_score,
        criteria_results: row.criteria_results,
        ai_summary: row.ai_summary,
      };
    }
  }

  // Missing or stale — call the AI matcher
  const result = await getAIMatch(studentProfileForAI, scholarship);

  if (!result) {
    // AI call failed — fall back to the stale cached value if one exists,
    // rather than showing nothing at all
    if (cached.rows.length > 0) {
      const row = cached.rows[0];
      return { match_score: row.match_score, criteria_results: row.criteria_results, ai_summary: row.ai_summary };
    }
    return { match_score: 0, criteria_results: [], ai_summary: null };
  }

  await pool.query(
    `INSERT INTO match_scores (student_id, scholarship_id, match_score, criteria_results, ai_summary, computed_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (student_id, scholarship_id)
     DO UPDATE SET match_score = $3, criteria_results = $4, ai_summary = $5, computed_at = NOW()`,
    [studentId, scholarship.id, result.match_score, JSON.stringify(result.criteria_results), result.ai_summary]
  );

  return result;
}

// Fetches everything needed to build the AI-facing student profile object
async function getStudentProfileForAI(studentId) {
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
  const aiProfile = buildStudentProfileForAI(student, row, { courseName: row.course_name, collegeName: row.college_name });

  return { aiProfile, updatedAt: row.updated_at };
}

// Scores a list of scholarships against a student, using cache-first AI matching
async function scoreScholarshipsForStudent(studentId, scholarships) {
  const profileData = await getStudentProfileForAI(studentId);
  if (!profileData) return scholarships.map(s => ({ ...s, match_score: null, criteria_results: [], ai_summary: null, is_best_match: false }));

  const scored = [];
  for (const scholarship of scholarships) {
    const { match_score, criteria_results, ai_summary } = await getOrComputeMatch(
      studentId, scholarship, profileData.aiProfile, profileData.updatedAt
    );
    const matched_criteria = (criteria_results || []).filter(c => c.matches).map(c => c.criterion);
    const unmatched_criteria = (criteria_results || []).filter(c => !c.matches).map(c => c.criterion);

    scored.push({
      ...scholarship,
      match_score,
      criteria_results,
      matched_criteria,
      unmatched_criteria,
      ai_summary,
      is_open_to_all: (criteria_results || []).length === 0,
      is_best_match: match_score >= BEST_MATCH_THRESHOLD,
      is_good_match: match_score >= GOOD_MATCH_THRESHOLD && match_score < BEST_MATCH_THRESHOLD,
    });
  }

  scored.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  return scored;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /recommendations/:studentId
// ─────────────────────────────────────────────────────────────────────────────
const getRecommendedScholarships = async (req, res) => {
  const { studentId } = req.params;

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
       )`,
      [studentId]
    );

    const scored = await scoreScholarshipsForStudent(studentId, scholarshipResult.rows);
    res.status(200).json({ success: true, recommendations: scored });
  } catch (err) {
    console.error("Scoring Engine Error:", err.message);
    res.status(500).json({ error: "Recommendation system unavailable." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// scholarshipList student view
// ─────────────────────────────────────────────────────────────────────────────
const getAllScholarships = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: "Unauthorized: No student ID found." });
    }
    const studentId = req.user.id;

    const query = `
      SELECT sch.*, sa.org_name, sa.org_pic, sa.contact_number AS org_contact,
             sa.sub_email AS org_email, sa.city AS org_city,
             EXISTS (SELECT 1 FROM saved_scholarships ss WHERE ss.scholarship_id = sch.id AND ss.student_id = $1) AS is_saved
      FROM scholarships sch
      LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
      WHERE sch.status IN ('open', 'published')
      AND sch.status != 'closed'
      AND sch.deadline::date > CURRENT_DATE
      AND sch.taken_down = FALSE
      AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.scholarship_id = sch.id AND a.student_id = $1)
    `;
    const result = await pool.query(query, [studentId]);
    const scored = await scoreScholarshipsForStudent(studentId, result.rows);

    res.status(200).json({ success: true, data: scored });
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
    console.error("Providers Error:", err.message);
    res.status(500).json({ error: "Failed to load providers." });
  }
};

const saveScholarship = async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;
  try {
    await pool.query(
      'INSERT INTO saved_scholarships (student_id, scholarship_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [studentId, id]
    );
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
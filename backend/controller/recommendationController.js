const pool = require('../config/db');
const { getAIMatch, buildStudentProfileForAI } = require('../utils/engineMatcher');

// 🔴 ADD THIS: Import your redis client (adjust path as needed for your setup)
const redisClient = require('../config/queueConnection'); 

const BEST_MATCH_THRESHOLD = 60; // % and above = "Top Match"
const GOOD_MATCH_THRESHOLD = 30; // % and above = "Good Match"

// ─────────────────────────────────────────────────────────────────────────────
// CACHE LAYER (Redis + Postgres, both carry is_fallback/tier_used so the
// caller always knows whether a score came from real AI judgment or the
// deterministic Tier 3 fallback, even when served from cache)
// ─────────────────────────────────────────────────────────────────────────────
async function getOrComputeMatch(studentId, scholarship, studentProfileForAI, profileUpdatedAt) {
  const redisKey = `match:${studentId}:${scholarship.id}`;
  const scholarshipUpdatedAt = scholarship.updated_at ? new Date(scholarship.updated_at) : new Date(0);
  const profileUpdated = profileUpdatedAt ? new Date(profileUpdatedAt) : new Date(0);

  // 1. ⚡ FASTEST: Check Redis In-Memory Cache First
  try {
    const cachedRedis = await redisClient.get(redisKey);
    if (cachedRedis) {
      const parsed = JSON.parse(cachedRedis);
      const computedAt = new Date(parsed.computed_at);
      
      // Ensure Redis cache isn't stale
      if (computedAt >= scholarshipUpdatedAt && computedAt >= profileUpdated) {
        return parsed; // Return immediately, zero DB calls!
      }
    }
  } catch (err) {
    console.error("Redis Cache Error:", err.message);
  }

  // 2. 🗄️ FALLBACK: Check PostgreSQL if Redis missed or expired
  const cached = await pool.query(
    `SELECT * FROM match_scores WHERE student_id = $1 AND scholarship_id = $2`,
    [studentId, scholarship.id]
  );

  if (cached.rows.length > 0) {
    const row = cached.rows[0];
    const computedAt = new Date(row.computed_at);
    const isFresh = computedAt >= scholarshipUpdatedAt && computedAt >= profileUpdated;
    if (isFresh) {
      const result = {
        match_score: row.match_score,
        criteria_results: row.criteria_results,
        ai_summary: row.ai_summary,
        is_fallback: row.is_fallback,
        tier_used: row.tier_used,
        computed_at: row.computed_at
      };
      // Quietly save it back to Redis for next time (expires in 24 hrs)
      try { await redisClient.setEx(redisKey, 86400, JSON.stringify(result)); } catch (e) {}
      return result;
    }
  }

  // 3. 🤖 MISSING OR STALE: Call the AI matcher
  const result = await getAIMatch(studentProfileForAI, scholarship);

  if (!result) {
    if (cached.rows.length > 0) {
      const row = cached.rows[0];
      return {
        match_score: row.match_score,
        criteria_results: row.criteria_results,
        ai_summary: row.ai_summary,
        is_fallback: row.is_fallback,
        tier_used: row.tier_used,
      };
    }
    return { match_score: 0, criteria_results: [], ai_summary: null, is_fallback: true, tier_used: 'none' };
  }

  // 4. 💾 SAVE: Store in both PostgreSQL and Redis
  const computedNow = new Date().toISOString();
  
  await pool.query(
    `INSERT INTO match_scores (student_id, scholarship_id, match_score, criteria_results, ai_summary, is_fallback, tier_used, computed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (student_id, scholarship_id)
     DO UPDATE SET match_score = $3, criteria_results = $4, ai_summary = $5, is_fallback = $6, tier_used = $7, computed_at = NOW()`,
    [studentId, scholarship.id, result.match_score, JSON.stringify(result.criteria_results), result.ai_summary, !!result.is_fallback, result.tier_used || null]
  );

  const finalData = {
    match_score: result.match_score,
    criteria_results: result.criteria_results,
    ai_summary: result.ai_summary,
    is_fallback: !!result.is_fallback,
    tier_used: result.tier_used || null,
    computed_at: computedNow
  };

  try { await redisClient.setEx(redisKey, 86400, JSON.stringify(finalData)); } catch (e) {}

  return finalData;
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

// Runs async tasks with a concurrency cap instead of firing everything at
// once — a cold cache with many scholarships would otherwise fire N
// simultaneous Gemini calls, which is exactly what triggers the rate
// limits this fallback chain exists to survive in the first place.
async function mapWithConcurrencyLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCURRENT SCORING (capped, not unbounded)
// ─────────────────────────────────────────────────────────────────────────────
async function scoreScholarshipsForStudent(studentId, scholarships) {
  const profileData = await getStudentProfileForAI(studentId);
  if (!profileData) return scholarships.map(s => ({ ...s, match_score: null, criteria_results: [], ai_summary: null, is_best_match: false }));

  // Max 4 concurrent AI calls at a time — fast enough for a good cold-start
  // experience, low enough to stay well under typical free-tier RPM limits
  const scored = await mapWithConcurrencyLimit(scholarships, 4, async (scholarship) => {
    const { match_score, criteria_results, ai_summary, is_fallback, tier_used } = await getOrComputeMatch(
      studentId, scholarship, profileData.aiProfile, profileData.updatedAt
    );

    const matched_criteria = (criteria_results || []).filter(c => c.matches).map(c => c.criterion);
    const unmatched_criteria = (criteria_results || []).filter(c => !c.matches).map(c => c.criterion);

    return {
      ...scholarship,
      match_score,
      criteria_results,
      matched_criteria,
      unmatched_criteria,
      ai_summary,
      is_fallback: !!is_fallback, // true only if Tier 3 (rule engine) had to be used
      tier_used: tier_used || 'cached',
      is_open_to_all: (criteria_results || []).length === 0,
      is_best_match: match_score >= BEST_MATCH_THRESHOLD,
      is_good_match: match_score >= GOOD_MATCH_THRESHOLD && match_score < BEST_MATCH_THRESHOLD,
    };
  });

  scored.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  return scored;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /recommendations/:studentId
// ─────────────────────────────────────────────────────────────────────────────
const getRecommendedScholarships = async (req, res) => {
  const studentId  = req.user.id;

  try {
    // 🛡️ Added LIMIT 20 to prevent rate-limit crashes on cold cache
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

    // 🛡️ Added LIMIT 20 here as well
    const query = `
      SELECT sch.*, sa.org_name,   sa.org_pic, sa.contact_number AS org_contact,
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
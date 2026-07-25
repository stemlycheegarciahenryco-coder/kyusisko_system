const pool = require('../config/db');
const { cosineSimilarity } = require('../utils/embeddings');

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE — LAYER 1: RULE-BASED
// Criteria can now be THREE shapes:
//   1. Plain string, e.g. "PWD"                → boolean flag match
//   2. { type: "Religion", value: "..." }       → value-aware exact match
//   3. { type: "custom", label: "..." }         → NOT scored here at all —
//      no exact student field exists for it, so it's intentionally left to
//      LAYER 2 (semantic similarity) to catch. This is what lets providers
//      type free-form requirements and still have them contribute to
//      match_score, without pretending there's a deterministic rule for them.
// ─────────────────────────────────────────────────────────────────────────────
const CRITERIA_WEIGHTS = {
  'PWD':                  { field: 'is_pwd',            type: 'bool', weight: 25 },
  'Indigenous':           { field: 'is_indigenous',      type: 'bool', weight: 25 },
  'Working Student':      { field: 'is_working_student', type: 'bool', weight: 25 },
  'Student Athlete/Arts': { field: 'is_athlete',         type: 'bool', weight: 25 },
  'Athlete':              { field: 'is_athlete',         type: 'bool', weight: 25 }, // legacy label support
  '4PS':                  { field: 'is_poverty_program', type: 'bool', weight: 25 },
  'Poverty Program':      { field: 'is_poverty_program', type: 'bool', weight: 25 }, // legacy label support
  '4Ps':                  { field: 'is_poverty_program', type: 'bool', weight: 25 }, // legacy label support
  'OFW':                  { field: 'is_working_student', type: 'bool', weight: 15 }, // closest available flag
  // 'Freshmen' and 'No Failing Grades' have no matching profile field yet —
  // they fall through to semantic similarity, same as custom criteria.
};

const BEST_MATCH_THRESHOLD = 60; // % and above = "Top Match"
const GOOD_MATCH_THRESHOLD = 30; // % and above = "Good Match"

// How much weight the semantic (embedding) score gets vs. the rule-based
// eligibility score in the final blended match_score. Rule-based stays
// dominant on purpose — it's the explainable, auditable part.
const SEMANTIC_WEIGHT = 0.3;
const RULE_WEIGHT = 0.7;

function parseCriteria(raw) {
  try {
    return Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

function scoreScholarshipRules(scholarship, profile) {
  const criteria = parseCriteria(scholarship.criteria);

  // No criteria = open to all students — give baseline score
  if (criteria.length === 0) {
    return { rule_score: 50, matched_criteria: [], unmatched_criteria: [], ai_matched_criteria: [], is_open_to_all: true };
  }

  let earned = 0;
  let possible = 0;
  const matched_criteria = [];
  const unmatched_criteria = [];
  const ai_matched_criteria = []; // custom criteria — not scored here, just surfaced for display

  criteria.forEach(criterion => {
    // ── Value-aware structured criteria (Religion, Gender) ──────────────
    if (typeof criterion === 'object' && criterion !== null) {
      if (criterion.type === 'custom') {
        ai_matched_criteria.push(criterion.label);
        return; // intentionally NOT scored here — see Layer 2
      }

      if (criterion.type === 'Religion') {
        possible += 20;
        const studentReligion = (profile.other_religion || profile.religion || '').toLowerCase().trim();
        const matches = studentReligion && studentReligion === criterion.value.toLowerCase().trim();
        if (matches) { earned += 20; matched_criteria.push(`Religion: ${criterion.value}`); }
        else { unmatched_criteria.push(`Religion: ${criterion.value}`); }
        return;
      }

      if (criterion.type === 'Gender') {
        possible += 15;
        const studentGender = (profile.gender || '').toLowerCase().trim();
        const required = criterion.value.toLowerCase().trim();
        const matches = required === 'any' || (studentGender && studentGender === required);
        if (matches) { earned += 15; matched_criteria.push(`Gender: ${criterion.value}`); }
        else { unmatched_criteria.push(`Gender: ${criterion.value}`); }
        return;
      }

      return; // unrecognized object shape — skip safely
    }

    // ── Legacy plain-string boolean criteria (e.g. "PWD") ────────────────
    const rule = CRITERIA_WEIGHTS[criterion];
    if (!rule) return; // unmapped label (e.g. "Freshmen") — no rule exists, left to semantic layer

    possible += rule.weight;
    const val = profile[rule.field];
    const matches = rule.type === 'bool'
      ? val === true
      : val !== null && val !== undefined && val !== '';

    if (matches) {
      earned += rule.weight;
      matched_criteria.push(criterion);
    } else {
      unmatched_criteria.push(criterion);
    }
  });

  const rule_score = possible > 0 ? Math.min(100, Math.round((earned / possible) * 100)) : 0;

  return { rule_score, matched_criteria, unmatched_criteria, ai_matched_criteria, is_open_to_all: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE — LAYER 2: SEMANTIC SIMILARITY
// Compares the student's embedding (built from bio, course, interests,
// achievements, etc.) against each scholarship's embedding (built from
// title, description, criteria). Returns 0–100.
//
// pg returns vector columns as a string like "[0.01,0.02,...]" unless you
// use the pgvector parser — this small helper handles both cases safely.
// ─────────────────────────────────────────────────────────────────────────────
function parseVector(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function scoreSemanticSimilarity(profileEmbedding, scholarshipEmbedding) {
  const a = parseVector(profileEmbedding);
  const b = parseVector(scholarshipEmbedding);
  if (!a || !b) return null; // no embedding yet — skip, don't penalize
  const similarity = cosineSimilarity(a, b); // -1..1, realistically 0..1 for this use case
  return Math.max(0, Math.round(similarity * 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// BLENDED SCORE
// Combines rule-based eligibility (explainable, dominant) with semantic
// similarity (catches relevant matches the rules can't see). If no
// embedding exists yet for either side, falls back to pure rule-based
// score so the feature degrades gracefully instead of breaking.
// ─────────────────────────────────────────────────────────────────────────────
function scoreScholarship(scholarship, profile) {
  const { rule_score, matched_criteria, unmatched_criteria, ai_matched_criteria, is_open_to_all } = scoreScholarshipRules(scholarship, profile);
  const semantic_score = scoreSemanticSimilarity(profile.embedding, scholarship.embedding);

  const match_score = semantic_score === null
    ? rule_score
    : Math.round(RULE_WEIGHT * rule_score + SEMANTIC_WEIGHT * semantic_score);

  return {
    match_score,
    rule_score,
    semantic_score, // null if embeddings not generated yet — useful for debugging in dev
    matched_criteria,
    unmatched_criteria,
    ai_matched_criteria, // custom provider criteria with no exact field — display-only, scored via semantic layer
    is_open_to_all,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /recommendations/:studentId
// Returns all active scholarships scored against the student's profile,
// sorted by match_score descending.
// ─────────────────────────────────────────────────────────────────────────────
const getRecommendedScholarships = async (req, res) => {
  const { studentId } = req.params;

  try {
    const profileResult = await pool.query(
      `SELECT sop.*, s.sgender AS gender
       FROM student_onboarding_profiles sop
       JOIN students s ON s.id = sop.student_id
       WHERE sop.student_id = $1`,
      [studentId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const profile = profileResult.rows[0];

    const scholarshipResult = await pool.query(
      `SELECT 
        sch.*, 
        sa.org_name,
        sa.org_pic AS donor_photo
       FROM scholarships sch
       LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
       WHERE sch.status IN ('open')
       AND sch.deadline::date > CURRENT_DATE
       AND sch.taken_down = FALSE
       AND NOT EXISTS (
         SELECT 1 FROM applications a 
         WHERE a.scholarship_id = sch.id AND a.student_id = $1
       )`,
      [studentId]
    );

    const scored = scholarshipResult.rows.map(scholarship => {
      const { match_score, matched_criteria, unmatched_criteria, ai_matched_criteria, is_open_to_all } = scoreScholarship(scholarship, profile);
      return {
        ...scholarship,
        match_score,
        matched_criteria,
        unmatched_criteria,
        ai_matched_criteria,
        is_open_to_all,
        is_best_match: match_score >= BEST_MATCH_THRESHOLD,
        is_good_match: match_score >= GOOD_MATCH_THRESHOLD && match_score < BEST_MATCH_THRESHOLD,
      };
    });

    // Sort: best matches first, then by score desc
    scored.sort((a, b) => b.match_score - a.match_score);

    res.status(200).json({ success: true, recommendations: scored });
  } catch (err) {
    console.error("Scoring Engine Error:", err.message);
    res.status(500).json({ error: "Recommendation system unavailable." });
  }
};



//scholarshipList student view — now includes match scores for each scholarship
const getAllScholarships = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: "Unauthorized: No student ID found." });
        }

        const studentId = req.user.id;

        // Fetch student profile for scoring
        const profileResult = await pool.query(
            `SELECT sop.*, s.sgender AS gender
             FROM student_onboarding_profiles sop
             JOIN students s ON s.id = sop.student_id
             WHERE sop.student_id = $1`,
            [studentId]
        );
        const profile = profileResult.rows[0] || null;

        const query = `
    SELECT 
        sch.*, 
        sa.org_name, 
        sa.org_pic,
        sa.contact_number AS org_contact,
        sa.sub_email AS org_email,
        sa.city AS org_city,
        EXISTS (
            SELECT 1 FROM saved_scholarships ss 
            WHERE ss.scholarship_id = sch.id AND ss.student_id = $1
        ) AS is_saved
    FROM scholarships sch 
    LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
    WHERE sch.status IN ('open', 'published') 
    AND sch.status != 'closed'                
    AND sch.deadline::date > CURRENT_DATE
    AND sch.taken_down = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM applications a 
        WHERE a.scholarship_id = sch.id 
        AND a.student_id = $1
    )
`;

        const result = await pool.query(query, [studentId]);

        // Score each scholarship if the student has a profile
        const scored = result.rows.map(scholarship => {
            if (!profile) {
                return { ...scholarship, match_score: null, matched_criteria: [], unmatched_criteria: [], ai_matched_criteria: [], is_best_match: false, is_open_to_all: false };
            }
            const { match_score, matched_criteria, unmatched_criteria, ai_matched_criteria, is_open_to_all } = scoreScholarship(scholarship, profile);
            return {
                ...scholarship,
                match_score,
                matched_criteria,
                unmatched_criteria,
                ai_matched_criteria,
                is_open_to_all,
                is_best_match: match_score >= BEST_MATCH_THRESHOLD,
            };
        });

        // Sort best matches to the top
        scored.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

        res.status(200).json({ success: true, data: scored });
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

const getRecommendedProviders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, org_name, org_pic, city 
            FROM sub_admins 
            LIMIT 5
        `);
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
        await pool.query(
            'DELETE FROM saved_scholarships WHERE student_id = $1 AND scholarship_id = $2',
            [studentId, id]
        );
        res.json({ success: true, message: "Scholarship unsaved" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// Report a scholarship
const reportScholarship = async (req, res) => {
    const studentId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;
    try {
        await pool.query(
            'INSERT INTO reports (student_id, scholarship_id, reason) VALUES ($1, $2, $3)',
            [studentId, id, reason]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getSavedScholarships = async (req, res) => {
    const studentId = req.user.id;
    try {
        const result = await pool.query(`
            SELECT 
                ss.scholarship_id,
                sch.title,
                sch.deadline,
                sch.fund_type,
                sch.amount_range,
                sa.org_name,
                sa.org_pic
            FROM saved_scholarships ss
            JOIN scholarships sch ON sch.id = ss.scholarship_id
            JOIN sub_admins sa ON sa.id = sch.sub_admin_id
            WHERE ss.student_id = $1
            AND sch.taken_down = FALSE -- 👈 Filters out flagged items even if previously saved by student
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
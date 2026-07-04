const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE
// Each entry maps a criteria string (as stored in scholarships.criteria JSON
// array) to the student_onboarding_profiles field that satisfies it, and the
// weight awarded for a match. Score % = (earned / possible) * 100, capped at 100.
// Scholarships with no criteria are open to all — baseline 50%.
// ─────────────────────────────────────────────────────────────────────────────
const CRITERIA_WEIGHTS = {
  'PWD':              { field: 'is_pwd',            type: 'bool',   weight: 25 },
  'Indigenous':       { field: 'is_indigenous',      type: 'bool',   weight: 25 },
  'Working Student':  { field: 'is_working_student', type: 'bool',   weight: 25 },
  'Athlete':          { field: 'is_athlete',         type: 'bool',   weight: 25 },
  'Poverty Program':  { field: 'is_poverty_program', type: 'bool',   weight: 25 },
  '4Ps':              { field: 'is_poverty_program', type: 'bool',   weight: 25 },
  'Religion':         { field: 'religion',           type: 'exists', weight: 15 },
  'College Specific': { field: 'college_id',         type: 'exists', weight: 15 },
  'Course Specific':  { field: 'course_id',          type: 'exists', weight: 15 },
};

const BEST_MATCH_THRESHOLD = 60; // % and above = "Top Match"
const GOOD_MATCH_THRESHOLD = 30; // % and above = "Good Match"

function scoreScholarship(scholarship, profile) {
  let criteria = [];
  try {
    criteria = Array.isArray(scholarship.criteria)
      ? scholarship.criteria
      : JSON.parse(scholarship.criteria || '[]');
  } catch {
    criteria = [];
  }

  // No criteria = open to all students — give baseline score
  if (criteria.length === 0) {
    return { match_score: 50, matched_criteria: [], unmatched_criteria: [], is_open_to_all: true };
  }

  let earned = 0;
  let possible = 0;
  const matched_criteria = [];
  const unmatched_criteria = [];

  criteria.forEach(criterion => {
    const rule = CRITERIA_WEIGHTS[criterion];
    if (!rule) return;

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

  // GWA check — only adds bonus points if student's GWA actually meets the requirement
  // (Layer 2: skipped for now since GWA isn't collected yet — placeholder for future)
  // if (scholarship.gwa_requirement && profile.gwa) {
  //   if (parseFloat(profile.gwa) <= parseFloat(scholarship.gwa_requirement)) {
  //     earned += 20; possible += 20;
  //   } else {
  //     possible += 20; // student doesn't meet GWA — penalizes score correctly
  //   }
  // }

  const match_score = possible > 0 ? Math.min(100, Math.round((earned / possible) * 100)) : 0;

  return { match_score, matched_criteria, unmatched_criteria, is_open_to_all: false };
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
      `SELECT * FROM student_onboarding_profiles WHERE student_id = $1`,
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
      const { match_score, matched_criteria, unmatched_criteria, is_open_to_all } = scoreScholarship(scholarship, profile);
      return {
        ...scholarship,
        match_score,
        matched_criteria,
        unmatched_criteria,
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
            `SELECT * FROM student_onboarding_profiles WHERE student_id = $1`,
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
                return { ...scholarship, match_score: null, matched_criteria: [], unmatched_criteria: [], is_best_match: false, is_open_to_all: false };
            }
            const { match_score, matched_criteria, unmatched_criteria, is_open_to_all } = scoreScholarship(scholarship, profile);
            return {
                ...scholarship,
                match_score,
                matched_criteria,
                unmatched_criteria,
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
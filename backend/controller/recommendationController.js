const pool = require('../config/db');
const { get } = require('../config/mailer');


//this is the logic for the matching the criteria 
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

        // 1. We use IN ('open', 'published') to catch both possible 'live' statuses.
        // 2. We use the @> operator if criteria is a JSONB array, 
        //    OR continue using ILIKE if it's a string/text. 
        //    Below is the version compatible with JSONB arrays (recommended):
       const matchQuery = `
    SELECT 
        sch.*, 
        sa.org_name AS org_name,
        sa.org_pic AS donor_photo,
        (
            10 +  -- Base score so every open scholarship appears
            (CASE WHEN sch.gwa_requirement >= 1.0 THEN 40 ELSE 0 END) +
            (CASE WHEN $1 = true AND 'Athlete' = ANY(sch.criteria) THEN 30 ELSE 0 END) +
            (CASE WHEN $2 = true AND 'PWD' = ANY(sch.criteria) THEN 30 ELSE 0 END) +
            (CASE WHEN $3 = true AND 'Working Student' = ANY(sch.criteria) THEN 30 ELSE 0 END)
        ) AS match_score
    FROM scholarships sch
    LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
    WHERE sch.status IN ('open')
    AND sch.deadline::date > CURRENT_DATE  -- 💡 Force explicit date-only comparison
    AND sch.taken_down = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM applications a 
        WHERE a.scholarship_id = sch.id 
        AND a.student_id = $4
    )
    ORDER BY match_score DESC
`;

        const scholarships = await pool.query(matchQuery, [
            profile.is_athlete,
            profile.is_pwd,
            profile.is_working_student,
            studentId
        ]);

        res.status(200).json({
            success: true,
            recommendations: scholarships.rows
        });

    } catch (err) {
        console.error("Scoring Engine Error:", err.message);
        res.status(500).json({ error: "Recommendation system unavailable." });
    }
};



//scholarshipList student view
const getAllScholarships = async (req, res) => {
    try {
        // Safety check: if middleware failed or isn't there
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: "Unauthorized: No student ID found." });
        }

        const studentId = req.user.id; 

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
    AND sch.deadline::date > CURRENT_DATE  -- 💡 Explicitly keeps today's deadlines alive
    AND sch.taken_down = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM applications a 
        WHERE a.scholarship_id = sch.id 
        AND a.student_id = $1
    )
`;
        
        const result = await pool.query(query, [studentId]);
        res.status(200).json({ success: true, data: result.rows });
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
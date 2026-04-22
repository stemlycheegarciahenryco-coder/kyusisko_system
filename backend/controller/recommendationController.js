const pool = require('../config/db');

const getRecommendedScholarships = async (req, res) => {
    const { studentId } = req.params;

    try {
        const studentResult = await pool.query(
            `SELECT s.academic_category, ar.gwa 
             FROM students s
             LEFT JOIN academic_records ar ON s.id = ar.student_id
             WHERE s.id = $1 
             ORDER BY ar.is_current DESC, ar.created_at DESC LIMIT 1`,
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: "Student profile not found." });
        }

        const { academic_category, gwa } = studentResult.rows[0];

        // 2. JOIN scholarships with sub_admins to get the org_pic
        const matchQuery = `
            SELECT 
                sch.*, 
                sa.org_pic AS donor_photo 
            FROM scholarships sch
            LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
            WHERE sch.status = 'open' 
            AND sch.target_academic_level ILIKE $1 
            AND (
                sch.min_gwa_requirement IS NULL 
                OR $2::numeric <= sch.min_gwa_requirement::numeric
            )
            AND sch.deadline >= CURRENT_DATE
        `;

        const scholarships = await pool.query(matchQuery, [`%${academic_category}%`, gwa || 0]);

        res.status(200).json({
            success: true,
            recommendations: scholarships.rows
        });

    } catch (err) {
        console.error("Engine Error:", err.message);
        res.status(500).json({ error: "Recommendation failed." });
    }
};

const getAllScholarships = async (req, res) => {
    try {
        // Updated to join with sub_admins table
        const result = await pool.query(
            `SELECT 
                sch.*, 
                sa.org_pic AS donor_photo 
             FROM scholarships sch
             LEFT JOIN sub_admins sa ON sch.sub_admin_id = sa.id
             WHERE sch.status = 'open' 
             AND sch.deadline >= CURRENT_DATE 
             ORDER BY sch.created_at DESC`
        );

        res.status(200).json({
            success: true,
            scholarships: result.rows 
        });
    } catch (err) {
        console.error("Browse Error:", err.message);
        res.status(500).json({ error: "Failed to load scholarships." });
    }
};

module.exports = {
    getRecommendedScholarships,
    getAllScholarships
};
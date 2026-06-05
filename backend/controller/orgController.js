const pool = require('../config/db');

// 1. Fetch Profile Info
const getOrgProfile = async (req, res) => {
    const { id } = req.params;
    try {
        // Removed 'ability_level' from the query
        const result = await pool.query(
            'SELECT org_name, sub_email, region, city, street_address, barangay, contact_number, website, org_pic FROM sub_admins WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ message: "Org not found" });
        
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        // This will print the actual SQL error in your server console
        console.error("Database Error:", err); 
        res.status(500).json({ success: false, error: "Server error" });
    }
};

// 2. Update Text Only (No files here)
const updateOrgProfile = async (req, res) => {
    const { id } = req.params;
    // We destruct to remove keys that don't exist in your DB columns
    const { org_pic, previewUrl, ...textData } = req.body; 

    try {
        const fields = Object.keys(textData).map((key, i) => `${key} = $${i + 1}`);
        const values = Object.values(textData);
        
        if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

        const sql = `UPDATE sub_admins SET ${fields.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
        const result = await pool.query(sql, [...values, id]);

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Update Picture Only
const updateProfilePicture = async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        // req.file.path is something like "uploads/profiles/org_5.png"
        const filePath = req.file.path.replace(/\\/g, '/'); 
        const sql = `UPDATE sub_admins SET org_pic = $1 WHERE id = $2 RETURNING *`;
        const result = await pool.query(sql, [filePath, id]);

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getOrgApplications = async (req, res) => {
    try {
        const subAdminId = req.user.id;

        const result = await pool.query(
            `SELECT 
                a.*, 
                s.sfirst_name, 
                s.slast_name,
                sch.title as scholarship_name,
                (SELECT sch2.title 
                 FROM applications a2 
                 JOIN scholarships sch2 ON a2.scholarship_id = sch2.id
                 WHERE a2.student_id = a.student_id 
                 AND a2.status = 'approved' 
                 AND a2.scholarship_id != a.scholarship_id
                 LIMIT 1) as conflicting_org
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN scholarships sch ON a.scholarship_id = sch.id
             WHERE sch.sub_admin_id = $1`,
            [subAdminId]
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Fetch Apps Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
//applicants sidebar
const getOrgPrograms = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT 
                s.id, 
                s.title, 
                s.status, 
                s.deadline, 
                s.slots, 
                s.amount_range, 
                s.fund_type,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', st.id,
                            'sfirst_name', COALESCE(st.sfirst_name, ''),
                            'slast_name', COALESCE(st.slast_name, ''),
                            'sprofile_pic', COALESCE(st.sprofile_pic, '')
                        )
                    ) FILTER (WHERE st.id IS NOT NULL), '[]'
                ) AS applicants
             FROM scholarships s
             LEFT JOIN applications a ON a.scholarship_id = s.id
             LEFT JOIN students st ON a.student_id = st.id
             WHERE s.sub_admin_id = $1 
             GROUP BY s.id
             ORDER BY s.created_at DESC`,
            [id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Get Scholarships Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
const getDashboardStats = async (req, res) => {
    try {
        const subAdminId = req.user.id;

        const statsQuery = `
            SELECT 
                a.status, 
                COUNT(*) as count 
            FROM applications a
            JOIN scholarships s ON a.scholarship_id = s.id
            WHERE s.sub_admin_id = $1
            GROUP BY a.status
        `;
        
        const programsQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE status != 'draft') as total,
                COUNT(*) FILTER (WHERE status = 'draft')  as drafts
            FROM scholarships 
            WHERE sub_admin_id = $1
        `;

        const [statsResult, programsResult] = await Promise.all([
            pool.query(statsQuery, [subAdminId]),
            pool.query(programsQuery, [subAdminId]),
        ]);

        const statusMap = statsResult.rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                pendingApps:      (statusMap.pending      || 0) + (statusMap.under_review || 0),
                acceptedStudents: (statusMap.approved     || 0) + (statusMap.active       || 0),
                rejectedStudents:  statusMap.not_eligible || 0,
                totalPrograms:    parseInt(programsResult.rows[0].total)  || 0,
                draftPrograms:    parseInt(programsResult.rows[0].drafts) || 0,
            }
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};


const monitorApplications = async (req, res) => {
    try {
        const subAdminId = parseInt(req.user.id);

        // This revised query surfaces cross-applications regardless of their current status string
        const conflictsQuery = `
            SELECT 
                a.id,
                a.scholarship_id,
                a.status,
                a.created_at AS submitted_at,
                s.sfirst_name,
                s.slast_name,
                s.student_email,
                prog.title AS scholarship_name,
                (
                    SELECT o.org_name
                    FROM applications a2
                    JOIN scholarships s2 ON a2.scholarship_id = s2.id
                    JOIN sub_admins o ON s2.sub_admin_id = o.id
                    WHERE a2.student_id = a.student_id 
                      AND s2.sub_admin_id != $1
                    LIMIT 1
                ) AS conflicting_org
            FROM applications a
            JOIN students s ON s.id = a.student_id
            JOIN scholarships prog ON a.scholarship_id = prog.id
            WHERE prog.sub_admin_id = $1
              -- Triggers an indicator if they exist anywhere else at all
              AND EXISTS (
                  SELECT 1 
                  FROM applications a3
                  JOIN scholarships s3 ON a3.scholarship_id = s3.id
                  WHERE a3.student_id = a.student_id 
                    AND s3.sub_admin_id != $1
              )
            ORDER BY a.created_at DESC
        `;

        const result = await pool.query(conflictsQuery, [subAdminId]);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("Monitor Applications Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
// Add to exports:
module.exports = { 
    getDashboardStats,
    getOrgProfile, 
    updateOrgProfile, 
    updateProfilePicture,
    getOrgApplications,
    getOrgPrograms, 
    monitorApplications
};
const pool = require('../config/db');

// 1. Fetch Profile Info
const getOrgProfile = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id) || id === 'null') {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    try {
        const result = await pool.query(
            'SELECT org_name, sub_email, region, city, street_address,barangay, contact_number, website, org_pic, ability_level FROM sub_admins WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Org not found" });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
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



// Standardized exports
module.exports = { 
    getOrgProfile, 
    updateOrgProfile, 
    updateProfilePicture,
    getOrgApplications
};
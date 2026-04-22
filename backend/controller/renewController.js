const pool = require('../config/db');

// --- STUDENT ACTIONS ---

// Get notifications specifically for the student
const getStudentNotifications = async (req, res) => {
    try {
        const student_id = req.user.id; 
        const result = await pool.query(
            `SELECT n.*, a.status as app_status 
             FROM notifications n
             LEFT JOIN applications a ON n.application_id = a.id
             WHERE n.student_id = $1 
             ORDER BY n.created_at DESC`, 
            [student_id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// Get the specific requirements for a renewal application
const getRequirements = async (req, res) => {
    try {
        const { appId } = req.params;
        if (!appId || isNaN(appId)) return res.status(400).json({ success: false, message: "Invalid ID" });

        const result = await pool.query(
            'SELECT * FROM renewal_requirements WHERE application_id = $1 ORDER BY sort_order ASC',
            [appId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
};

const submit = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const student_id = req.user.id;
        const { appId, term, sy } = req.body;

        // 1. Update Academic Records - Set others to false, this one to true
        await client.query(
            `UPDATE academic_records SET is_current = false WHERE student_id = $1`, 
            [student_id]
        );
        await client.query(
            `INSERT INTO academic_records (student_id, gwa, term, school_year, is_current) 
             VALUES ($1, $2, $3, $4, $5)`, 
            [student_id, 0, term, sy, true]
        );

        // 2. Handle File Uploads (Matches renewal_requirements table)
        if (req.files) {
            for (const file of req.files) {
                // Extracts the ID from field_123
                const fieldId = file.fieldname.replace('field_', '');
                await client.query(
                    `UPDATE renewal_requirements SET status = 'submitted', file_path = $1 
                     WHERE application_id = $2 AND id = $3`,
                    [file.path, appId, fieldId]
                );
            }
        }

        // 3. Get the sub_admin_id (Org Admin) 
        const orgInfo = await client.query(
            `SELECT s.sub_admin_id FROM applications a 
             JOIN scholarships s ON a.scholarship_id = s.id 
             WHERE a.id = $1`, [appId]
        );

        if (orgInfo.rows.length === 0) throw new Error("Scholarship provider not found.");
        const targetSubAdminId = orgInfo.rows[0].sub_admin_id;

        // 4. Update Main Application Status
        await client.query(
            'UPDATE applications SET status = $1 WHERE id = $2', 
            ['renewal_under_review', appId]
        );

        // 5. Create Notification for Org (Sub-Admin)
        await client.query(
            `INSERT INTO notifications (org_id, title, message, application_id, is_read, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [targetSubAdminId, "New Renewal Submission", `Application #${appId} has submitted renewal documents.`, appId, false]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: "Submitted for review!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Submit Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    } finally { 
        client.release(); 
    }
};
// --- ORGANIZATION / ADMIN ACTIONS ---

// Combined Setup & Initiation Logic
const setup = async (req, res) => {
    const { appId } = req.params;
    const { targetTerm, targetSY, requirements } = req.body;
    const sub_admin_id = req.user.id; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const infoResult = await client.query(
            `SELECT a.student_id, s.title 
             FROM applications a 
             JOIN scholarships s ON a.scholarship_id = s.id 
             WHERE a.id = $1`,
            [appId]
        );

        if (infoResult.rows.length === 0) throw new Error("Application not found");
        const { student_id, title } = infoResult.rows[0];

        // 1. Manage Requirements
        await client.query('DELETE FROM renewal_requirements WHERE application_id = $1', [appId]);
        for (const item of requirements) {
            await client.query(
                `INSERT INTO renewal_requirements (application_id, field_label, is_required, sort_order) 
                 VALUES ($1, $2, $3, $4)`,
                [appId, item.field_label, item.is_required, item.sort_order]
            );
        }

        // 2. Update Status
        await client.query('UPDATE applications SET status = $1 WHERE id = $2', ['renewal_pending', appId]);

        // 3. Notify Student (Title matched to StudentNotification.jsx)
        const notifTitle = "Recommence Application Required";
        const notifMessage = `It's time to renew your scholarship for "${title}". Please upload requirements for ${targetTerm} (${targetSY}).`;

        await client.query(
            `INSERT INTO notifications (student_id, title, message, application_id) VALUES ($1, $2, $3, $4)`,
            [student_id, notifTitle, notifMessage, appId]
        );

        // 4. Audit Trail
        await client.query(
            `INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)`,
            [sub_admin_id, 'RENEWAL_INITIATED', `Org requested renewal for App #${appId}`]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: "Renewal requirements set and student notified!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: err.message });
    } finally { client.release(); }
};

const getOrgNotifications = async (req, res) => {
    try {
        // sub_admins ID from the token
        const subAdminId = req.user.id; 

        const result = await pool.query(
            `SELECT 
                n.id,
                n.title,
                n.message,
                n.created_at,
                n.application_id,
                n.is_read,
                s.sfirst_name, -- Matches your ERD
                s.slast_name   -- Matches your ERD
             FROM notifications n
             LEFT JOIN applications a ON n.application_id = a.id
             LEFT JOIN students s ON a.student_id = s.id
             WHERE n.org_id = $1 
             ORDER BY n.created_at DESC`,
            [subAdminId]
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

const approveRenewalSubmission = async (req, res) => {
    try {
        const { appId } = req.params;
        await pool.query("UPDATE applications SET status = 'approved' WHERE id = $1", [appId]);
        res.json({ success: true, message: "Renewal approved!" });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
};

module.exports = { 
    setup, 
    getRequirements, 
    submit, 
    getOrgNotifications, 
    getStudentNotifications, 
    approveRenewalSubmission 
};
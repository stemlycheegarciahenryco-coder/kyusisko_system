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
// ─── PASSWORD CHANGE (Forced on first login after approval) ──────────────────

const changePassword = async (req, res) => {
    const orgId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required." });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    try {
        const result = await pool.query(
            'SELECT sub_password FROM sub_admins WHERE id = $1',
            [orgId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found." });
        }

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].sub_password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: "New password must be different from your current password." });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE sub_admins 
             SET sub_password = $1, is_password_changed = TRUE 
             WHERE id = $2`,
            [hashed, orgId]
        );

        res.json({ success: true, message: "Password updated successfully." });
    } catch (err) {
        console.error("Change Password Error:", err.message);
        res.status(500).json({ error: "Failed to update password." });
    }
};

// ─── CO-ADMIN MANAGEMENT ─────────────────────────────────────────────────────

const addCoAdmin = async (req, res) => {
    const orgId = req.user.id;
    const { firstName, middleName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "First name, last name and email are required." });
    }

    try {
        // Only main org accounts can add co-admins
        const orgCheck = await pool.query(
            'SELECT account_type, org_name, sub_password FROM sub_admins WHERE id = $1',
            [orgId]
        );
        if (orgCheck.rows.length === 0) {
            return res.status(404).json({ error: "Organization not found." });
        }
        if (orgCheck.rows[0].account_type !== 'main') {
            return res.status(403).json({ error: "Co-admins cannot add other co-admins." });
        }

        const { org_name, sub_password } = orgCheck.rows[0];

        // Check email isn't already used anywhere in the system
        const emailCheck = await pool.query(
            `SELECT 'org' AS source FROM sub_admins WHERE sub_email = $1
             UNION ALL
             SELECT 'student' AS source FROM students WHERE student_email = $1
             UNION ALL
             SELECT 'admin' AS source FROM users WHERE email = $1
             LIMIT 1`,
            [email]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: "This email is already registered in the system." });
        }

        // Co-admin inherits the org's current hashed password
        // (they use the same password the main org is currently using)
        await pool.query(
            `INSERT INTO sub_admins (
                org_name, first_name, middle_name, last_name,
                sub_email, sub_password, is_active, status,
                proof_files, account_type, parent_org_id,
                is_password_changed
             ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'approved', $7, 'co_admin', $8, FALSE)`,
            [
                org_name,
                firstName,
                middleName || null,
                lastName,
                email,
                sub_password,       // inherits current hashed password
                JSON.stringify({}),
                orgId
            ]
        );

        // Send invite email to the co-admin
        const transporter = require('../config/mailer_resend');
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/rootlogin`;

        transporter.sendMail({
            from: `"KyusISKO" <${process.env.RESEND_FROM_EMAIL}>`,
            to: email,
            subject: `You've been added as a Co-Admin for ${org_name} — KyusISKO`,
            html: `
              <div style="font-family:'Inter',sans-serif; max-width:550px; background:#FFFCFB; border:1px solid #e2e8f0; border-radius:24px; padding:32px; color:#1e293b; margin:auto;">
                <p style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.2em; color:#093fb4; margin:0 0 4px 0;">Co-Admin Invitation</p>
                <h2 style="font-size:22px; font-weight:900; text-transform:uppercase; letter-spacing:-0.02em; color:#0f172a; margin:0 0 16px 0; font-style:italic;">You've Been Added</h2>
                <p style="font-size:14px; font-weight:500; line-height:1.6; color:#64748b;">
                  Hello <strong>${firstName} ${lastName}</strong>,<br/><br/>
                  You have been added as a Co-Admin for <strong>${org_name}</strong> on the KyusISKO Scholarship Portal.
                  You can log in using your email and the organization's current password.
                </p>
                <div style="background:#EEF2FF; border:1px solid #c7d2fe; border-radius:16px; padding:20px; margin:24px 0;">
                  <p style="font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#3730a3; margin:0 0 10px 0;">Your Login Details:</p>
                  <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e293b;">Email: <strong style="color:#093fb4;">${email}</strong></p>
                  <p style="margin:0; font-size:13px; font-weight:600; color:#1e293b;">Password: <strong style="color:#093fb4;">Same as the organization's current password</strong></p>
                </div>
                <div style="text-align:center; margin-bottom:24px;">
                  <a href="${loginUrl}" style="display:inline-block; background:#093fb4; color:#fff; text-decoration:none; padding:14px 32px; border-radius:12px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.15em;">
                    Log In to Dashboard
                  </a>
                </div>
                <hr style="border:0; border-top:1px solid #f1f5f9; margin-bottom:16px;"/>
                <p style="font-size:11px; font-weight:500; color:#94a3b8; text-align:center; margin:0;">
                  You were invited by the main organization admin. If this was unexpected, please ignore this email.
                </p>
              </div>
            `
        }).catch(err => console.error("Co-admin invite email failed:", err.message));

        res.status(201).json({ success: true, message: `Co-admin ${firstName} ${lastName} added and invite sent.` });
    } catch (err) {
        console.error("Add Co-Admin Error:", err.message);
        res.status(500).json({ error: "Failed to add co-admin." });
    }
};

const getCoAdmins = async (req, res) => {
    const orgId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT id, first_name, middle_name, last_name, sub_email, is_active, created_at
             FROM sub_admins
             WHERE parent_org_id = $1 AND account_type = 'co_admin'
             ORDER BY created_at DESC`,
            [orgId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Get Co-Admins Error:", err.message);
        res.status(500).json({ error: "Failed to fetch co-admins." });
    }
};

const removeCoAdmin = async (req, res) => {
    const orgId = req.user.id;
    const { coAdminId } = req.params;
    try {
        // Verify the co-admin actually belongs to this org
        const check = await pool.query(
            'SELECT id FROM sub_admins WHERE id = $1 AND parent_org_id = $2 AND account_type = $3',
            [coAdminId, orgId, 'co_admin']
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Co-admin not found or does not belong to your organization." });
        }
        await pool.query('DELETE FROM sub_admins WHERE id = $1', [coAdminId]);
        res.json({ success: true, message: "Co-admin removed." });
    } catch (err) {
        console.error("Remove Co-Admin Error:", err.message);
        res.status(500).json({ error: "Failed to remove co-admin." });
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
    monitorApplications,
    changePassword,
    addCoAdmin,
    getCoAdmins,
    removeCoAdmin
};
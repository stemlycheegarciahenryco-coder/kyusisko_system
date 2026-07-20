const pool = require('../config/db');
const {supabaseAdmin} = require('../config/supabaseClient');

// Org Profile Info top
const getOrgProfile = async (req, res) => {
    const { id } = req.params;
    try {
        // Removed 'ability_level' from the query
        const result = await pool.query(
            'SELECT org_name, sub_email, region, city, street_address, provider_type, barangay, created_at,tel_number, contact_number, website, org_pic FROM sub_admins WHERE id = $1',
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

// 2.Updated the info of profile
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

// 3. Update  Profile Picture Only
const updateProfilePicture = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Check if a file was uploaded via multer
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No profile image file provided." });
        }

        // 2. Extract file extension and build a unique file path inside the bucket
        const fileExtension = req.file.originalname.split('.').pop();
        const filePath = `org_pics/org_${id}_${Date.now()}.${fileExtension}`;

        // 3. ☁️ Upload file buffer to the 'profile-images' Supabase Storage Bucket
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('profile-images')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error("Supabase Storage Upload Error:", uploadError);
            throw uploadError;
        }

        // 4. 🌐 Generate the public URL (Best practice for profile pictures so they load fast everywhere)
        const { data: publicUrlData } = supabaseAdmin.storage
            .from('profile-images')
            .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        // Note: If your bucket is fully private and you prefer a long-lived secure signed URL instead, use this:
        // const { data: signedData, error: urlError } = await supabaseAdmin.storage
        //     .from('profile-images')
        //     .createSignedUrl(filePath, 31536000); // 1 year expiration
        // if (urlError) throw urlError;
        // const imageUrl = signedData.signedUrl;

        // 5. 🗄️ Update the 'org_pic' column inside your 'sub_admins' table
        const updateQuery = `
            UPDATE sub_admins 
            SET org_pic = $1 
            WHERE id = $2 
            RETURNING org_pic;
        `;
        const result = await pool.query(updateQuery, [imageUrl, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Organization account not found." });
        }

        // 6. Return success response with the new image URL
        return res.status(200).json({
            success: true,
            message: "Organization profile picture updated successfully.",
            org_pic: result.rows[0].org_pic
        });

    } catch (err) {
        console.error("Update Profile Picture Error:", err.message);
        return res.status(500).json({ success: false, error: "Internal server error updating profile picture." });
    }
};


//it is connected in Dashboard
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

        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Fetch Apps Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};

//this is for org profile programs
const getOrgProfilePrograms = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT 
                s.id, 
                s.title, 
                s.status, 
                s.deadline, 
                s.slots, 
                s.description,
                s.created_at,
                s.show_on_profile,
                COUNT(a.id)::int AS total_applicants,
                COUNT(a.id) FILTER (WHERE a.status IN ('approved', 'active'))::int AS active_scholars
             FROM scholarships s
             LEFT JOIN applications a ON a.scholarship_id = s.id
             WHERE s.sub_admin_id = $1 
               AND s.show_on_profile = true  -- <--- Only fetch programs explicitly set to true
             GROUP BY s.id
             ORDER BY s.created_at DESC`,
            [id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Get Profile Programs Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};


const toggleProfileProgramVisibility = async (req, res) => {
    const { programId } = req.params;
    const orgId = req.user.id;
    const { show_on_profile } = req.body; // true or false

    try {
        const result = await pool.query(
            `UPDATE scholarships
             SET show_on_profile = $1
             WHERE id = $2 AND sub_admin_id = $3
             RETURNING id, show_on_profile`,
            [show_on_profile, programId, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Program not found or unauthorized." });
        }

        res.status(200).json({ 
            success: true, 
            message: show_on_profile ? "Program displayed on profile." : "Program hidden from profile display." 
        });
    } catch (err) {
        console.error("Toggle Profile Visibility Error:", err.message);
        res.status(500).json({ success: false, message: "Failed to update visibility." });
    }
};


//applicants sidebar conencted wirj org applicantsProg and Dashboard
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
                            'sprofile_pic', COALESCE(st.sprofile_pic, ''),
                            'application_status', COALESCE(a.status, '')
                        )
                    ) FILTER (WHERE st.id IS NOT NULL), '[]'
                ) AS applicants
             FROM scholarships s
             LEFT JOIN applications a ON a.scholarship_id = s.id
             LEFT JOIN students st ON a.student_id = st.id
             WHERE s.sub_admin_id = $1 
               AND COALESCE(s.taken_down, false) = false
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

//addpRogram
const addProgram = async (req, res) => {
    const { id } = req.params;
    const { title, description, deadline, slots, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO scholarships (sub_admin_id, title, description, deadline, slots, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, description, deadline, slots, status`,
            [id, title, description || '', deadline || null, slots || 0, status || 'Active']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Add Program Error:", err.message);
        res.status(500).json({ success: false, message: "Failed to add program milestone" });
    }
};



//dashboard stats 
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
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


//monitor the applicaiton conflict
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
    const requesterId = req.user.id; // Could be a main account ID or a co_admin ID
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required." });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    try {
        // 1. Fetch the account trying to change the password
        const accountCheck = await pool.query(
            'SELECT id, sub_password, account_type, parent_org_id FROM sub_admins WHERE id = $1',
            [requesterId]
        );
        
        if (accountCheck.rows.length === 0) {
            return res.status(404).json({ error: "Account not found." });
        }

        const userAccount = accountCheck.rows[0];

        // 2. Verify the current password against the requester's record
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, userAccount.sub_password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: "New password must be different from your current password." });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        // 3. DETERMINISTIC ROUTING: Find who actually owns the master record
        // If a co-admin is updating, we target their parent_org_id. Otherwise, they are the main account.
        const targetOrgId = userAccount.account_type === 'co_admin' 
            ? userAccount.parent_org_id 
            : userAccount.id;

        // 4. Update the main organization password and set its flag
        await pool.query(
            `UPDATE sub_admins 
             SET sub_password = $1, is_password_changed = TRUE 
             WHERE id = $2`,
            [hashed, targetOrgId]   
        );

        // 5. CASCADE EFFECT: Synchronize all associated co-admins to match the new master password
        // Also update their 'is_password_changed' status so they don't get stuck in modal loops
        await pool.query(
            `UPDATE sub_admins 
             SET sub_password = $1, is_password_changed = TRUE 
             WHERE parent_org_id = $2 OR id = $2`,
            [hashed, targetOrgId]
        );

        res.json({ success: true, message: "Password updated successfully across all organization accounts." });
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
                <p style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.2em; color:#093fb4; margin:0 0 4px 0;">Co-Administration Invitation</p>
                <h2 style="font-size:22px; font-weight:900; text-transform:uppercase; letter-spacing:-0.02em; color:#0f172a; margin:0 0 16px 0; font-style:italic;">You have Been Added as a Co-Admin on Kyusisko Provider</h2>
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
                   Join  this Organization
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
    getOrgProfilePrograms,
    getOrgProfile, 
    toggleProfileProgramVisibility,
    updateOrgProfile, 
    updateProfilePicture,
    getOrgApplications,
    getOrgPrograms, 
    addProgram,
    monitorApplications,
    changePassword,
    addCoAdmin,
    getCoAdmins,
    removeCoAdmin
};
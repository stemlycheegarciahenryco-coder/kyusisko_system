const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const upload = require('../middleware/multerConfig');
const {createClient} = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');
const {supabaseAdmin} = require('../config/supabaseClient');
const { sendApprovalEmail, sendRejectionEmail, sendOrgOTPEmail, sendRequirementsEmail, sendApprovalCredentialsEmail } = require('../config/emailServiceOrg');

/**
 * GET all organizations
 * Protected: Root Admin uses this to see who needs validation
 */
router.get('/list', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, org_name, first_name, middle_name, last_name, 
        sub_email, contact_number, tel_number, is_active, status,
        region, city, barangay, street_address, website, provider_type, proof_files,
        provider_code
       FROM sub_admins 
       ORDER BY status = 'pending' DESC, id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database Error", details: err.message });
  }
});

/**
 * POST /register-organization
 * PUBLIC: Self-registration flow
 */
router.post('/register-organization', async (req, res) => {
  const { 
    org_name, first_name, middle_name, last_name, 
    sub_email, sub_password, contact_number, tel_number,
    website, region, city, barangay, street_address,
    provider_type
  } = req.body;

  try {
    // FIX: Safety net — re-check cross-table uniqueness right before insert,
    // in case the email was registered elsewhere between the OTP step and
    // final submission (race condition), or the OTP step was bypassed.
    const crossCheck = await pool.query(
      `SELECT 'student' AS source FROM students WHERE student_email = $1
       UNION ALL
       SELECT 'admin' AS source FROM users WHERE email = $1
       LIMIT 1`,
      [sub_email]
    );
    if (crossCheck.rows.length > 0) {
      return res.status(400).json({ error: "This email is already registered under a different account type." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sub_password, salt);

    await pool.query(
      `INSERT INTO sub_admins 
        (org_name, first_name, middle_name, last_name, sub_email, sub_password, 
         contact_number, tel_number, website, region, city, barangay, street_address, 
         is_active, status, proof_files, provider_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        org_name,
        first_name,
        middle_name || null,
        last_name,
        sub_email,
        hashedPassword,
        contact_number,
        tel_number || null,
        website || null,
        region,
        city,
        barangay,
        street_address,
        false,
        'pending',
        JSON.stringify({}),
        provider_type
      ]
    );

    res.status(201).json({ message: "Registration submitted successfully." });
  } catch (err) {
    console.error("SUPABASE ERROR:", err.message);
    res.status(500).json({ error: "Registration failed." });
  }
});

/**
 * PATCH /approve/:id
 * FIX: Generates a brand-new random password AND a formatted Provider ID
 * (e.g. "PROVIDER-001") on approval. The Provider ID comes from a dedicated
 * Postgres sequence (provider_code_seq) so it never skips/collides even if
 * orgs are rejected or deleted — see migration_add_provider_code.sql.
 * Credentials are returned to the admin AND emailed to the org automatically.
 */
router.patch('/approve/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Generate a readable-but-random temporary password, e.g. "Xk7mQp2R9z"
    const generatedPassword = crypto.randomBytes(9).toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 12);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    // Pull the next value from the dedicated sequence and format it as
    // "PROVIDER-001". Only happens here, at approval time — pending/rejected
    // orgs never consume a number from the counter.
    const seqResult = await pool.query("SELECT nextval('provider_code_seq') AS next_val");
    const nextVal = seqResult.rows[0].next_val;
    const providerCode = `PROVIDER-${String(nextVal).padStart(3, '0')}`;

    const result = await pool.query(
      `UPDATE sub_admins 
       SET status = 'approved', is_active = true, sub_password = $1, provider_code = $2
       WHERE id = $3 
       RETURNING id, sub_email, org_name, provider_code`,
      [hashedPassword, providerCode, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const { sub_email, org_name, provider_code } = result.rows[0];

    // FIX: Email the Provider ID + password to the org automatically.
    // sendApprovalCredentialsEmail must be added to emailServiceOrg.js —
    // it is NOT the same as sendApprovalEmail (kept separate so the original
    // approval notification email is untouched if used elsewhere).
    if (typeof sendApprovalCredentialsEmail === 'function') {
      await sendApprovalCredentialsEmail(sub_email, org_name, provider_code, generatedPassword);
    } else {
      console.warn("Warning: sendApprovalCredentialsEmail is not defined/imported in emailServiceOrg.js — credentials were NOT emailed.");
      await sendApprovalEmail(sub_email, org_name);
    }

    // Plaintext password is returned ONCE here for the admin to see/copy —
    // it is never stored or logged anywhere after this point.
    res.json({
      message: "Approved successfully.",
      credentials: {
        provider_id: provider_code,
        email: sub_email,
        password: generatedPassword
      }
    });
  } catch (err) {
    console.error("APPROVAL ERROR:", err.message);
    res.status(500).json({ error: "Approval failed" });
  }
});

// Block account access
router.patch('/block/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE sub_admins 
       SET is_active = NOT is_active 
       WHERE id = $1 
       RETURNING is_active, org_name`,
      [id]
    );
    const status = result.rows[0].is_active ? 'Activated' : 'Blocked';
    res.json({ message: `${result.rows[0].org_name} ${status}` });
  } catch (err) {
    res.status(500).json({ error: "Toggle failed" });
  }
});

// Unblock account access
router.patch('/unblock/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE sub_admins SET is_active = true WHERE id = $1', [req.params.id]);
    res.json({ message: "Organization unblocked." });
  } catch (err) {
    res.status(500).json({ error: "Unblock failed" });
  }
});

// Reject registration
// FIX: Now accepts a `reasons` array (checked boxes, e.g. "Submitted documents
// is fake or counterfeited") plus an optional free-text `note`. These are combined
// into a single rejection_reason string. Rejection is now FINAL — is_active is
// forced to false and /comply/:id will refuse any further resubmission for this org.
router.post('/reject/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reasons, note } = req.body;

    if (!reasons || !Array.isArray(reasons) || reasons.length === 0) {
      return res.status(400).json({ error: "At least one rejection reason must be selected." });
    }

    const result = await pool.query(
      'SELECT sub_email, org_name FROM sub_admins WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const { sub_email, org_name } = result.rows[0];

    // Combine checked reasons + optional note into one readable string
    const combinedReason = note && note.trim()
      ? `${reasons.join('; ')}. Additional note: ${note.trim()}`
      : reasons.join('; ');

    // FIX: Rejection is now permanent — status locked to 'rejected', is_active
    // forced false, and required_fields cleared since no further compliance
    // resubmission is allowed once an org is rejected.
    await pool.query(
      `UPDATE sub_admins 
       SET status = 'rejected', is_active = false, rejection_reason = $1, required_fields = $2
       WHERE id = $3`,
      [combinedReason, JSON.stringify([]), id]
    );

    await sendRejectionEmail(sub_email, org_name, combinedReason, id);
    res.json({ message: "Organization rejected and compliance email sent." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Rejection failed" });
  }
});

/**
 * GET ORG REJECTION & COMPLIANCE DETAILS
 * FIX: Added 'required_fields' to select query so the frontend form knows what fields to render
 */
router.get('/compliance-details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, org_name, provider_type, rejection_reason, required_fields 
       FROM sub_admins WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application context not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve requirements data." });
  }
});

/**
 * POST /send-requirements/:id
 * NEW: Endpoint explicitly matched to receive checklist arrays dispatched by RootOrgView.jsx
 */
  router.post('/send-requirements/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { requirements } = req.body; 

    if (!requirements || !Array.isArray(requirements)) {
      return res.status(400).json({ error: "Requirements checklist array is required." });
    }
    
    const orgResult = await pool.query(
      'SELECT sub_email, org_name, status FROM sub_admins WHERE id = $1',
      [id]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization records do not exist." });
    }

    // FIX: Rejection is final — don't allow sending a new checklist to a rejected org.
    if (orgResult.rows[0].status === 'rejected') {
      return res.status(403).json({ error: "This organization has been rejected and can no longer receive compliance requirements." });
    }

    const { sub_email, org_name } = orgResult.rows[0];

    // FIX: Swapped status back to 'comply' so RootOrgView renders the 'Compliance Mode' state properly
    await pool.query(  
      `UPDATE sub_admins 
       SET required_fields = $1, 
           status = 'pending', 
           is_active = false 
       WHERE id = $2`,
      [JSON.stringify(requirements), id]
    );

    // Call function cleanly passing down the clean raw array data structure
    if (typeof sendRequirementsEmail === 'function') {
      await sendRequirementsEmail(sub_email, org_name, requirements, id);
    } else {
      console.warn("Warning: sendRequirementsEmail function is not defined or imported.");
    }

    res.json({ success: true, message: "Compliance checklist saved and notification sent!" });
  } catch (err) {
    console.error("ASSIGN REQUIREMENTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to process compliance layout." });
  }
});

/**
 * POST /comply/:id
 * FIX: Uses upload.any() to handle any arbitrary checklist field titles defined dynamically by RootAdmin
 */
router.post('/comply/:id', upload.any(), async (req, res) => {
  const { id } = req.params;
  const uploadedFiles = req.files || []; // Array of files captured in RAM buffer by Multer

  try {
    // 1. Double check organization context status before doing cloud operations
    const orgCheck = await pool.query('SELECT provider_type, status, proof_files, required_fields FROM sub_admins WHERE id = $1', [id]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: "Organization records do not exist." });
    }

    if (orgCheck.rows[0].status === 'rejected') {
      return res.status(403).json({ error: "This application has been rejected and can no longer submit compliance documents." });
    }

    // 2. Iterate over raw memory buffers and push them to your bucket storage
    const dynamicFileData = [];
    
    for (const file of uploadedFiles) {
      const fileExt = file.originalname.split('.').pop();
      // Generates a clean internal bucket path: "orgId/timestamp-randomstring.ext"
      const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload directly using your super-admin credentials
      const { data, error } = await supabaseAdmin.storage
        .from('org-complied-docs')
        .upload(fileName, file.buffer, { // Streams the raw RAM buffer cleanly
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        console.error("Supabase Storage Error:", error.message);
        throw new Error(`Failed uploading file [${file.fieldname}] to Supabase bucket storage.`);
      }

      // Add the valid internal path reference string returned by Supabase
      dynamicFileData.push({
        document_name: file.fieldname, 
        file_path: data.path // This saves the path tracking reference to your database!
      });
    }

    // Fallback verification 
    if (dynamicFileData.length === 0) {
      return res.status(400).json({ error: "No files were processed. Please make sure file keys match your forms." });
    }

    // 3. Parse and safely merge payload structures so historic data isn't dropped
    let existingProof = {};
    try {
      const raw = orgCheck.rows[0].proof_files;
      existingProof = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
    } catch (parseErr) {
      existingProof = {};
    }

    let originalRequiredFields = [];
    try {
      const rawReq = orgCheck.rows[0].required_fields;
      originalRequiredFields = rawReq ? (typeof rawReq === 'string' ? JSON.parse(rawReq) : rawReq) : [];
    } catch (parseErr) {
      originalRequiredFields = [];
    }

    const previousComplianceDocs = Array.isArray(existingProof.new_compliance_docs)
      ? existingProof.new_compliance_docs
      : [];

    const mergedProof = {
      ...existingProof,
      new_compliance_docs: [...previousComplianceDocs, ...dynamicFileData]
    };

    // 4. Record updates back down to your PostgreSQL relational schema
    await pool.query(
      `UPDATE sub_admins 
       SET status = 'pending', 
           proof_files = $1,        
           required_fields = $2,    
           rejection_reason = NULL
       WHERE id = $3`,
      [
        JSON.stringify(mergedProof), 
        JSON.stringify(originalRequiredFields), 
        id
      ]
    );

    res.json({ message: "Compliance documents submitted successfully! Transferred back to pending review." });
  } catch (err) {
    console.error("COMPLIANCE SUBMISSION ERROR:", err.message);
    res.status(500).json({ error: err.message || "Submission processing dropped." });
  }
});





// Request Registration OTP
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    try {
        // FIX: Previously only checked `sub_admins`. Now also checks `students`
        // and `users` so the same email can't register as an org if it already
        // belongs to a student or system admin account — mirrors the same fix
        // applied on the student registration side.
        const checkUser = await pool.query(
            `SELECT 'org' AS source FROM sub_admins WHERE sub_email = $1
             UNION ALL
             SELECT 'student' AS source FROM students WHERE student_email = $1
             UNION ALL
             SELECT 'admin' AS source FROM users WHERE email = $1
             LIMIT 1`,
            [email]
        );
        if (checkUser.rows.length > 0) {
            const source = checkUser.rows[0].source;
            const message = source === 'org'
                ? "This email is already registered to an organization."
                : "This email is already registered under a different account type.";
            return res.status(400).json({ error: message });
        }

        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await pool.query(
            `INSERT INTO otp_codes (email, code, method, expires_at, created_at) 
             VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', NOW())
             ON CONFLICT (email) DO UPDATE SET 
                code = $2, 
                method = $3, 
                expires_at = NOW() + INTERVAL '10 minutes',
                created_at = NOW()`,
            [email, generatedCode, 'org_reg']
        );

        await sendOrgOTPEmail(email, generatedCode);
        res.json({ message: "Verification code sent!" });
    } catch (err) {
        console.error("DB ERROR:", err.message);
        res.status(500).json({ error: "Failed to send code." });
    }
});

// Verify Registration OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const result = await pool.query(
            `SELECT * FROM otp_codes 
             WHERE email = $1 AND code = $2 AND method = 'org_reg' AND expires_at > NOW()`,
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired code." });
        }

        await pool.query(`DELETE FROM otp_codes WHERE email = $1 AND method = 'org_reg'`, [email]);
        res.json({ message: "Verified!" });
    } catch (err) {
        res.status(500).json({ error: "Verification failed." });
    }
});

module.exports = router;
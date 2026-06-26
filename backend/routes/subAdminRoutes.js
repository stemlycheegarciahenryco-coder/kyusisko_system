const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/multerConfig');
const { verifyToken } = require('../middleware/auth');
const { sendApprovalEmail, sendRejectionEmail, sendOrgOTPEmail, sendRequirementsEmail } = require('../config/emailServiceOrg');

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
        region, city, barangay, street_address, website, provider_type, proof_files
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
 */
router.patch('/approve/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE sub_admins 
       SET status = 'approved', is_active = true 
       WHERE id = $1 
       RETURNING sub_email, org_name`,
      [id]
    );

    if (result.rows.length > 0) {
      const { sub_email, org_name } = result.rows[0];
      await sendApprovalEmail(sub_email, org_name);
    }
    res.json({ message: "Approved successfully." });
  } catch (err) {
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
router.post('/reject/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      'SELECT sub_email, org_name FROM sub_admins WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const { sub_email, org_name } = result.rows[0];

    await pool.query(
      `UPDATE sub_admins 
       SET status = 'rejected', is_active = false, rejection_reason = $1 
       WHERE id = $2`,
      [reason, id]
    );

    await sendRejectionEmail(sub_email, org_name, reason, id);
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
      'SELECT sub_email, org_name FROM sub_admins WHERE id = $1',
      [id]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization records do not exist." });
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
  const uploadedFiles = req.files || [];

  // Structure the detailed file data for proof_files column (with storage paths)
  const dynamicFileData = uploadedFiles.map(file => ({
    document_name: file.fieldname, // E.g., "Mayor's Business Permit"
    file_path: file.path           // E.g., "uploads/compliance-17194.png"
  }));

  // Map the text strings of the uploaded items to store inside required_fields
  const uploadedFieldNames = uploadedFiles.map(file => file.fieldname); // E.g., ["Mayor's Business Permit"]

  try {
    // FIX: also pull existing proof_files AND required_fields so we can MERGE
    // rather than overwrite either of them.
    const orgCheck = await pool.query('SELECT provider_type, proof_files, required_fields FROM sub_admins WHERE id = $1', [id]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: "Organization records do not exist." });
    }

    // Parse whatever is already stored (string, object, null, or empty)
    let existingProof = {};
    try {
      const raw = orgCheck.rows[0].proof_files;
      existingProof = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
    } catch (parseErr) {
      console.warn("Could not parse existing proof_files, starting fresh:", parseErr.message);
      existingProof = {};
    }

    // FIX: parse the ORIGINAL checklist the admin sent (e.g. "MOA"). This is what
    // was getting blown away — required_fields was being replaced with
    // uploadedFieldNames, which is empty/partial whenever the org skips a field
    // or a file input's fieldname doesn't exactly match the requirement string.
    let originalRequiredFields = [];
    try {
      const rawReq = orgCheck.rows[0].required_fields;
      originalRequiredFields = rawReq
        ? (typeof rawReq === 'string' ? JSON.parse(rawReq) : rawReq)
        : [];
      if (!Array.isArray(originalRequiredFields)) originalRequiredFields = [];
    } catch (parseErr) {
      console.warn("Could not parse existing required_fields:", parseErr.message);
      originalRequiredFields = [];
    }

    // FIX: append new compliance docs to any previously uploaded ones instead of
    // discarding them. This was the cause of documents "disappearing" in RootOrgView —
    // every resubmission replaced proof_files entirely instead of adding to it.
    const previousComplianceDocs = Array.isArray(existingProof.new_compliance_docs)
      ? existingProof.new_compliance_docs
      : [];

    const mergedProof = {
      ...existingProof,
      new_compliance_docs: [...previousComplianceDocs, ...dynamicFileData]
    };

    // Move status back to 'pending'. This triggers 'isResubmitted' on your frontend automatically!
    // FIX: required_fields now keeps the ADMIN'S ORIGINAL checklist (e.g. "MOA") intact.
    // We no longer overwrite it with uploadedFieldNames, since that list is empty/partial
    // whenever an org skips a field — which was collapsing required_fields to [].
    await pool.query(
      `UPDATE sub_admins 
       SET status = 'pending', 
           proof_files = $1,        -- Merged: keeps old + new file references intact
           required_fields = $2,    -- Preserved: admin's original checklist, never derived from uploads
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
    res.status(500).json({ error: "Submission processing dropped." });
  }
});

// Request Registration OTP
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const checkUser = await pool.query('SELECT id FROM sub_admins WHERE sub_email = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ 
                error: "This email is already registered to an organization." 
            });
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
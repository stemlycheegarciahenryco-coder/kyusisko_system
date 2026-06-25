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

// Multer config fields for the separate compliance route down below
const uploadFields = upload.fields([
  { name: 'proof', maxCount: 5 },
  { name: 'sec_file', maxCount: 5 }, 
  { name: 'valid_id', maxCount: 5 }
]); 

/**
 * POST /register-organization
 * PUBLIC: Self-registration flow (Pure text data payload, no uploads here)
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

    // 17 exact placeholders mapped to your Supabase schema columns
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
        tel_number || null, // Saves as NULL in Supabase if the user leaves it blank
        website || null,
        region,
        city,
        barangay,
        street_address,
        false,              // is_active
        'pending',          // status
        JSON.stringify({}),  // proof_files text column initialized as an empty object string
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

// block their access of account
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

// unblock their access of account 
router.patch('/unblock/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE sub_admins SET is_active = true WHERE id = $1', [req.params.id]);
    res.json({ message: "Organization unblocked." });
  } catch (err) {
    res.status(500).json({ error: "Unblock failed" });
  }
});

// reject function for their registration
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

// GET ORG REJECTION DETAILS
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
 * POST /comply/:id
 * ASYNC SYSTEM ADMIN COMPLIANCE FLOW: This handles file uploads after review!
 */
router.post('/comply/:id', upload.any(), async (req, res) => {
  const { id } = req.params;
  
  // Since we use upload.any(), files are returned as an array in req.files
  // Map all uploaded dynamic files into a clean object structure
  const dynamicFileData = req.files.map(file => ({
    document_name: file.fieldname,
    file_path: file.path
  }));

  try {
    // ... Validation logic ...

    await pool.query(
      `UPDATE sub_admins 
       SET status = 'pending', 
           proof_files = $1,
           rejection_reason = NULL,
           required_fields = '[]' -- Clear the checklist after compliance
       WHERE id = $2`,
      [JSON.stringify({ new_compliance_docs: dynamicFileData }), id]
    );

    res.json({ message: "Compliance documents resubmitted successfully! Back under review." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Submission processing dropped." });
  }
});

router.patch('/resubmit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE sub_admins SET status = 'pending' WHERE id = $1`,
      [id]
    );
    res.json({ message: "Resubmitted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Resubmission failed" });
  }
});

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


router.post('/send-requirements/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { requirements } = req.body; 

    if (!requirements || !Array.isArray(requirements)) {
      return res.status(400).json({ error: "Requirements checklist array is required." });
    }

    // 1. Update the database record
    // We set status to 'rejected' to trigger your compliance frontend UI, 
    // but we use a friendly 'rejection_reason' internally.
    const result = await pool.query(  
      `UPDATE sub_admins 
       SET required_fields = $1, 
           status = 'pending', 
           is_active = false, 
           rejection_reason = 'Pending additional requested documents.'
       WHERE id = $2 
       RETURNING sub_email, org_name`,
      [JSON.stringify(requirements), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const { sub_email, org_name } = result.rows[0];

    // 2. Build a beautifully formatted HTML list specifically designed for the new email template
    const formattedRequirementsHtml = `
      <ul style="margin: 0; padding-left: 20px; font-family: sans-serif; font-size: 13px; color: #3730a3; font-weight: 600; line-height: 1.8;">
        ${requirements.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;

    // 3. Dispatch the new dedicated Requirements Email
    await sendRequirementsEmail(sub_email, org_name, formattedRequirementsHtml, id);

    res.json({ 
      success: true, 
      message: `Requirements successfully assigned and emailed to ${org_name}.` 
    });

  } catch (err) {
    console.error("ASSIGN REQUIREMENTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to process compliance requirement dispatch.", details: err.message });
  }
});

module.exports = router;
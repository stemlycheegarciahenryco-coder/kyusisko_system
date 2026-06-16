const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/multerConfig');
const { verifyToken } = require('../middleware/auth');
const { sendApprovalEmail, sendRejectionEmail, sendOrgOTPEmail } = require('../config/emailServiceOrg');

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

// block
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

// unblock
router.patch('/unblock/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE sub_admins SET is_active = true WHERE id = $1', [req.params.id]);
    res.json({ message: "Organization unblocked." });
  } catch (err) {
    res.status(500).json({ error: "Unblock failed" });
  }
});

// reject
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
      `SELECT id, org_name, provider_type, rejection_reason 
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
router.post('/comply/:id', uploadFields, async (req, res) => {
  const { id } = req.params;
  const files = req.files || {};

  const fileData = {
    proof_files: files.proof ? files.proof.map(f => f.path) : [],
    sec_files: files.sec_file ? files.sec_file.map(f => f.path) : [],
    valid_ids: files.valid_id ? files.valid_id.map(f => f.path) : []
  };

  try {
    const orgCheck = await pool.query('SELECT provider_type FROM sub_admins WHERE id = $1', [id]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: "Organization records do not exist." });
    }

    const provider_type = orgCheck.rows[0].provider_type;

    if (provider_type === "INDIVIDUAL" && fileData.valid_ids.length === 0) {
      return res.status(400).json({ error: "Valid ID update is required." });
    }
    if ((provider_type === "LGU" || provider_type === "NGO") &&
        (fileData.proof_files.length === 0 || fileData.sec_files.length === 0)) {
      return res.status(400).json({ error: "Proof and SEC Certificate revisions are required." });
    }

    await pool.query(
      `UPDATE sub_admins 
       SET status = 'pending', 
           proof_files = $1,
           rejection_reason = NULL 
       WHERE id = $2`,
      [JSON.stringify(fileData), id]
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

module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { sendApprovalEmail, sendRejectionEmail } = require('../config/emailServiceOrg');
/**
 * GET all organizations
 * Protected: Root Admin uses this to see who needs validation
 */
// GET all sub-admins for the Root Admin dashboard
router.get('/list', verifyToken, async (req, res) => {
  try {
    // We select ONLY the columns we know exist based on your registration logic
    const result = await pool.query(
      `SELECT 
        id, 
        org_name, 
        first_name, 
        middle_name, 
        last_name, 
        sub_email, 
        contact_number, 
        is_active, 
        region, 
        city, 
        barangay, 
        street_address,
        website
       FROM sub_admins 
       ORDER BY is_active ASC, id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    // This will help you catch any other missing columns immediately
    console.error("GET sub_admins DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
});

/**
 * POST /register-organization
 * PUBLIC: Self-registration flow (Pending Admin Approval)
 */
router.post('/register-organization', async (req, res) => {
  const { 
    org_name, first_name, middle_name, last_name, 
    sub_email, sub_password, contact_number,
    website, region, city, barangay, street_address 
  } = req.body;

  if (!org_name || !sub_email || !sub_password) {
    return res.status(400).json({ error: "Required fields are missing." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sub_password, salt);

    const newUser = await pool.query(
      `INSERT INTO sub_admins 
        (org_name, first_name, middle_name, last_name, sub_email, sub_password, 
         contact_number, website, region, city, barangay, street_address, 
         ability_level, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING id, org_name`,
      [
        org_name, first_name, middle_name || null, last_name, 
        sub_email, hashedPassword, contact_number, website || null,
        region, city, barangay, street_address, 
        '1',    // ability_level 1 (Sub-admin/Donor)
        false   // is_active false (Pending Root Admin Approval)
      ]
    );

    res.status(201).json({ 
      message: "Registration submitted! Please wait for Root Admin validation." 
    });
  } catch (err) {
    console.error("Registration Error:", err.message);
    if (err.code === '23505') {
        return res.status(400).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: "Registration failed." });
  }
});

/**
 * PATCH /approve/:id
 * Protected: Root Admin approves an organization
 */
router.patch('/approve/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE sub_admins SET is_active = true WHERE id = $1 RETURNING sub_email, org_name',
      [id]
    );

    if (result.rows.length > 0) {
      const { sub_email, org_name } = result.rows[0];
      await sendApprovalEmail(sub_email, org_name); // Trigger Success Email
    }

    res.json({ message: "Organization approved and notified." });
  } catch (err) {
    res.status(500).json({ error: "Approval failed" });
  }
});
router.post('/reject/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      'SELECT sub_email, org_name FROM sub_admins WHERE id = $1',
      [id]
    );

    if (result.rows.length > 0) {
      const { sub_email, org_name } = result.rows[0];
      await sendRejectionEmail(sub_email, org_name, reason); // Trigger Rejection Email
      
      // Optionally delete the pending record so they can try again
      await pool.query('DELETE FROM sub_admins WHERE id = $1', [id]);
    }

    res.json({ message: "Organization rejected and notified." });
  } catch (err) {
    res.status(500).json({ error: "Rejection failed" });
  }
});

module.exports = router;
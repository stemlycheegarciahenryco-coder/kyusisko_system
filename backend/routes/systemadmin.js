const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db'); 
const { verifyToken } = require('../middleware/auth'); 

/**
 * @route   POST /api/system-admin/create-co-admin
 * @desc    Create a new co-admin account using unique UID tracking values (Root Admin Only)
 */
router.post('/create-co-admin', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Only the absolute System Admin can add administrators.' });
    }

    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const hashedPw = await bcrypt.hash(password, 10);
        
        // 🚀 CRITICAL ALIGNMENT: Modified prefix token string to output 'SADM-' tracking keys 
        // This makes sure new Co-Admins match the frontend Login format rule
        const customUid = `SADM-${Date.now().toString().slice(-4)}`; 

        const newAdmin = await pool.query(
            `INSERT INTO users (email, password_hash, role, uid, account_status, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, email, uid, role, account_status, first_name, last_name`,
            [email.trim().toLowerCase(), hashedPw, 'co_admin', customUid, 'active', firstName.trim(), lastName.trim()]
        );

        res.status(201).json({ success: true, data: newAdmin.rows[0] });
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(400).json({ success: false, message: 'Email address or System ID conflict detected.' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   PATCH /api/system-admin/toggle-status/:id
 * @desc    Block or unblock a co-admin account (Root Admin Only)
 */
router.patch('/toggle-status/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to Root Admin.' });
    }

    const { id } = req.params;
    const { status } = req.body; 

    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid target status.' });
    }

    try {
        const checkTarget = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        
        if (checkTarget.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin account not found.' });
        }

        if (checkTarget.rows[0].role === 'root_admin') {
            return res.status(400).json({ success: false, message: 'Root Admin structural accounts cannot be blocked.' });
        }

        await pool.query(
            'UPDATE users SET account_status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({ success: true, message: `Account status updated successfully to ${status}.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   GET /api/system-admin/co-admins
 * @desc    Fetch list of all co-admins including their assigned tracking IDs (Root Admin Only)
 */
router.get('/co-admins', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden access.' });
    }

    try {
        const result = await pool.query(
            `SELECT id, email, uid, account_status, first_name, last_name 
             FROM users 
             WHERE role = 'co_admin' 
             ORDER BY id DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
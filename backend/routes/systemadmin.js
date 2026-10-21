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

// Delete Reports
router.delete('/reports/delete/:id', verifyToken, async (req, res) => {
})

//Report Archive
router.patch('/reports/archive/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE reports 
             SET is_archived = NOT is_archived 
             WHERE id = $1 
             RETURNING id, is_archived`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Co-Admin not found" });
        }

        const reports = result.rows[0];
        const statusText = reports.is_archived ? 'archived' : 'unarchived';

        res.json({
            message: `Report successfully ${statusText}.`,
            data: {
                id: reports.id,
                isArchived: reports.is_archived
            }
        });
    } catch (err) {
        console.error("Archive error:", err);
        res.status(500).json({ error: "Failed to update archive status" });
    }
});



// Get Snapshot Student
router.get('/get/Student/snapshots/instance', verifyToken, async (req, res) => {
})
router.get('/get/Student/snapshot_items/:id', verifyToken, async (req, res) => {
})


// Archive Student
router.patch('/student/archive/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE students 
             SET is_archived = NOT is_archived 
             WHERE id = $1 
             RETURNING id, is_archived`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Co-Admin not found" });
        }

        const student = result.rows[0];
        const statusText = student.is_archived ? 'archived' : 'unarchived';

        res.json({
            message: `${student.name} successfully ${statusText}.`,
            data: {
                id: student.id,
                isArchived: student.is_archived
            }
        });
    } catch (err) {
        console.error("Archive error:", err);
        res.status(500).json({ error: "Failed to update archive status" });
    }
});

router.get('/get/student/archive', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                student_email, 
                sfirst_name, 
                slast_name,
                scontact_number,
                sis_active,
                is_archived,
                CASE 
                    WHEN is_profile_complete = true THEN 'Registered' 
                    ELSE 'Pending' 
                END as derived_status,
                CONCAT(sstreet, ', ', sbarangay, ', ', sdistrict, ' ', szip_code) as full_address
            FROM students WHERE is_archived = true
            ORDER BY id DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ error: "Failed to fetch student logs" });
    }
})

// Delete CoAdmin
router.delete('/delete/:id', verifyToken, async (req, res) => {
})

// Archive CoAdmin
router.patch('/archive/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE users 
             SET is_archived = NOT is_archived 
             WHERE id = $1 
             RETURNING id, last_name, is_archived`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Co-Admin not found" });
        }

        const subAdmin = result.rows[0];
        const statusText = subAdmin.is_archived ? 'archived' : 'unarchived';

        res.json({
            message: `${subAdmin.org_name} successfully ${statusText}.`,
            data: {
                id: subAdmin.id,
                isArchived: subAdmin.is_archived
            }
        });
    } catch (err) {
        console.error("Archive error:", err);
        res.status(500).json({ error: "Failed to update archive status" });
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
            `SELECT id, email, uid, account_status, first_name, last_name, is_archived
             FROM users 
             WHERE role = 'co_admin' 
             ORDER BY id DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/get/archive/co-admins', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden access.' });
    }

    try {
        const result = await pool.query(
            `SELECT id, email, uid, account_status, first_name, last_name, is_archived
             FROM users 
             WHERE role = 'co_admin' AND is_archived = true 
             ORDER BY id DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Snapshot CoAdmin
router.get('/get/CoAdmin/snapshots/instance', verifyToken, async (req, res) => {
})
router.get('/get/CoAdmins/snapshot_items/:id', verifyToken, async (req, res) => {
})

router.get('/get/co-admins/archive', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden access.' });
    }

    try {
        const result = await pool.query(
            `SELECT id, email, uid, account_status, first_name, last_name, is_archived
             FROM users 
             WHERE role = 'co_admin' AND is_archived = true 
             ORDER BY id DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/co-admins/delete/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to Root Admin.' });
    }
    const { id } = req.params;
    try {
        const checkTarget = await pool.query('SELECT role FROM users WHERE id = $1', [id]);

        if (checkTarget.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin account not found.' });
        }

        if (checkTarget.rows[0].role === 'root_admin') {
            return res.status(400).json({ success: false, message: 'Root Admin structural accounts cannot be blocked.' });
        }

        await pool.query(
            'Delete FROM users WHERE id = $1 AND is_archived = true',
            [id]
        );

        res.json({ success: true, message: `Account Is Deleted.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



module.exports = router;

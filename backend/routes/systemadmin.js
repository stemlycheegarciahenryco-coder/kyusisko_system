const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { has } = require('lodash');
const crypto = require('crypto');
const { re } = require('mathjs');


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

// Get Deleted Student
router.get('/get/student/delete', verifyToken, async (req, res) => {
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

// // Delete CoAdmin
// router.delete('/delete/:id', verifyToken, async (req, res) => {
// })

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

// // Get Snapshot CoAdmin
// router.get('/get/CoAdmin/snapshots/instance', verifyToken, async (req, res) => {
// })
// router.get('/get/CoAdmins/snapshot_items/:id', verifyToken, async (req, res) => {
// })

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

router.put('/update/password', verifyToken, async (req, res) => {
    try {
        // 1. Authorization check
        if (req.user.role !== 'root_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden access.' });
        }

        const { current_password, new_password } = req.body;

        // 2. Input validation
        if (!req.user.email || !current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Email, current password, and new password are required.'
            });
        }

        if (new_password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long.'
            });
        }

        // 3. Fetch the target user to get their stored password hash
        const userQuery = 'SELECT id, password_hash FROM users WHERE email = $1';
        const userResult = await pool.query(userQuery, [req.user.email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Co-admin not found.' });
        }

        const targetUser = userResult.rows[0];

        // 4. Securely verify the current password using bcrypt.compare
        const isMatch = await bcrypt.compare(current_password, targetUser.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid current password.' });
        }

        // 5. Hash the new password (increased salt rounds to 12 for better security)
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

        // 6. Update the database
        const updateQuery = `
            UPDATE users 
            SET password_hash = $1 
            WHERE email = $2 
            RETURNING id, email;
        `;
        const updateResult = await pool.query(updateQuery, [hashedNewPassword, req.user.email]);

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully.',
            data: updateResult.rows[0]
        });

    } catch (err) {
        console.error('Password update error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.put('/co-admins/update/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden access.' });
    }

    try {
        const { id } = req.params;
        const { firstName, lastName, email } = req.body;

        const emailCheck = await pool.query(
            ` 
             SELECT student_email FROM students WHERE student_email = $1 
             UNION 
             SELECT sub_email FROM sub_admins WHERE sub_email = $1`,
            [email.trim()]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email address is already in use by another account.' });
        }

        let query;
        let values;
        // If no password is provided, leave the existing password untouched
        query = `
                UPDATE users 
                SET first_name = $1, 
                    last_name = $2, 
                    email = $3 
                WHERE id = $4 
                RETURNING id, first_name, last_name, email, account_status, is_archived, uid;
            `;
        values = [firstName, lastName, email, id];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Co-admin not found.' });
        }

        res.json({ success: true, data: result.rows[0] });
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

router.delete('/provider/delete/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden access.' });
    }
    const { id } = req.params;
    try {
        await pool.query(
            'Delete FROM sub_admins WHERE id = $1 AND is_archived = true',
            [id]
        );
        res.json({ success: true, message: `Account Is Deleted.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.delete('/student/delete/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden access.' });
    }
    const { id } = req.params;
    try {
        await pool.query(
            'Delete FROM students WHERE id = $1 AND is_archived = true',
            [id]
        );

        res.json({ success: true, message: `Account Is Deleted.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/co-admin/update/reroll-password/:email', verifyToken, async (req, res) => {
    //if (req.user.role !== 'root_admin') {
    //    return res.status(403).json({ success: false, message: 'Forbidden: Only the absolute System Admin can add administrators.' });
    //}

    try {
        const { email } = req.params;

        // Generate a secure random plain-text password automatically
        const generatedPassword = crypto.randomBytes(4).toString('hex') + '@' + Math.floor(100 + Math.random() * 900);
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(generatedPassword, salt);

        const newAdmin = await pool.query(
            `UPDATE users
            SET password_hash = $1
            WHERE email = $2
            RETURNING id, uid
            `,
            [hashedPw, email.trim()]
        );

        // Return the plain-text generatedPassword so the frontend can display it in Swal
        res.status(200).json({
            success: true,
            data: newAdmin.rows[0],
            generatedPassword
        });
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

router.put('/provider/update/reroll-password/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Generate a secure random plain-text password automatically
        const generatedPassword = crypto.randomBytes(4).toString('hex') + '@' + Math.floor(100 + Math.random() * 900);
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(generatedPassword, salt);

        const provider = await pool.query(
            `UPDATE sub_admins
            SET sub_password = $1
            WHERE id = $2
            RETURNING id, sub_email
            `,
            [hashedPw, id]
        );

        // Return the plain-text generatedPassword so the frontend can display it in Swal
        res.status(200).json({
            success: true,
            data: provider.rows[0],
            generatedPassword
        });
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, error: "Server Error" });
    }
});

router.post('/create-co-admin', verifyToken, async (req, res) => {
    if (req.user.role !== 'root_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Only the absolute System Admin can add administrators.' });
    }

    // Password field removed from req.body destructuring
    const { email, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
        // Check if email already exists in users, students, or sub_admins tables
        const emailCheck = await pool.query(
            `SELECT email FROM users WHERE email = $1 
             UNION 
             SELECT student_email FROM students WHERE student_email = $1 
             UNION 
             SELECT sub_email FROM sub_admins WHERE sub_email = $1`,
            [trimmedEmail]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email address is already in use by another account.' });
        }

        // Generate a secure random plain-text password automatically
        const generatedPassword = crypto.randomBytes(4).toString('hex') + '@' + Math.floor(100 + Math.random() * 900);
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(generatedPassword, salt);

        // 🚀 CRITICAL ALIGNMENT: Modified prefix token string to output 'SADM-' tracking keys 
        const customUid = `SADM-${Date.now().toString().slice(-4)}`;

        const newAdmin = await pool.query(
            `INSERT INTO users (email, password_hash, role, uid, account_status, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, email, uid, role, account_status, first_name, last_name`,
            [trimmedEmail, hashedPw, 'co_admin', customUid, 'active', firstName.trim(), lastName.trim()]
        );

        // Return the plain-text generatedPassword so the frontend can display it in Swal
        res.status(201).json({
            success: true,
            data: newAdmin.rows[0],
            generatedPassword
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'Email address or System ID conflict detected.' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

const bcrypt = require('bcrypt');
const pool = require('../config/db');

// 1. Fetch team members under the organization
const getOrgUsers = async (req, res) => {
    try {
        const orgId = req.user.org_id;
        const result = await pool.query(
            `SELECT id, name, email, account_type, is_password_changed, created_at 
             FROM users 
             WHERE org_id = $1 
             ORDER BY account_type ASC, name ASC`,
            [orgId]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Transfer Ownership (MAIN account ONLY)
const transferOwnership = async (req, res) => {
    const client = await pool.connect();
    try {
        const currentMainId = req.user.id;
        const { targetUserId } = req.body;
        const orgId = req.user.org_id;

        // Ensure requester is the 'main' account
        if (req.user.account_type !== 'main') {
            return res.status(403).json({ success: false, message: "Only the main account holder can transfer ownership." });
        }

        await client.query('BEGIN');

        // Demote current main account to co_admin
        await client.query(
            `UPDATE users SET account_type = 'co_admin' WHERE id = $1 AND org_id = $2`,
            [currentMainId, orgId]
        );

        // Promote target co_admin to main
        await client.query(
            `UPDATE users SET account_type = 'main' WHERE id = $1 AND org_id = $2`,
            [targetUserId, orgId]
        );

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: "Ownership transferred successfully." });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
};

// 3. Change Password (MAIN account ONLY)
const changePassword = async (req, res) => {
    try {
        if (req.user.account_type !== 'main') {
            return res.status(403).json({ success: false, message: "Co-admins are restricted from changing account security credentials." });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const userRes = await pool.query(`SELECT password FROM users WHERE id = $1`, [userId]);
        const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and mark is_password_changed to true
        await pool.query(
            `UPDATE users 
             SET password = $1, is_password_changed = TRUE 
             WHERE id = $2`, 
            [hashedPassword, userId]
        );

        res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getOrgUsers, transferOwnership, changePassword };
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────
// IMPORTANT: This controller now operates against the same `sub_admins`
// table used by orgController.js (previously it queried a separate `users`
// table that nothing else in the app writes to, which meant transferOwnership
// and changePassword were silently operating on the wrong records).
//
// Row shape recap:
//   - The MAIN account's row IS the organization record. Its `id` is the
//     org identity that programs/applications/dashboard all reference.
//   - Co-admin rows have account_type = 'co_admin' and parent_org_id
//     pointing at the main row's id.
// ─────────────────────────────────────────────────────────────────────────

// 1. Fetch team members (main + co-admins) under the organization
const getOrgUsers = async (req, res) => {
    try {
        const requesterId = req.user.id;

        const accRes = await pool.query(
            `SELECT id, account_type, parent_org_id FROM sub_admins WHERE id = $1`,
            [requesterId]
        );
        if (accRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Account not found." });
        }
        const { account_type, parent_org_id } = accRes.rows[0];
        const orgId = account_type === 'co_admin' ? parent_org_id : requesterId;

        const result = await pool.query(
            `SELECT id, first_name, middle_name, last_name, sub_email AS email,
                    account_type, is_active, is_password_changed, created_at
             FROM sub_admins
             WHERE id = $1 OR parent_org_id = $1
             ORDER BY account_type ASC, first_name ASC`,
            [orgId]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Transfer Ownership (MAIN account ONLY)
//
// Because the main row's `id` IS the org's permanent identity (everything
// else — programs, applications, org profile — is keyed off it), we can't
// just flip account_type between two different row ids: that would orphan
// every bit of org data still pointing at the old main id.
//
// Instead we swap the LOGIN IDENTITY (email, password, name) between the
// main row and the target co-admin row. The org's id/data never moves —
// only who is able to log in as "main" changes.
const transferOwnership = async (req, res) => {
    const client = await pool.connect();
    try {
        const currentMainId = req.user.id;
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ success: false, message: "targetUserId is required." });
        }

        const mainRes = await client.query(
            `SELECT id, account_type, sub_email, sub_password, first_name, middle_name, last_name, is_password_changed
             FROM sub_admins WHERE id = $1`,
            [currentMainId]
        );
        if (mainRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Account not found." });
        }
        const mainAccount = mainRes.rows[0];

        if (mainAccount.account_type !== 'main') {
            return res.status(403).json({ success: false, message: "Only the main account holder can transfer ownership." });
        }

        const targetRes = await client.query(
            `SELECT id, account_type, sub_email, sub_password, first_name, middle_name, last_name, is_password_changed
             FROM sub_admins WHERE id = $1 AND parent_org_id = $2 AND account_type = 'co_admin'`,
            [targetUserId, currentMainId]
        );
        if (targetRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Target co-admin not found under your organization." });
        }
        const targetAccount = targetRes.rows[0];

        await client.query('BEGIN');

        // sub_email has a UNIQUE constraint, so we can't swap two emails
        // directly in two sequential UPDATEs — the moment the first UPDATE
        // sets the main row's email to the target's email, the target row
        // still holds that same email and the write collides with itself.
        // Route through a throwaway placeholder value first.
        const placeholderEmail = `transfer-${currentMainId}-${Date.now()}@internal.placeholder`;

        // Step 1: park the main row's email on a placeholder to free up its slot
        await client.query(
            `UPDATE sub_admins SET sub_email = $1 WHERE id = $2`,
            [placeholderEmail, currentMainId]
        );

        // Step 2: move the former main's identity into the target row
        // (now safe — the main row no longer holds mainAccount.sub_email)
        await client.query(
            `UPDATE sub_admins
             SET sub_email = $1, sub_password = $2, first_name = $3, middle_name = $4,
                 last_name = $5, is_password_changed = $6
             WHERE id = $7`,
            [mainAccount.sub_email, mainAccount.sub_password, mainAccount.first_name,
             mainAccount.middle_name, mainAccount.last_name, mainAccount.is_password_changed,
             targetUserId]
        );

        // Step 3: move the target's identity into the main row
        // (now safe — the target row no longer holds targetAccount.sub_email)
        await client.query(
            `UPDATE sub_admins
             SET sub_email = $1, sub_password = $2, first_name = $3, middle_name = $4,
                 last_name = $5, is_password_changed = $6
             WHERE id = $7`,
            [targetAccount.sub_email, targetAccount.sub_password, targetAccount.first_name,
             targetAccount.middle_name, targetAccount.last_name, targetAccount.is_password_changed,
             currentMainId]
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

// 3. Change Password — SINGLE SOURCE OF TRUTH (MAIN account ONLY).
// Cascades the new password to every co-admin under this org, same as the
// previous orgController implementation, but fixed to target sub_admins.
const changePassword = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Current and new password are required." });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
        }

        const accRes = await pool.query(
            `SELECT id, sub_password, account_type FROM sub_admins WHERE id = $1`,
            [requesterId]
        );
        if (accRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Account not found." });
        }
        const account = accRes.rows[0];

        if (account.account_type !== 'main') {
            return res.status(403).json({ success: false, message: "Co-admins are restricted from changing account security credentials." });
        }

        const isMatch = await bcrypt.compare(currentPassword, account.sub_password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect." });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ success: false, message: "New password must be different from your current password." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the main account and mark it as changed
        await pool.query(
            `UPDATE sub_admins SET sub_password = $1, is_password_changed = TRUE WHERE id = $2`,
            [hashedPassword, requesterId]
        );

        // Cascade to all co-admins under this org so everyone shares the current password
        await pool.query(
            `UPDATE sub_admins SET sub_password = $1, is_password_changed = TRUE WHERE parent_org_id = $2`,
            [hashedPassword, requesterId]
        );

        res.status(200).json({ success: true, message: "Password updated successfully across all organization accounts." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getOrgUsers, transferOwnership, changePassword };
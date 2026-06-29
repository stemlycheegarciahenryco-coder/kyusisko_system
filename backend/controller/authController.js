const pool = require('../config/db');
const transporter = require('../config/mailer_resend');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { trackEvent } = require('../utils/logger');

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;

// Helper function to track authentication attempts
async function logAttempt(identifier, ip, success) {
    await pool.query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)',
        [identifier, ip, success]
    );
}

// ==========================================
// 1. UNIFIED PORTAL LOGIN (System, Org, & Student)
// ==========================================
exports.portalLogin = async (req, res) => {
    const { identifier, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const input = identifier ? identifier.trim() : '';

    try {
        // 1. Universal Rate-Limiting Check
        const attemptCheck = await pool.query(
            `SELECT COUNT(*) FROM login_attempts 
             WHERE email = $1 AND success = FALSE 
             AND attempted_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes'`,
            [input]
        );
        const failedCount = parseInt(attemptCheck.rows[0].count);

        if (failedCount >= MAX_ATTEMPTS) {
            await trackEvent({
                userId: null, subAdminId: null, studentId: null,
                actionType: 'SECURITY_LOCKOUT', ipAddress: ip, email: input,
                message: `Portal security lockout triggered: 5 consecutive authentication failures for identity: ${input}.`
            });
            return res.status(429).json({ error: "Too many attempts. Blocked for 10 minutes.", blocked: true });
        }

        // 2. Identify Portal Strategy via Input Pattern
        const isSystemAdmin = input.toUpperCase().startsWith('SADM-');

        if (isSystemAdmin) {
            // --- SYSTEM ADMIN PROFILE ROUTE ---
            const userResult = await pool.query('SELECT * FROM users WHERE uid = $1', [input.toUpperCase()]);
            if (userResult.rows.length === 0) {
                await logAttempt(input, ip, false);
                return res.status(401).json({ error: "Invalid Credentials" });
            }

            const user = userResult.rows[0];
            if (user.account_status === 'blocked' || user.account_status === 'suspended') {
                await trackEvent({
                    userId: user.id, subAdminId: null, studentId: null,
                    actionType: 'LOGIN_BLOCKED_ACCOUNT', ipAddress: ip, email: user.email,
                    message: `Admin login rejected: Account state locked under '${user.account_status}' status flags.`
                });
                return res.status(403).json({ error: `Access denied. Your administrative account is ${user.account_status}.` });
            }

            if (!(await bcrypt.compare(password, user.password_hash))) {
                await logAttempt(input, ip, false);
                return res.status(401).json({ error: "Invalid Credentials" });
            }

            await logAttempt(input, ip, true);
            await trackEvent({
                userId: user.id, subAdminId: null, studentId: null,
                actionType: user.role === 'root_admin' ? 'ROOT_ADMIN_LOGIN' : 'CO_ADMIN_LOGIN',
                ipAddress: ip, email: user.email,
                message: `System session verified and initialized successfully for administrative ID: ${user.uid}.`
            });

            const token = jwt.sign({ id: user.id, role: user.role, email: user.email, uid: user.uid }, process.env.JWT_SECRET, { expiresIn: '1d' });
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.json({ token, role: user.role, data: { id: user.id, uid: user.uid, email: user.email } });
        }

        // --- EMAIL ROUTING ENTRY STRATEGIES ---
        // Strategy A: Check if input matches an Institutional Organization Sub-Admin
        // FIX: Now matches by provider_code (e.g. "PROVIDER-001") OR sub_email,
        // since orgs can log in with either their formatted Provider ID or email.
        // Provider code match is case-insensitive (mirrors the SADM- admin check above).
        const subResult = await pool.query(
            'SELECT * FROM sub_admins WHERE UPPER(provider_code) = UPPER($1) OR sub_email = $1',
            [input]
        );
        
        if (subResult.rows.length > 0) {
            const sub = subResult.rows[0];
            if (!sub.is_active) {
                await trackEvent({
                    userId: null, subAdminId: sub.id, studentId: null,
                    actionType: 'LOGIN_DEACTIVATED_ACCOUNT', ipAddress: ip, email: input,
                    message: `Organization Admin login rejected: Access deactivated for sub-admin of: "${sub.org_name}".`
                });
                return res.status(403).json({ error: "Account deactivated. Contact root admin." });
            }

            if (!(await bcrypt.compare(password, sub.sub_password))) {
                await logAttempt(input, ip, false);
                return res.status(401).json({ error: "Invalid Credentials" });
            }

            await logAttempt(input, ip, true);
            await trackEvent({
                userId: null, subAdminId: sub.id, studentId: null,
                actionType: 'ORG_LOGIN', ipAddress: ip, email: input,
                message: `Organization session initialized successfully for institution: "${sub.org_name}".`
            });

            const token = jwt.sign({ id: sub.id, role: 'sub_admin', email: sub.sub_email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.json({ token, role: 'sub_admin', data: { id: sub.id, email: sub.sub_email } });
        }

        // Strategy B: Fallback and check if input matches a Student account registration
        const studentResult = await pool.query('SELECT * FROM students WHERE student_email = $1', [input]);
        
        if (studentResult.rows.length > 0) {
            const student = studentResult.rows[0];
            // Accommodates standard student boolean flag or dynamic state values safely
            if (student.sis_active === false || student.account_status === 'blocked') {
                return res.status(403).json({ error: 'Access denied. Account is restricted.' });
            }

            if (!(await bcrypt.compare(password, student.student_password_hash))) {
                await logAttempt(input, ip, false);
                return res.status(401).json({ error: "Invalid Credentials" });
            }

            await logAttempt(input, ip, true);
            await trackEvent({
                userId: null, subAdminId: null, studentId: student.id,
                actionType: 'STUDENT_LOGIN', ipAddress: ip, email: input,
                message: `Student session verified and initialized successfully for user matching: ${student.student_email}.`
            });

            const token = jwt.sign({ id: student.id, role: 'student', email: student.student_email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.json({ 
                token, 
                role: 'student', 
                data: { 
                    id: student.id, 
                    email: student.student_email,
                    firstName: student.sfirst_name,
                    lastName: student.slast_name,
                    isProfileComplete: student.is_profile_complete === true
                } 
            });
        }

        // Fallthrough if it fails all matches
        await logAttempt(input, ip, false);
        return res.status(401).json({ error: "Invalid Credentials" });

    } catch (err) {
        console.error("Unified Portal Login Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// ==========================================
// 2. FORGOT PASSWORD SYSTEM (Email-based)
// ==========================================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const subRes = await pool.query('SELECT id FROM sub_admins WHERE sub_email = $1', [email]);
        const studentRes = await pool.query('SELECT id FROM students WHERE student_email = $1', [email]);

        if (userRes.rows.length === 0 && subRes.rows.length === 0 && studentRes.rows.length === 0) {
            await trackEvent({
                userId: null, subAdminId: null, studentId: null,
                actionType: 'FORGOT_PASSWORD_FAIL', ipAddress: ip, email: email,
                message: `Password reset requested for non-existent email address.`
            });
            return res.json({ message: "If that email exists, a verification code has been sent." });
        }

        let userId = null;
        let subAdminId = null;
        let studentId = null;

        if (userRes.rows.length > 0) userId = userRes.rows[0].id;
        else if (subRes.rows.length > 0) subAdminId = subRes.rows[0].id;
        else if (studentRes.rows.length > 0) studentId = studentRes.rows[0].id;

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        await pool.query(
            'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
            [email, code, expiresAt]
        );

        await transporter.sendMail({
            from: `"KyusISKO" <${process.env.RESEND_FROM_EMAIL}>`,
            to: email,
            subject: 'Your Verification Code — KyusISKO',
            html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px;">
                    <h2 style="color: #1e293b; text-align: center;">Password Reset Request</h2>
                    <p style="color: #64748b; text-align: center;">Use the code below to reset your password. It expires in 10 minutes.</p>
                    <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
                        ${code}
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">If you did not request this, please ignore this email.</p>
                </div>`
        });

        await trackEvent({
            userId, subAdminId, studentId,
            actionType: 'FORGOT_PASSWORD_REQUEST', ipAddress: ip, email: email,
            message: `Verification code successfully generated and emailed to the account.`
        });

        res.json({ message: "If that email exists, a verification code has been sent." });
    } catch (err) {
        console.error("Forgot Pass Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// ==========================================
// 3. RESET PASSWORD EXECUTION
// ==========================================
exports.resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const tokenCheck = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE email = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()',
            [email, token]
        );

        if (tokenCheck.rows.length === 0) {
            await trackEvent({
                userId: null, subAdminId: null, studentId: null,
                actionType: 'PASSWORD_RESET_BAD_TOKEN', ipAddress: ip, email: email,
                message: `Failed password reset attempt: Invalid, expired, or used verification token submitted.`
            });
            return res.status(400).json({ error: "Invalid or expired verification code." });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const subRes = await pool.query('SELECT id FROM sub_admins WHERE sub_email = $1', [email]);
        const studentRes = await pool.query('SELECT id FROM students WHERE student_email = $1', [email]);

        let userId = null;
        let subAdminId = null;
        let studentId = null;

        if (userRes.rows.length > 0) {
            userId = userRes.rows[0].id;
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashed, email]);
        } else if (subRes.rows.length > 0) {
            subAdminId = subRes.rows[0].id;
            await pool.query('UPDATE sub_admins SET sub_password = $1 WHERE sub_email = $2', [hashed, email]);
        } else if (studentRes.rows.length > 0) {
            studentId = studentRes.rows[0].id;
            await pool.query('UPDATE students SET student_password_hash = $1 WHERE student_email = $2', [hashed, email]);
        }

        await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1 AND email = $2', [token, email]);
        
        await trackEvent({
            userId, subAdminId, studentId,
            actionType: 'PASSWORD_RESET_SUCCESS', ipAddress: ip, email: email,
            message: `Password update transaction completed successfully. Previous tokens revoked.`
        });

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Reset Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

// ==========================================
// 4. FETCH AUDIT RECORDS LOG
// ==========================================
exports.getLogInAttempt = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id, email, ip_address, success, attempted_at 
            FROM login_attempts 
            ORDER BY attempted_at DESC 
            LIMIT 100
        `);
        
        res.json({
            success: true,
            attempts: rows
        });
    } catch (err) { 
        console.error("Error fetching login attempts:", err.message);
        res.status(500).json({ 
            success: false, 
            error: "Server Error" 
        }); 
    }
};
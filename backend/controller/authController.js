const pool = require('../config/db');
const transporter = require('../config/mailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // 1. Check ALL tables: Admin, Sub-Admin, and Students
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const subRes = await pool.query('SELECT id FROM sub_admins WHERE sub_email = $1', [email]);
        const studentRes = await pool.query('SELECT id FROM students WHERE student_email = $1', [email]);

        // 2. If email doesn't exist in ANY table
        if (userRes.rows.length === 0 && subRes.rows.length === 0 && studentRes.rows.length === 0) {
            return res.json({ message: "If that email exists, a verification code has been sent." });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        await pool.query(
            'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
            [email, code, expiresAt]
        );

        await transporter.sendMail({
            from: `"KyusISKO" <${process.env.EMAIL_USER}>`,
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

        res.json({ message: "If that email exists, a verification code has been sent." });
    } catch (err) {
        console.error("Forgot Pass Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;
    try {
        const tokenCheck = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE email = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()',
            [email, token]
        );

        if (tokenCheck.rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired verification code." });
        }

        // Use 10 rounds for hashing
        const hashed = await bcrypt.hash(newPassword, 10);
        
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const subRes = await pool.query('SELECT id FROM sub_admins WHERE sub_email = $1', [email]);

        if (userRes.rows.length > 0) {
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashed, email]);
        } else if (subRes.rows.length > 0) {
            await pool.query('UPDATE sub_admins SET sub_password = $1 WHERE sub_email = $2', [hashed, email]);
        } else {
            // FIX: Match your student login column name: student_password_hash
            await pool.query('UPDATE students SET student_password_hash = $1 WHERE student_email = $2', [hashed, email]);
        }

        await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1 AND email = $2', [token, email]);
        
        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Reset Error:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // 1. Rate Limiting Check
    const attemptCheck = await pool.query(
      `SELECT COUNT(*) FROM login_attempts 
       WHERE email = $1 AND success = FALSE 
       AND attempted_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes'`,
      [email]
    );
    const failedCount = parseInt(attemptCheck.rows[0].count);

    if (failedCount >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: "Too many attempts. Blocked for 10 minutes.", blocked: true });
    }

    // 2. Try Root Admin Login (users table)
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (user.account_status === 'blocked') {
    return res.status(403).json({ error: "Access denied. Your account is blocked." });
  }
      if (isMatch) {
        await logAttempt(email, ip, true);
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, role: user.role, id: user.id, sub_email: user.email });
      }
    }

    // 3. Try Sub-Admin Login (sub_admins table)
    const subResult = await pool.query('SELECT * FROM sub_admins WHERE sub_email = $1', [email]);
    if (subResult.rows.length > 0) {
      const sub = subResult.rows[0];

      if (!sub.is_active) {
        return res.status(403).json({ error: "Account deactivated. Contact root admin." });
      }

      const isMatch = await bcrypt.compare(password, sub.sub_password);
      if (isMatch) {
        await logAttempt(email, ip, true);
        
        // Include sub_email in token payload for RBAC
        const token = jwt.sign(
          { id: sub.id, role: 'sub_admin', email: sub.sub_email }, 
          process.env.JWT_SECRET, 
          { expiresIn: '1d' }
        );

        // KEY FIX: Return 'sub_email' so it matches your LogIn.jsx destructuring
        return res.json({ 
          
          token, 
          role: 'sub_admin', 
          sub_email: sub.sub_email,
          id: sub.id // Include sub-admin ID for frontend use

        });
      }
    }

    // 4. Failed Login Handling
    await logAttempt(email, ip, false);
    res.status(401).json({ 
      error: "Invalid credentials", 
      attempts: MAX_ATTEMPTS - (failedCount + 1) 
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};



exports.getLogInAttempt = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT email, COUNT(*) FROM login_attempts GROUP BY email`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Server Error" }); }
};

async function logAttempt(email, ip, success) {
  await pool.query(
    'INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)',
    [email, ip, success]
  );
}
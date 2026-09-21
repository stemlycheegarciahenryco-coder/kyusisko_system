const pool = require('../config/db'); // Your DB connection
const jwt = require('jsonwebtoken');
const { sendEmailOTP } = require('../config/emailService');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * LOGIC: Initiate the OTP process
 * This can be called from studentLogin or Resend OTP
 */
exports.initiateOTP = async (email, method) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000);

    // Clean the method string: remove spaces and make lowercase
    const cleanMethod = method ? method.trim().toLowerCase() : '';

    try {
        await pool.query(
            `INSERT INTO otp_codes (email, code, method, expires_at) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) 
             DO UPDATE SET code = $2, expires_at = $4`,
            [email, otpCode, cleanMethod, expiresAt]
        );

        // Now the check will pass correctly
        if (cleanMethod === 'email') {
            console.log("DEBUG: Attempting to send email...");
            await sendEmailOTP(email, otpCode);
            console.log("DEBUG: Email sent!");
        }
        
        return { success: true };
    } catch (err) {
        console.error("DEBUG: ERROR in initiateOTP:", err.message);
        throw err;
    }
};

/**
 * ROUTE: POST /api/security/verify-otp
 * Verifies the code and finally issues the JWT Token
 */
exports.verifyOTP = async (req, res) => {
    // FIX: The frontend (OTPVerification.jsx) sends { studentId, code } — it
    // never sends `email` — so this used to look up `WHERE email = undefined`
    // and fail every single time with "Invalid or expired code.", regardless
    // of whether the code was actually correct. We now accept either and
    // resolve studentId -> email ourselves when email isn't provided.
    const { studentId, email, code } = req.body;

    try {
        let targetEmail = email;

        if (!targetEmail && studentId) {
            const studentLookup = await pool.query(
                'SELECT student_email FROM students WHERE id = $1',
                [studentId]
            );
            if (studentLookup.rows.length === 0) {
                return res.status(404).json({ error: 'Student not found.' });
            }
            targetEmail = studentLookup.rows[0].student_email;
        }

        if (!targetEmail) {
            return res.status(400).json({ error: 'Missing email or studentId.' });
        }

        // 1. Check if OTP is valid and not expired using email
        const result = await pool.query(
            `SELECT * FROM otp_codes 
             WHERE email = $1 AND code = $2 AND expires_at > NOW() 
             ORDER BY created_at DESC LIMIT 1`,
            [targetEmail, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired code.' });
        }

        // 2. Clear codes for this email
        await pool.query('DELETE FROM otp_codes WHERE email = $1', [targetEmail]);

        // 3. Fetch student details using the email
        const studentRes = await pool.query('SELECT * FROM students WHERE student_email = $1', [targetEmail]);
        
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found.' });
        }
        
        const student = studentRes.rows[0];

        // 4. Issue JWT
        const token = jwt.sign(
            { id: student.id, role: 'student', email: student.student_email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'OTP Verified',
            token,
            student: {
                id: student.id,
                firstName: student.sfirst_name,
                lastName: student.slast_name,
                email: student.student_email,
                is_profile_complete: student.is_profile_complete
            }
        });

    } catch (err) {
        console.error('Verify OTP Error:', err.message);
        res.status(500).json({ error: 'Server Error during verification.' });
    }
};

/**
 * ROUTE: POST /api/security/resend-otp
 * Regenerates and resends a code for an in-progress login OTP flow.
 * Frontend (OTPVerification.jsx) sends { studentId, method } — no route or
 * handler existed for this before, so every "Resend Code" click 404'd.
 */
exports.resendOTP = async (req, res) => {
    const { studentId, email, method } = req.body;

    try {
        let targetEmail = email;

        if (!targetEmail && studentId) {
            const studentLookup = await pool.query(
                'SELECT student_email FROM students WHERE id = $1',
                [studentId]
            );
            if (studentLookup.rows.length === 0) {
                return res.status(404).json({ error: 'Student not found.' });
            }
            targetEmail = studentLookup.rows[0].student_email;
        }

        if (!targetEmail) {
            return res.status(400).json({ error: 'Missing email or studentId.' });
        }

        await exports.initiateOTP(targetEmail, method || 'email');
        return res.json({ message: 'Verification code resent.' });
    } catch (err) {
        console.error('Resend OTP Error:', err.message);
        return res.status(500).json({ error: 'Failed to resend code.' });
    }
};

//EMAIL CHECK EXISTING
const pool = require('../config/db'); // Your DB connection
const jwt = require('jsonwebtoken');
const { sendEmailOTP } = require('../config/emailService');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * LOGIC: Initiate the OTP process
 * This can be called from studentLogin or Resend OTP
 */
exports.initiateOTP = async (studentId, email, method) => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

    // 1. Save to database
    await pool.query(
        'INSERT INTO otp_codes (student_id, code, method, expires_at) VALUES ($1, $2, $3, $4)',
        [studentId, otpCode, method, expiresAt]
    );

    // 2. Send via preferred method
    if (method === 'email') {
        await sendEmailOTP(email, otpCode);
    } 
    // You can add SMS logic here later if you expand
    
    return { success: true };
};

/**
 * ROUTE: POST /api/security/verify-otp
 * Verifies the code and finally issues the JWT Token
 */
exports.verifyOTP = async (req, res) => {
    const { studentId, code } = req.body;

    try {
        // 1. Check if OTP is valid and not expired
        const result = await pool.query(
            `SELECT * FROM otp_codes 
             WHERE student_id = $1 AND code = $2 AND expires_at > NOW() 
             ORDER BY created_at DESC LIMIT 1`,
            [studentId, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired code.' });
        }

        // 2. Clear codes for this student (Prevent reuse)
        await pool.query('DELETE FROM otp_codes WHERE student_id = $1', [studentId]);

        // 3. Fetch student details for the token payload
        const studentRes = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
        const student = studentRes.rows[0];

        // 4. Issue the real JWT Token
        const token = jwt.sign(
            { 
                id: student.id, 
                role: 'student', 
                email: student.student_email 
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 5. Success response
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
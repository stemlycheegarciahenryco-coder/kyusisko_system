
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const security = require('./securityController'); // Import your new security logic
const transporter = require('../config/mailer'); // For sending emails


const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 7;
const JWT_SECRET = process.env.JWT_SECRET;

exports.studentLogin = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // 1. Check Brute Force Protection
    const attemptCheck = await pool.query(
      `SELECT COUNT(*) FROM login_attempts 
       WHERE email = $1 AND success = FALSE 
       AND attempted_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes'`,
      [email]
    );
    
    if (parseInt(attemptCheck.rows[0].count) >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: "Security Lockout. Try again later.", blocked: true });
    }

    // 2. Find Student & Validate Password
    const result = await pool.query('SELECT * FROM students WHERE student_email = $1', [email]);
    const student = result.rows[0];

    if (!student || !(await bcrypt.compare(password, student.student_password_hash))) {
      await pool.query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)', [email, ip]);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Status Checks
    if (student.sstatus === 'pending') return res.status(403).json({ error: 'Account pending approval.' });
    if (student.sstatus === 'blocked') {
    return res.status(403).json({ error: "Account Restricted.",message: "Your account has been blocked by the administrator."});
}
    if (student.sstatus === 'rejected') return res.status(403).json({ error: 'Account access rejected.' });
    if (!student.sis_active) return res.status(403).json({ error: 'Account deactivated.' });

    // 4. Log Successful Password Entry
    await pool.query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, true)', [email, ip]);

    // 5. 2FA Interception (The Clean Way)
    if (student.two_factor_enabled) {
      await security.initiateOTP(student.id, student.student_email, student.preferred_2fa_method, student.scontact_number);

      return res.json({
        status: 'OTP_REQUIRED',
        method: student.preferred_2fa_method,
        studentId: student.id,
        email: student.student_email 
      });
    }

    // 6. Normal Login (2FA Disabled)
    const token = jwt.sign(
      { id: student.id, role: 'student', email: student.student_email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      student: {
        id: student.id,
        firstName: student.sfirst_name,
        lastName: student.slast_name,
        is_profile_complete: student.is_profile_complete
      }
    });

  } catch (err) {
    console.error('Student login error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};


// Get specific student profile by ID
// GET /api/students/:id
exports.getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        s.id, -- Added this for frontend reference
        s.sfirst_name, 
        s.slast_name, 
        s.saddress,
        s.two_factor_enabled,      
        s.preferred_2fa_method, 
        s.sprofile_pic, 
        s.student_email, 
        s.sid_card_path,
        TO_CHAR(s.sbirth_date, 'YYYY-MM-DD') as sbirth_date,
        s.sgender, 
        s.scontact_number,
        s.academic_category, 
        COALESCE(s.sstatus, 'pending') as sstatus, -- Safety fallback
        ar.gwa, 
        ar.school_name, 
        ar.grade_level, 
        ar.term, 
        ar.school_year,
        ar.report_card_path, 
        ar.good_moral_path, 
        ar.sdocument_path 
       FROM students s
       LEFT JOIN academic_records ar ON s.id = ar.student_id
       WHERE s.id = $1
       ORDER BY ar.is_current DESC, ar.created_at DESC 
       LIMIT 1`, 
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    // This will tell you EXACTLY which column name is wrong in your console
    console.error("Database Error in getStudentById:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//update registration status to root
exports.updateStatusStudent = async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    try {
        // 'unblocked' and 'approved' both make account active
        const isActive = (status === 'approved' || status === 'unblocked');
        const dbStatus = status === 'unblocked' ? 'approved' : status;

        const query = `
            UPDATE students 
            SET sstatus = $1, rejection_reason = $2, sis_active = $3
            WHERE id = $4 
            RETURNING student_email, sfirst_name, slast_name;
        `;
        
        const result = await pool.query(query, [dbStatus, reason || null, isActive, id]);

        if (result.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const student = result.rows[0];

        // --- EMAIL LOGIC ---
        let mailOptions = {
            from: `"KyusISKO Admin" <${process.env.EMAIL_USER}>`,
            to: student.student_email,
        };

        if (status === 'approved') {
            mailOptions.subject = "Application Approved!";
            mailOptions.html = `<h2>Congratulations ${student.sfirst_name}!</h2><p>Your Registration has been approved you can now log in.</p>`;
        } else if (status === 'rejected') {
            mailOptions.subject = "Application Status Update";
            mailOptions.html = `<h2>Hi ${student.sfirst_name}</h2><p>Your application was rejected.</p><p>Reason: ${reason}</p>`;
        } else if (status === 'unblocked') {
            mailOptions.subject = "Account Access Restored";
            mailOptions.html = `<h2>Access Restored</h2><p>Hi ${student.sfirst_name}, your account restriction has been lifted.</p>`;
        } else if (status === 'blocked') {
            mailOptions.subject = "Account Restricted";
            mailOptions.html = `<p>Hi ${student.sfirst_name}, your account access has been restricted by an admin.</p>`;
        }

        // Send the email
        if (mailOptions.subject) {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent for ${status} to ${student.student_email}`);
        }

        res.json({ message: `Status updated to ${status}`, student });

    } catch (err) {
        console.error("❌ Controller Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// get registration status to root
exports.getAllStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id, 
                s.student_email, 
                s.sfirst_name, 
                s.slast_name, 
                s.smiddle_name, 
                s.suffix, 
                s.sgender, 
                s.scontact_number, 
                s.saddress, 
                s.sstatus,
                s.sid_card_path,
                s.academic_category,
                s.screated_at,
                -- THE FIX: Format as string so JS doesn't shift the timezone
                TO_CHAR(s.sbirth_date, 'YYYY-MM-DD') as sbirth_date, 
                ar.grade_level, 
                ar.school_name, 
                ar.school_year, 
                ar.term, 
                ar.gwa, 
                ar.sdocument_path, 
                ar.report_card_path, 
                ar.good_moral_path
            FROM students s
            LEFT JOIN academic_records ar ON s.id = ar.student_id AND ar.is_current = true
            ORDER BY s.screated_at DESC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Error:", err.message); 
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};


exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { grade_level, school_name, term, school_year, saddress } = req.body;
  const sprofile_pic = req.file ? req.file.path : null;

  const client = await pool.connect(); // Use a client for transaction
  try {
    await client.query('BEGIN');

    // 1. Update Students Table (Identity & Profile Pic)
    await client.query(
      `UPDATE students 
       SET saddress = $1, 
           sprofile_pic = COALESCE($2, sprofile_pic),
           is_profile_complete = true 
       WHERE id = $3`,
      [saddress, sprofile_pic, id]
    );

    // 2. Update or Insert into Academic Records
    // We check if a record exists for this student
    const recordCheck = await client.query('SELECT id FROM academic_records WHERE student_id = $1', [id]);

    if (recordCheck.rows.length > 0) {
      await client.query(
        `UPDATE academic_records 
         SET grade_level = $1, school_name = $2, term = $3, school_year = $4, is_current = true
         WHERE student_id = $5`,
        [grade_level, school_name, term, school_year, id]
      );
    } else {
      await client.query(
        `INSERT INTO academic_records (student_id, grade_level, school_name, term, school_year, is_current)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [id, grade_level, school_name, term, school_year]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Profile and Academic records updated!" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Update Profile Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  } finally {
    client.release();
  }
};

exports.update2FA = async (req, res) => {
    // You can get studentId from a hidden input, query param, or JWT
    const { studentId, two_factor_enabled, preferred_2fa_method } = req.body;

    try {
        await pool.query(
            `UPDATE students 
             SET two_factor_enabled = $1, preferred_2fa_method = $2 
             WHERE id = $3`,
            [two_factor_enabled, preferred_2fa_method, studentId]
        );

        res.json({ message: "Security settings updated successfully" });
    } catch (err) {
        console.error("Error updating 2FA:", err.message);
        res.status(500).json({ error: "Failed to update security settings" });
    }
};




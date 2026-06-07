
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const security = require('./securityController'); // Import your new security logic
const transporter = require('../config/mailer'); // For sending emails


const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 7;
const JWT_SECRET = process.env.JWT_SECRET;

//STUDENTLOGIN
exports.studentLogin = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // 1. Check Brute Force Protection
    const attemptCheck = await pool.query(
                          //!attempts
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
                                    //!attempts
      await pool.query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)', [email, ip]);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Updated Status Checks (Bypassing Approval Logic)
    // We remove the 'pending' and 'rejected' checks since registration is now instant

    // We still check if the account is active (for manual deactivations)
    if (!student.sis_active) {
        return res.status(403).json({ error: 'Account is Restricted.' });
    }

    // 4. Log Successful Password Entry //!attempts
    await pool.query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, true)', [email, ip]);

    // 5. 2FA Interception
    if (student.two_factor_enabled) {
     await security.initiateOTP(student.student_email, student.preferred_2fa_method);
      return res.json({
        status: 'OTP_REQUIRED',
        method: student.preferred_2fa_method,
        studentId: student.id,
        email: student.student_email 
      });
    }

    // 6. Normal Login (Token Generation)
    const token = jwt.sign(
      { id: student.id, role: 'student', email: student.student_email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
  httpOnly: true,
  secure: true,        // Always true — Render is always HTTPS
  sameSite: 'None',    // Always None — Vercel → Render is always cross-origin
  maxAge: 24 * 60 * 60 * 1000
});

    return res.json({
      message: 'Login successful',
      role: 'student',
      token:token,
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
        id, 
        student_email, 
        sfirst_name, 
        slast_name, 
        smiddle_name,
        suffix,
        sgender,
        scontact_number,
        sis_active,
        sbirth_date,
        sprofile_pic,
        -- Pulling individual address fields from your ERD
        sstreet, 
        sbarangay, 
        sdistrict, 
        szip_code
       FROM students 
       WHERE id = $1 LIMIT 1`, 
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// get registration status to root
exports.getAllStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                student_email, 
                sfirst_name, 
                slast_name,
                scontact_number,
                sis_active,
                -- Derive status: If profile is complete, they are Registered
                CASE 
                    WHEN is_profile_complete = true THEN 'Registered' 
                    ELSE 'Pending' 
                END as derived_status,
                CONCAT(sstreet, ', ', sbarangay, ', ', sdistrict, ' ', szip_code) as full_address
            FROM students
            ORDER BY id DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ error: "Failed to fetch student logs" });
    }
};

exports.updateStudentStatus = async (req, res) => {
    const { id } = req.params;
    const { activeStatus } = req.body; // Expecting true or false

    try {
        await pool.query(
            'UPDATE students SET sis_active = $1 WHERE id = $2',
            [activeStatus, id]
        );
        res.json({ success: true, message: "Account status updated" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update security status" });
    }
};

//profile student achievemets
exports.updatePortfolio = async (req, res) => {
  const { 
    student_id, 
    type, 
    title, 
    bio, 
    college_id,  
    course_id,   
    other_school, 
    other_degree_program, 
    sports_interests 
  } = req.body;

  try {
    // 1. Process sports interests array safely
    let processedSports = null;
    if (sports_interests !== undefined && sports_interests !== '') {
      const sportsArray = sports_interests.split(',').map(s => s.trim()).filter(Boolean);
      processedSports = JSON.stringify(sportsArray); 
    }

    // 2. Format integers safely. Return undefined if blank so SQL COALESCE won't trigger update
    const finalCollegeId = college_id && college_id !== 'Others' && college_id !== '' ? parseInt(college_id) : null;
    const finalCourseId = course_id && course_id !== 'Others' && course_id !== '' ? parseInt(course_id) : null;

    // 3. Update the 'students' table cleanly
    await pool.query(
      `UPDATE students 
       SET bio = COALESCE($1, bio) 
       WHERE id = $2`,
      [bio || null, student_id]
    );

    // 4. Update onboarding table safely using COALESCE patterns to prevent null wiping
    await pool.query(
      `UPDATE student_onboarding_profiles 
       SET college_id = CASE WHEN $1::integer IS NOT NULL THEN $1::integer ELSE college_id END, 
           course_id = CASE WHEN $2::integer IS NOT NULL THEN $2::integer ELSE course_id END, 
           other_school = CASE WHEN $3::text IS NOT NULL THEN $3::text ELSE other_school END, 
           other_degree_program = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE other_degree_program END, 
           sports_interests = COALESCE($5, sports_interests),
           updated_at = NOW()
       WHERE student_id = $6`,
      [
        finalCollegeId, 
        finalCourseId, 
        other_school || null, 
        other_degree_program || null, 
        processedSports, 
        student_id
      ]
    );

    // 5. Handle portfolio document uploads if attached
// ✅ FIXED: Changed from req.file to req.files to process multiple entries
if (req.files && req.files.length > 0) {
  const studentQuery = await pool.query('SELECT portfolio_data FROM students WHERE id = $1', [student_id]);
  const currentPortfolio = studentQuery.rows[0]?.portfolio_data || [];

  // If only 1 item is uploaded, Express treats req.body values as plain strings. 
  // We normalize them into arrays here to ensure the loop works perfectly every time.
  const titlesArray = Array.isArray(req.body.titles) ? req.body.titles : [req.body.titles];
  const typesArray = Array.isArray(req.body.types) ? req.body.types : [req.body.types];

  // Loop through all uploaded files matching them to their respective title and type
  req.files.forEach((file, index) => {
    const newEntry = {
      type: typesArray[index] || 'Certificate',
      title: titlesArray[index] || 'Untitled Document',
      url: file.path // Saves the server path string (e.g., "uploads/1715...")
    };
    currentPortfolio.push(newEntry);
  });

  // Save the updated portfolio matrix array back to PostgreSQL
  await pool.query(
    'UPDATE students SET portfolio_data = $1 WHERE id = $2', 
    [JSON.stringify(currentPortfolio), student_id]
  );
}

    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    console.error("Error updating profile fields:", err.message);
    res.status(500).json({ error: "Server error while updating profile." });
  }
};

exports.getFullProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        s.sfirst_name, s.slast_name, s.smiddle_name, s.sgender, s.student_email, 
        s.scontact_number, s.sbirth_date, s.sprofile_pic,
        s.sstreet, s.sbarangay, s.sdistrict, s.szip_code,
        s.portfolio_data, s.bio,
        c.name AS college_name, p.other_school, 
        cr.name AS course_name, p.other_degree_program,
        p.religion, p.other_religion,
        p.sports_interests, p.other_sport,
        
        /* ── ADDED PARENT FIELDS HERE ── */
        sp.mother_name, sp.mother_contact, sp.mother_occupation,
        sp.father_name, sp.father_contact, sp.father_occupation,
        sp.guardian_name, sp.guardian_contact, sp.guardian_occupation,
        sp.house_address
       FROM students s
       LEFT JOIN student_onboarding_profiles p ON s.id = p.student_id
       LEFT JOIN colleges c ON p.college_id = c.id
       LEFT JOIN courses cr ON p.course_id = cr.id
       
       /* ── JOIN THE PARENTS TABLE ── */
       LEFT JOIN student_parents sp ON s.id = sp.student_id
       
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.updateProfilePic = async (req, res) => {
  const { id } = req.params;
  
  // Check if a file was actually uploaded
  if (!req.file) {
    return res.status(400).json({ error: "No image provided" });
  }

  const profilePicPath = req.file.filename; 

  try {
    const result = await pool.query(
      `UPDATE students 
       SET sprofile_pic = $1 
       WHERE id = $2 
       RETURNING sprofile_pic`,
      [profilePicPath, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ 
      success: true, 
      profile_pic: result.rows[0].sprofile_pic 
    });
  } catch (err) {
    console.error("Image Update Error:", err);
    res.status(500).json({ error: "Server Error" });
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


exports.getMyScholarships = async (req, res) => {
  try {
    const student_id = req.user.id;
    const result = await pool.query(
      `SELECT 
         a.id as application_id,
         a.status,
         a.created_at as applied_at,
         s.id as scholarship_id,
         s.title,
         s.description,
         s.deadline,
         s.amount_range,
         s.fund_type,
         s.criteria,
         s.slots,
         s.gwa_requirement,
         sa.org_name,
         sa.org_pic,
         sa.sub_email,
         sa.contact_number,
         sa.website,
         CASE 
           WHEN latest_renewal.status = 'submitted' THEN 'renewal_pending'
           WHEN a.status = 'renewing' THEN 'renewing'
           WHEN a.status = 'active' THEN 'active'
           ELSE a.status
         END as display_status
       FROM applications a
       JOIN scholarships s ON s.id = a.scholarship_id
       JOIN sub_admins sa ON sa.id = s.sub_admin_id
       LEFT JOIN LATERAL (
         SELECT status
         FROM scholarship_renewals
         WHERE application_id = a.id
         ORDER BY created_at DESC
         LIMIT 1
       ) latest_renewal ON true
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [student_id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("My Scholarships Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

//Parents Profile

exports.saveOrUpdateParentProfile = async (req, res) => {
    const { studentId } = req.params;
    const {
        mother_name, mother_contact, mother_occupation,
        father_name, father_contact, father_occupation,
        guardian_name, guardian_contact, guardian_occupation,
        house_address
    } = req.body;

    // Helper function to turn empty form inputs ("") into clean database NULLs
    const sanitize = (val) => (val && val.trim() !== "" ? val.trim() : null);

    try {
        // 1. Verify the student onboarding profile actually exists first
        const studentCheck = await pool.query(
            `SELECT student_id FROM student_onboarding_profiles WHERE student_id = $1`,
            [studentId]
        );

        if (studentCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Student onboarding profile not found." });
        }

        // 2. Run the UPSERT SQL Query
        const upsertQuery = `
            INSERT INTO student_parents (
                student_id, 
                mother_name, mother_contact, mother_occupation,
                father_name, father_contact, father_occupation,
                guardian_name, guardian_contact, guardian_occupation,
                house_address, updated_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)
            ON CONFLICT (student_id) 
            DO UPDATE SET 
                mother_name = EXCLUDED.mother_name,
                mother_contact = EXCLUDED.mother_contact,
                mother_occupation = EXCLUDED.mother_occupation,
                father_name = EXCLUDED.father_name,
                father_contact = EXCLUDED.father_contact,
                father_occupation = EXCLUDED.father_occupation,
                guardian_name = EXCLUDED.guardian_name,
                guardian_contact = EXCLUDED.guardian_contact,
                guardian_occupation = EXCLUDED.guardian_occupation,
                house_address = EXCLUDED.house_address,
                updated_at = CURRENT_DATE
            RETURNING *;
        `;

        const result = await pool.query(upsertQuery, [
            studentId,
            sanitize(mother_name), sanitize(mother_contact), sanitize(mother_occupation),
            sanitize(father_name), sanitize(father_contact), sanitize(father_occupation),
            sanitize(guardian_name), sanitize(guardian_contact), sanitize(guardian_occupation),
            sanitize(house_address)
        ]);

        return res.status(200).json({
            success: true,
            message: "Family information saved successfully.",
            parentProfile: result.rows[0]
        });

    } catch (err) {
        console.error("Parent Profile Save Error:", err);
        
        // Catch our custom database constraint fail if they left absolutely everything blank
        if (err.constraint === 'at_least_one_caregiver') {
            return res.status(400).json({ 
                success: false, 
                error: "You must provide details for at least one caregiver (Mother, Father, or Guardian)." 
            });
        }

        return res.status(500).json({ success: false, error: "Internal server error saving family details." });
    }
};



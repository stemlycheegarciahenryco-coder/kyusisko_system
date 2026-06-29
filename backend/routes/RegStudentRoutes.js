const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const transporter = require ('../config/mailer_resend');
const bcrypt = require('bcrypt');
const path = require('path');


router.post('/register', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            email, password, firstName, lastName, middleName, suffix, 
            gender, birthDate, contactNumber,
            district, barangay, street, zipCode // New address fields from frontend
        } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const studentQuery = `
            INSERT INTO students (
                student_email, 
                student_password_hash, 
                sfirst_name, 
                slast_name, 
                smiddle_name, 
                suffix, 
                sgender,
                sbirth_date, 
                scontact_number,
                sdistrict,
                sbarangay,
                sstreet,
                szip_code,   
                is_profile_complete,
                role
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,  false, 'student')
            RETURNING id;
        `;
        
        const studentValues = [
            email, 
            hashedPassword, 
            firstName, 
            lastName, 
            middleName || null, 
            suffix || null, 
            gender, 
            birthDate, 
            contactNumber,
            district,
            barangay,
            street,
            zipCode
        ];
        
        const studentResult = await client.query(studentQuery, studentValues);
        const studentId = studentResult.rows[0].id;

        await client.query('COMMIT');
        res.status(201).json({ message: "Student registered successfully", studentId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("REGISTRATION ERROR:", err);
        
        if (err.code === '23505') {
            return res.status(400).json({ error: "Email already registered." });
        }
        res.status(500).json({ error: "Server error: " + err.message });
    } finally {
        client.release();
    }
});



// --- AI SMART SCAN ROUTE --- WEE TRY TO MIGRATE THIS INTO ORG SIDE VALIDATE THE STUDENT DOCS FOR THE SCHOLARSHIP APPLICATIONS

/*const { validateDocument } = require('../utils/docValidator');

router.post('/verify-doc/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch ALL paths for this student
        const result = await pool.query(`
            SELECT s.*, a.gwa, a.sdocument_path, a.report_card_path, a.good_moral_path, 
                   a.school_name, a.grade_level, s.sid_card_path as coe_path
            FROM students s
            JOIN academic_records a ON s.id = a.student_id
            WHERE s.id = $1
            LIMIT 1
        `, [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: "Student records not found" });
        const student = result.rows[0];
        const category = student.academic_category?.toLowerCase();

        // 2. Determine which files are required based on your rules
        let filesToVerify = [];
        
        // COE is always required (stored in sid_card_path)
        if (student.coe_path) filesToVerify.push({ path: student.coe_path, type: 'COE' });

        if (category === 'tertiary' || category === 'senior high') {
            // Needs GradeSlip/TOR (sdocument_path)
            if (student.sdocument_path) filesToVerify.push({ path: student.sdocument_path, type: 'TOR' });
        } else {
            // Elementary/HighSchool needs Report Card and Good Moral
            if (student.report_card_path) filesToVerify.push({ path: student.report_card_path, type: 'ReportCard' });
            if (student.good_moral_path) filesToVerify.push({ path: student.good_moral_path, type: 'GoodMoral' });
        }

        if (filesToVerify.length === 0) {
            return res.status(400).json({ error: "No uploaded files found for this student." });
        }

        // 3. Run the AI Validation
        const analysis = await validateDocument(filesToVerify, student);

        // 4. Send back the results
        res.json({
            analysis: {
                documentType: category === 'tertiary' ? "COE & Grade Slip" : "COE, Report Card & Good Moral",
                extractedName: `${student.sfirst_name} ${student.slast_name}`,
                ...analysis
            }
        });

    } catch (err) {
        console.error("AI Route Error:", err);
        res.status(500).json({ error: "Internal Server Error during AI Scan" });
    }
});*/


router.post('/send-registration-otp', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 10 mins

    try {
        const checkUser = await pool.query(
            'SELECT id FROM students WHERE student_email = $1', 
            [email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ 
                error: "This email is already registered. Please log in or use a different email." 
            });
        }
        // Upsert logic: If the email already has an OTP, update it.
        await pool.query(
            `INSERT INTO otp_codes (email, code, method, expires_at) 
             VALUES ($1, $2, 'email', $3)
             ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = $3`,
            [email, otp, expiresAt]
        );

        // FIX: Respond to the client immediately once the OTP is safely saved.
        // The frontend no longer waits on the Gmail SMTP round-trip (which can
        // take several seconds) before the "processing" state clears.
        res.json({ message: "Verification code sent." });

        // Fire-and-forget the actual email send. Errors are logged but can no
        // longer fail the HTTP response, since the client has already moved on.
        transporter.sendMail({
            // FIX: Was process.env.EMAIL_USER (old Gmail address) — Resend
            // rejected this with a 403 because it tried to verify "gmail.com"
            // as the sending domain, which isn't yours to verify. Now uses
            // RESEND_FROM_EMAIL, which is under your verified kyusisko.com domain.
            from: `"KyusISKO" <${process.env.RESEND_FROM_EMAIL}>`,
            to: email,
            subject: "KyusISKO | Verification Code",
            html: `<h3>Welcome to KyusISKO!</h3>
                   <p>Please use the code below to verify your email and continue your registration:</p>
                   <h2 style="color: #2563eb; letter-spacing: 4px;">${otp}</h2>`
        }).catch(err => {
            console.error("MAILER ERROR (async send failed for", email, "):", err.message);
        });

    } catch (err) {
        console.error("MAILER ERROR", err);
        res.status(500).json({ error: "Failed to send email." });
    }
});

// 2. Verify OTP for NEW registration
// Change 'code' to 'otp' in the destructuring
router.post('/verify-registration-otp', async (req, res) => {
    const { email, otp } = req.body; 
    
    try {
        // Change 'org_reg' to 'email' to match your student send logic
        const result = await pool.query(
            `SELECT * FROM otp_codes 
             WHERE email = $1 
             AND code = $2 
             AND method = 'email' 
             AND expires_at > NOW()`,
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired student verification code." });
        }

        // Cleanup specifically for this email and method
        await pool.query(
            `DELETE FROM otp_codes WHERE email = $1 AND method = 'email'`, 
            [email]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error("Student OTP Verification Error:", err.message);
        res.status(500).json({ error: "Server error during verification." });
    }
});


router.post('/student-onboarding-profile', async (req, res) => {
    const {
        student_id,
        college_id,
        other_school,
        course_id,
        other_degree_program,
        religion,
        other_religion,
        is_indigenous,
        indigenous_group,
        is_pwd,
        is_working_student,
        is_poverty_program,
        program_type,
        other_program,
        is_athlete,
        sports_interests,
        other_sport
    } = req.body;

    if (!student_id) {
        return res.status(400).json({ error: "Missing Student ID" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Adjusted query referencing the updated schema columns
        const query = `
            INSERT INTO student_onboarding_profiles (
                student_id, college_id, other_school, course_id, other_degree_program,
                is_working_student, is_pwd, religion, other_religion, is_indigenous,
                indigenous_group, is_poverty_program, program_type, other_program,
                is_athlete, sports_interests, other_sport
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (student_id) 
            DO UPDATE SET 
                college_id = EXCLUDED.college_id,
                other_school = EXCLUDED.other_school,
                course_id = EXCLUDED.course_id,
                other_degree_program = EXCLUDED.other_degree_program,
                is_working_student = EXCLUDED.is_working_student,
                is_pwd = EXCLUDED.is_pwd,
                religion = EXCLUDED.religion,
                other_religion = EXCLUDED.other_religion,
                is_indigenous = EXCLUDED.is_indigenous,
                indigenous_group = EXCLUDED.indigenous_group,
                is_poverty_program = EXCLUDED.is_poverty_program,
                program_type = EXCLUDED.program_type,
                other_program = EXCLUDED.other_program,
                is_athlete = EXCLUDED.is_athlete,
                sports_interests = EXCLUDED.sports_interests,
                other_sport = EXCLUDED.other_sport,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const sportsData = Array.isArray(sports_interests) ? JSON.stringify(sports_interests) : '[]';

        const values = [
            student_id,
            college_id || null,
            other_school || null,
            course_id || null,
            other_degree_program || null,
            is_working_student,
            is_pwd,
            religion || null,
            other_religion || null,
            is_indigenous,
            indigenous_group || null,
            is_poverty_program,
            program_type || null,
            other_program || null,
            is_athlete,
            sportsData,
            other_sport || null
        ];

        const result = await client.query(query, values);

        // Mark profile as complete in the main students table
        await client.query(
            'UPDATE students SET is_profile_complete = true WHERE id = $1',
            [student_id]
        );

        await client.query('COMMIT');
        
        res.status(201).json({ 
            success: true,
            message: "Onboarding completed successfully!", 
            data: result.rows[0] 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("DATABASE ONBOARDING ERROR:", err.message);
        res.status(500).json({ error: "Server error while saving profile." });
    } finally {
        client.release();
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Your DB connection
const transporter = require ('../config/mailer'); // Your mailer setup
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// Configure how files are saved
const storage = multer.diskStorage({
    destination: 'uploads/', 
    filename: (req, file, cb) => {
        const prefix = file.fieldname === 'coe' ? 'ID' : 'TOR';
        cb(null, `${prefix}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage,
    limits:{fileSize: 5 * 1024 * 1024},
    ignoreEncryption: true
 });

const registerUpload = upload.fields([
    { name: 'document', maxCount: 1 }, // This is the Grade Slip
    { name: 'coe', maxCount: 1 },
    { name: 'reportCard', maxCount: 1 },  // New: Report Card
    { name: 'goodMoral', maxCount: 1 } // This is the School ID
]);

//sending student request
router.post('/register', registerUpload, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            email, password, firstName, lastName, middleName, suffix, 
                 
            gender, sbirth_date, contactNumber, address, gwa,
            academic_category, grade_level, school_name, school_year, term
        } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const getPath = (fieldname) => req.files[fieldname] ? req.files[fieldname][0].path.replace(/\\/g, '/') : null;
        
        const coePath = getPath('coe');
        const documentPath = getPath('document');
        const reportCardPath = getPath('reportCard');
        const goodMoralPath = getPath('goodMoral');

        // 1. Insert into STUDENTS (Now includes academic_category)
        const studentQuery = `
            INSERT INTO students (
                student_email, student_password_hash, sfirst_name, 
                slast_name, smiddle_name, suffix, sgender,
                
                sbirth_date, scontact_number, saddress, sid_card_path,
                sstatus, is_profile_complete, academic_category -- Added here
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', false, $12)
            RETURNING id;
        `;
        const studentValues = [
            email, hashedPassword, firstName, lastName, middleName || null, 
                                    
            suffix || null, gender, sbirth_date, contactNumber, address, coePath,
            academic_category // Added here
        ];
        const studentResult = await client.query(studentQuery, studentValues);
        const studentId = studentResult.rows[0].id;

        // 2. Insert into ACADEMIC_RECORDS 
        // Note: You can keep it here too, or remove it if you moved it entirely to students.
        const academicQuery = `
            INSERT INTO academic_records (
                student_id, grade_level, school_name, 
                school_year, term, gwa, sdocument_path, 
                report_card_path, good_moral_path, is_current
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true);
        `;
        const academicValues = [
            studentId, grade_level, school_name, 
            school_year, term, gwa ? parseFloat(gwa) : null, 
            documentPath, reportCardPath, goodMoralPath
        ];
        await client.query(academicQuery, academicValues);

        await client.query('COMMIT');

        res.status(201).json({
            message: "Student registered successfully",
            studentId: studentId
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Registration Error:", err.message);
        if (err.code === '23505') {
            return res.status(400).json({ error: "Email already registered." });
        }
        res.status(500).json({ error: "Server error during registration." });
    } finally {
        client.release();
    }
});



// --- AI SMART SCAN ROUTE ---
const { validateDocument } = require('../utils/docValidator');

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
});

module.exports = router;
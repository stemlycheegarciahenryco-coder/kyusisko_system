const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const authCtrl = require('../controller/authController');
const adminCtrl = require('../controller/adminController');
const stdCtrl = require('../controller/studentController');
const { verifyToken, isStudent } = require('../middleware/auth');
const upload = require('../middleware/multerConfig');
const handleUpload = require('../middleware/handleUpload');

const { authLimiter, generalLimiter, otpVerifyLimiter, otpSendLimiter } = require('../middleware/rateLimiter');

// ==========================================
// 1. SYSTEM & ORGANIZATION AUTHENTICATION 
// ==========================================

// 🚀 FIXED & SEPARATED: Replaced the old shared authCtrl.login with separate paths
// For System Administrators (Root & Co-Admins logging in with SADM-XXX tracking IDs)


router.post('/auth/portal-login', authLimiter, authCtrl.portalLogin);



// Shared Security Utilities
router.post('/auth/forgot-password', otpSendLimiter, authCtrl.forgotPassword);
router.post('/auth/reset-password', otpVerifyLimiter, authCtrl.resetPassword);
router.get('/auth/login-attempts', authCtrl.getLogInAttempt);
router.post('/auth/logout', authCtrl.logout);

router.post('/auth/respond-login-approval', authCtrl.respondLoginApproval);

router.post('/auth/mfa/generate', verifyToken, authCtrl.generateMfaSetup);
router.post('/auth/mfa/verify', verifyToken, authCtrl.verifyMfaSetup);

// ==========================================
// 2. STUDENT ACCOUNT MANAGEMENT
// ==========================================

router.put('/students/update-2fa', verifyToken, isStudent, stdCtrl.update2FA);
router.get('/students', stdCtrl.getAllStudents);
router.put('/students/change-password', verifyToken, isStudent, stdCtrl.changePassword);
router.patch('/students/:id/status', stdCtrl.updateStudentStatus);

// Student Profiles and Applications Workspace
router.get('/students/profile-full/me', verifyToken, isStudent, stdCtrl.getFullProfile);
router.get('/students/my-scholarships', verifyToken, isStudent, stdCtrl.getMyScholarships);
router.get('/students/:id', stdCtrl.getStudentById);
router.patch('/students/update-portfolio', verifyToken, isStudent, handleUpload(upload.array('files', 10)), stdCtrl.updatePortfolio);
router.delete('/students/portfolio-item', verifyToken, isStudent, stdCtrl.removePortfolioItem);
router.put('/upload-profile/me', verifyToken, isStudent, handleUpload(upload.single('profile_image')), stdCtrl.updateProfilePic);
router.put('/students/parent-profile/me', verifyToken, isStudent, stdCtrl.saveOrUpdateParentProfile);
router.put('/students/personal-info/me', verifyToken, isStudent, stdCtrl.updatePersonalInfo);

// ==========================================
// 3. SYSTEM ADMINISTRATION CORE OPERATIONS
// ==========================================
router.get('/sub-admins', adminCtrl.getSubAdmins);
router.get('/reports', adminCtrl.getReports);
router.put('/reports/takedown/:scholarshipId', adminCtrl.takedownScholarship);
router.put('/reports/dismiss/:reportId', adminCtrl.dismissReport);

// Platform Analytical Telemetry & Audits
router.get('/stats', adminCtrl.getStats);
router.get('/rootadmin/audit-logs', adminCtrl.getAuditLogs);

router.post('/post/check/email', async (req, res) => {
    try {
        const { email } = req.body
        const emailCheck = await pool.query(
            `SELECT email FROM users WHERE email = $1 
             UNION 
             SELECT student_email FROM students WHERE student_email = $1 
             UNION 
             SELECT sub_email FROM sub_admins WHERE sub_email = $1`,
            [email.trim()]
        );

        if (emailCheck.rows.length > 0) {
            res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
        }

        // Return the plain-text generatedPassword so the frontend can display it in Swal
        res.status(200).json({
            success: true,
        });

    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
    }
});



router.get('/org/role', verifyToken, async (req, res) => {
    try {
        // 1. Get email from req.user (populated by verifyToken middleware)
        const email = req.user.email; 

        // 2. Moved query inside the try block
        const roleCheck = await pool.query(
            `SELECT account_type, last_name, first_name FROM sub_admins WHERE sub_email = $1`,
            [email.trim()]
        );

        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 3. Extract the exact value from .rows[0]
        const accountType = roleCheck.rows[0].account_type;
        const first = roleCheck.rows[0].first_name;
        const last = roleCheck.rows[0].last_name;

        res.status(200).json({
            success: true,
            role: accountType,
            first_name: first,
            last_name: last
        });
    } 
    catch (error) {
        console.error('Error fetching org role:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});


module.exports = router;

module.exports = router;

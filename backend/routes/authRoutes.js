const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const authCtrl = require('../controller/authController');
const adminCtrl = require('../controller/adminController');
const stdCtrl = require ('../controller/studentController');
const {verifyToken, isStudent} = require('../middleware/auth');
const upload = require('../middleware/multerConfig');

// ==========================================
// 1. SYSTEM & ORGANIZATION AUTHENTICATION 
// ==========================================

// 🚀 FIXED & SEPARATED: Replaced the old shared authCtrl.login with separate paths
// For System Administrators (Root & Co-Admins logging in with SADM-XXX tracking IDs)


router.post('/auth/portal-login', authCtrl.portalLogin); 



// Shared Security Utilities
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);
router.get('/auth/login-attempts', authCtrl.getLogInAttempt); 


// ==========================================
// 2. STUDENT ACCOUNT MANAGEMENT
// ==========================================

router.put('/students/update-2fa', stdCtrl.update2FA);
router.get('/students', stdCtrl.getAllStudents);

router.patch('/students/:id/status', stdCtrl.updateStudentStatus);

// Student Profiles and Applications Workspace
router.get('/students/profile-full/:id', stdCtrl.getFullProfile);
router.get('/students/my-scholarships', verifyToken, isStudent, stdCtrl.getMyScholarships);
router.get('/students/:id', stdCtrl.getStudentById);
router.patch('/students/update-portfolio', verifyToken, isStudent, upload.array('files', 10), stdCtrl.updatePortfolio);
router.put('/update-profile/:id', upload.single('profile_image'), stdCtrl.updateProfilePic);
router.put('/students/parent-profile/:studentId', stdCtrl.saveOrUpdateParentProfile);


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

module.exports = router;
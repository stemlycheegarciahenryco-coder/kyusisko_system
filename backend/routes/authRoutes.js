const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const authCtrl = require('../controller/authController');
const adminCtrl = require('../controller/adminController');
const stdCtrl = require ('../controller/studentController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


// Authentication 
router.post('/auth/adminlogin', authCtrl.login);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);

router.get('/auth/login-attempts', authCtrl.getLogInAttempt); // <-- Renamed from getLoginAttempts to logAttempts


//Student Auth to system
router.post('/students/login', stdCtrl.studentLogin);
router.put('/students/update-2fa', stdCtrl.update2FA);
router.get('/students', stdCtrl.getAllStudents);
router.get('/students/:id', stdCtrl.getStudentById);


router.patch('/students/:id/status', stdCtrl.updateStatusStudent );
router.put('/update-profile/:id', upload.single('profile_image'), stdCtrl.updateProfile);







// Root Admin - Sub-Admin Management
router.get('/sub-admins', adminCtrl.getSubAdmins);

// Stats
router.get('/stats', adminCtrl.getStats);

module.exports = router;
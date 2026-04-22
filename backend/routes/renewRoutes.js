const express = require('express');
const router = express.Router();
const renewController = require('../controller/renewController');
const { verifyToken, isSubAdmin, isStudent } = require('../middleware/auth');
const upload = require('../middleware/multerConfig');

// ALL NOTIFICATION ROUTES
router.get('/notifications/org', verifyToken, renewController.getOrgNotifications);
router.get('/notifications/student', verifyToken, isStudent, renewController.getStudentNotifications);

// STUDENT ACTIONS
router.get('/requirements/:appId', verifyToken, renewController.getRequirements);
router.post('/submit', verifyToken, isStudent, upload.any(), renewController.submit);

// ADMIN ACTIONS
router.post('/setup/:appId', verifyToken, isSubAdmin, renewController.setup);
router.post('/approve/:appId', verifyToken, isSubAdmin, renewController.approveRenewalSubmission);

module.exports = router;
const express = require('express');
const router = express.Router();
const application = require('../controller/applicationController');
const { verifyToken, isSubAdmin, isStudent } = require('../middleware/auth');
const upload = require('../middleware/upload');

// student only — upload.any() handles multiple file fields dynamically
router.post('/scholarship/:id/apply', verifyToken, isStudent, upload.any(), application.applyScholarship);
router.get('/applications/my', verifyToken, isStudent, application.getMyApplications);
router.get('/applications/my/:appId', verifyToken, isStudent, application.getMyApplicationById);


// In applicationRoutes.js or authRoutes.js

// sub_admin only
router.get('/scholarship/:id/applications', verifyToken, isSubAdmin, application.getScholarshipApplications);
router.get('/scholarship/:id/applications/:appId', verifyToken, isSubAdmin, application.getApplicationDetail);
router.patch('/scholarship/:id/applications/:appId/status', verifyToken, isSubAdmin, application.updateApplicationStatus);

module.exports = router;
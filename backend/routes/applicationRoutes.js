const express = require('express');
const router = express.Router();
const application = require('../controller/applicationController.js');
const { verifyToken, isSubAdmin, isStudent } = require('../middleware/auth');
const upload = require('../middleware/upload');

// student only — upload.any() handles multiple file fields dynamically
router.post('/:id/apply', verifyToken, isStudent, upload.any(), application.applyScholarship);
router.get('/details-scholarships/:id', verifyToken, isStudent, application.getScholarshipDetails);


// In applicationRoutes.js or authRoutes.js

// sub_admin only
router.get('/scholarship/:id/applicants', verifyToken, isSubAdmin, application.getScholarshipApplications);
//application details for sub_admin fetching the applicaiton detail of the student
router.get('/scholarship/:id/applications/:appId', verifyToken, isSubAdmin, application.getApplicationDetail);
router.patch('/scholarship/:id/applications/:appId/status', verifyToken, isSubAdmin, application.updateApplicationStatus);
//for compliance
router.post('/scholarship/:id/applications/:appId/comply', verifyToken, isSubAdmin, application.sendComplianceRequest);
router.get('/:appId/compliance', verifyToken, isStudent, application.getComplianceRequest);
router.post('/:appId/comply-submit', verifyToken, isStudent, upload.array('files', 5), application.submitComplianceDocuments);
module.exports = router;
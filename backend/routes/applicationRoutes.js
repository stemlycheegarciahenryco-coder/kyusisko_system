const express = require('express');
const router = express.Router();
const application = require('../controller/applicationController.js');
const disbursement = require('../controller/disbursementController.js');
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

// student view — full history for one of their own applications
// (files, compliance, renewal, receipts — notes come from /comments/:appId)
router.get('/:appId/my-history', verifyToken, isStudent, application.getMyApplicationHistory);

// for disbursement management (sub_admin only)
router.post('/scholarship/:id/applications/:appId/disburse', verifyToken, isSubAdmin, disbursement.recordDisbursement);
router.get('/scholarship/:id/disbursements', verifyToken, isSubAdmin, disbursement.getDisbursementLedger);
router.get('/disbursements', verifyToken, isSubAdmin, disbursement.getOrgDisbursementLedger);

// student view — their own receipt history across every program
router.get('/my-disbursements', verifyToken, isStudent, disbursement.getMyDisbursements);

module.exports = router;
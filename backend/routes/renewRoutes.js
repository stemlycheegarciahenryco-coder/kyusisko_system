const express = require('express');
const router = express.Router();
const renewController = require('../controller/renewController');
const { verifyToken } = require('../middleware/auth'); // Adjust path to your auth middleware
const upload = require('../middleware/multerConfig');
// Route: PATCH /api/renewals/:id/request
router.patch('/:id/renew', verifyToken, renewController.requestRenewal);

// Route: PATCH /api/renewals/:id/terminate
router.patch('/:id/terminate', verifyToken, renewController.terminateApplication);
router.get('/:id/renewal-compliance', renewController.getRenewalCompliance);    
router.post('/:id/renew-submit', verifyToken, upload.array('files'), renewController.submitRenewal);
router.patch('/:id/renew-approve', verifyToken, renewController.approveRenewal);
router.get('/:id/submissions', renewController.getRenewalSubmissions);
module.exports = router;
const express = require('express');
const router = express.Router();
const uploadOrgPic = require('../config/orgMulter');
const { verifyToken } = require('../middleware/auth');
const orgController = require('../controller/orgController');

// Standardized Routes
router.get('/profile/:id', verifyToken, orgController.getOrgProfile);
router.patch('/profile/:id', verifyToken, orgController.updateOrgProfile);
router.patch('/profile-picture/:id', verifyToken, uploadOrgPic, orgController.updateProfilePicture);

router.get('/applications', verifyToken, orgController.getOrgApplications);
router.get('/dashboard-programs/:id', verifyToken, orgController.getOrgPrograms);

// Dedicated profile programs endpoint
router.get('/profile-programs/:id', verifyToken, orgController.getOrgProfilePrograms);

// ✅ FIX: Changed semicolon to colon
router.post('/programs/:id', verifyToken, orgController.addProgram);
router.patch('/programs/:programId/visibility', verifyToken, orgController.toggleProfileProgramVisibility);

router.get('/dashboard-stats', verifyToken, orgController.getDashboardStats);
router.get('/conflicts', verifyToken, orgController.monitorApplications);

// Password change
router.patch('/change-password', verifyToken, orgController.changePassword);

// Co-admin management
router.get('/co-admins', verifyToken, orgController.getCoAdmins);
router.post('/co-admins', verifyToken, orgController.addCoAdmin);
router.delete('/co-admins/:coAdminId', verifyToken, orgController.removeCoAdmin);

module.exports = router;
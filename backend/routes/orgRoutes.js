const express = require('express');
const router = express.Router();
const uploadOrgPic = require('../config/orgMulter');
const { verifyToken } = require('../middleware/auth');
const orgController = require('../controller/orgController');

// Standardized Routes (All start with /profile/:id or similar)
router.get('/profile/:id', verifyToken, orgController.getOrgProfile);
router.patch('/profile/:id', verifyToken, orgController.updateOrgProfile);
router.patch('/profile-picture/:id', verifyToken, uploadOrgPic.single('org_pic'), orgController.updateProfilePicture);
router.get('/applications', verifyToken, orgController.getOrgApplications);
router.get('/dashboard-programs/:id', verifyToken, orgController.getOrgPrograms);
router.get('/dashboard-stats', verifyToken, orgController.getDashboardStats);
router.get('/conflicts', verifyToken, orgController.monitorApplications);

// Password change (forced on first login after approval)
router.patch('/change-password', verifyToken, orgController.changePassword);

// Co-admin management (main org only)
router.get('/co-admins', verifyToken, orgController.getCoAdmins);
router.post('/co-admins', verifyToken, orgController.addCoAdmin);
router.delete('/co-admins/:coAdminId', verifyToken, orgController.removeCoAdmin);

module.exports = router;
const express = require('express');
const router = express.Router();
const uploadOrgPic = require('../config/orgMulter'); // Ensure this name matches the export
const { verifyToken } = require('../middleware/auth');
const orgController = require('../controller/orgController'); // Import the whole object

// 1. GET Profile
router.get('/:id/profile', verifyToken, orgController.getOrgProfile);

// 2. PATCH Text Details
router.patch('/:id/profile', verifyToken, orgController.updateOrgProfile);

// 3. PATCH Profile Picture
router.patch('/:id/profile-picture', verifyToken, uploadOrgPic.single('org_pic'), orgController.updateProfilePicture);


router.get('/applications', verifyToken, orgController.getOrgApplications);
module.exports = router;
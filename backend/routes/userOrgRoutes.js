const express = require('express');
const router = express.Router();

// Middleware to verify JWT tokens and attach req.user (including id, org_id, and account_type)
const { verifyToken } = require('../middleware/auth'); 

// Import the user management controllers
const { 
    getOrgUsers, 
    transferOwnership, 
    changePassword 
} = require('../controller/userManagementController');

/* ── USER MANAGEMENT & SECURITY ROUTES ── */

// 1. Get all team members in the organization (Owner & Co-Admins can access)
router.get('/team', verifyToken, getOrgUsers);

// 2. Transfer main account ownership to a co-admin (Protected inside controller for account_type === 'main')
router.post('/transfer-ownership', verifyToken, transferOwnership);

// 3. Update main account password (Protected inside controller for account_type === 'main')
router.post('/change-password', verifyToken, changePassword);

module.exports = router;
// routes/superRoutes.js
const express = require('express');
const router = express.Router();
const superController = require('../controller/superController');
const { verifyToken } = require('../middleware/auth');

// The path here is relative to the prefix in server.js
// If server.js uses '/api/super', then this becomes '/api/super/create-root'
router.post('/create-root', superController.createRootAdmin);
router.get('/admins', superController.getAllAdmins);
router.get('/audit-trails', superController.getAuditLogs);
router.patch('/admin-status/:id',verifyToken, superController.updateAdminStatus);
router.patch('/reset-password/:id', superController.resetAdminPassword);
router.get('/system-stats', superController.getSystemStats);
module.exports = router;
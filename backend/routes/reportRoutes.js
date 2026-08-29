const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');
const { verifyToken } = require('../middleware/auth'); // <-- Your auth middleware

// Make sure verifyToken (or your equivalent) is passed before the controller
router.get('/financial', verifyToken, reportController.getFinancialReport);
router.get('/demographics', verifyToken, reportController.getDemographicReport);
router.get('/criteria', verifyToken, reportController.getCriteriaReport);

module.exports = router;
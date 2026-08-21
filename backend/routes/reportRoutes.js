const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');

// Endpoints for OrgReports.jsx Reports & Analytics section
router.get('/financial', reportController.getFinancialReport);
router.get('/demographics', reportController.getDemographicReport);
router.get('/criteria', reportController.getCriteriaReport);

module.exports = router;
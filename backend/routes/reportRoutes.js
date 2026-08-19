const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');

// Endpoints for OrgLogs.jsx Reports & Analytics Tab
router.get('/financial', reportController.getFinancialReport);
router.get('/demographics', reportController.getDemographicReport);
router.get('/dss-interpretation', reportController.getDistrictDSSReport);

module.exports = router;
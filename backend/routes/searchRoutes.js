// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const searchController = require('../controller/searchController');
const { verifyToken, isStudent } = require('../middleware/auth');

// Mount global search endpoint with security middleware guards
router.get('/global-search', verifyToken, isStudent, searchController.globalSearch);

module.exports = router;
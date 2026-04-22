const express = require('express');
const router = express.Router();
// Import BOTH functions from your controller
const { 
  getRecommendedScholarships, 
  getAllScholarships 
} = require('../controller/recommendationController');

// 1. Specific static routes MUST come first
router.get('/all', getAllScholarships);

// 2. Dynamic parameter routes come last
router.get('/:studentId', getRecommendedScholarships);

module.exports = router;
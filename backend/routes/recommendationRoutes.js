const express = require('express');
const router = express.Router();
const { 
  getRecommendedScholarships, 
  getAllScholarships,
  getRecommendedProviders,
  reportScholarship,
  saveScholarship,
  unsaveScholarship,
  getSavedScholarships
} = require('../controller/recommendationController');
const { verifyToken } = require('../middleware/auth');

// Static routes first
router.get('/all', verifyToken, getAllScholarships);
router.get('/providers', getRecommendedProviders);
router.get('/saved-scholarships', verifyToken, getSavedScholarships);

// Action routes with two segments — MUST come before /:studentId
router.post('/:id/save', verifyToken, saveScholarship);
router.delete('/:id/unsave', verifyToken, unsaveScholarship);
router.post('/:id/report', verifyToken, reportScholarship);

// Wildcard last
router.get('/:studentId', verifyToken, getRecommendedScholarships);

module.exports = router;
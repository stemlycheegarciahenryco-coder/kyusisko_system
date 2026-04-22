// ScholarshipRoutes.js
const express = require('express');
const router = express.Router();
const scholarship = require('../controller/scholarshipController');
const { verifyToken } = require('../middleware/auth');

// --- PUBLIC OR SHARED ROUTES ---
// (If you want students to see these, they stay here)
router.use(verifyToken); 

// These two now work for BOTH Admins and Students because 
// we removed the sub_admin_id check in the controller!
router.get('/scholarships/:id', scholarship.getScholarshipById);
router.get('/scholarships/:id/fields', scholarship.getScholarshipFields);


// --- ADMIN ONLY ROUTES ---
// (You might want to add an 'isAdmin' middleware here later)
router.post('/scholarships-create', scholarship.createScholarship);
router.get('/scholarships', scholarship.getScholarships);

router.post('/scholarships/:id/fields', scholarship.saveScholarshipFields);
router.put('/scholarships/:id', scholarship.updateScholarship);
router.patch('/scholarships/:id/status', scholarship.updateScholarshipStatus);
router.delete('/scholarships/:id', scholarship.deleteScholarship);

module.exports = router;
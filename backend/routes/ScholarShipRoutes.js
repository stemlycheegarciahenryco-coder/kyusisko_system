const express = require('express');
const router = express.Router();
const scholarship = require('../controller/scholarshipController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/multerConfig'); // Import your multer config

router.use(verifyToken); 

// Core Scholarship Routes
// ADD upload.array('attachments') HERE
router.post('/', upload.array('attachments'), scholarship.createScholarship);


router.get('/view-details/:id', scholarship.getScholarshipById);

// If you want to allow file updates later, add it here too:
router.patch('/:id', upload.array('attachments'), scholarship.updateScholarship);

router.patch('/:id/status', scholarship.updateScholarshipStatus);


router.get('/:id/requirements', scholarship.getRequirements);

module.exports = router;
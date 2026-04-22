const express = require('express');
const router = express.Router();
const scholarfields = require('../controller/scholarshipFieldsController');

router.post('/scholarship/:id/fields', scholarfields.createScholarshipField);
router.get('/scholarship/:id/fields', scholarfields.getScholarshipFields);
router.put('/scholarship/:id/fields/:fid', scholarfields.updateScholarshipField);
router.delete('/scholarship/:id/fields/:fid', scholarfields.deleteScholarshipField);

router.patch('/scholarship/:id/fields/:fid/status', scholarfields.toggleScholarshipFieldStatus);

module.exports = router;
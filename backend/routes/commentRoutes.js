const express = require('express');
const router = express.Router();
const commentController = require('../controller/commentController');

router.get('/:applicationId', commentController.getCommentsByApplication);
router.post('/:applicationId', commentController.addComment);

module.exports = router;
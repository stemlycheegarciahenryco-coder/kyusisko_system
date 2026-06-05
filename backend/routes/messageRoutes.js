const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  getThreads, 
  getThreadMessages,
    getMyStatusForOrg,    // 🛠️ Added new controller method
  getStudentStatusForOrg    // 🛠️ Added new controller method
} = require('../controller/messageController');
const { verifyToken } = require('../middleware/auth');
const checkMessagingEligibility = require('../middleware/checkMessagingEligibility');

// Existing messaging routes
router.post('/send', verifyToken, checkMessagingEligibility, sendMessage);
router.get('/threads', verifyToken, getThreads);
router.get('/thread/:threadId', verifyToken, getThreadMessages);
router.get('/my-status/:subAdminId', verifyToken, getMyStatusForOrg);  // 👈 new
router.get('/student-status/:id', verifyToken, getStudentStatusForOrg);
// 🛠️ New Status Verification Routes
// Students check their own status


// Orgs check a specific student's status (Uses the route parameter :id)
router.get('/student-status/:id', verifyToken, getStudentStatusForOrg);

module.exports = router;
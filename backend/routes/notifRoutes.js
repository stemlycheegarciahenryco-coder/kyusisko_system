const express = require('express');
const router = express.Router();
const notif = require('../controller/notificationController'); // Ensure the path is correct
const { verifyToken, isStudent, isSubAdmin } = require('../middleware/auth');

//  student Notification Routes-----
router.get('/notifications', verifyToken, isStudent, notif.getStudentNotifications);
router.get('/notifications/unread-count', verifyToken, isStudent, notif.getUnreadCount);
router.post('/notifications/mark-read', verifyToken, isStudent, notif.markAllAsRead);

//Organization Routes----
router.get('/org', verifyToken, isSubAdmin, notif.getOrgNotifications);
router.post('/org/mark-read', verifyToken, isSubAdmin, notif.markOrgAllAsRead);


module.exports = router;
const express = require('express');
const router = express.Router();
const notif = require('../controller/notificationController'); 
const { verifyToken, isStudent, isSubAdmin } = require('../middleware/auth');

//  student Notification Routes-----
router.get('/notifications', verifyToken, isStudent, notif.getStudentNotifications);
router.get('/notifications/unread-count', verifyToken, isStudent, notif.getUnreadCount);
router.post('/notifications/mark-read', verifyToken, isStudent, notif.markAllAsRead);

// NEW ENDPOINTS: Single Read and Delete
router.patch('/notifications/:id/read', verifyToken, isStudent, notif.markSingleAsRead);
router.delete('/notifications/:id', verifyToken, isStudent, notif.deleteNotification);

//Organization Routes----
router.get('/org', verifyToken, isSubAdmin, notif.getOrgNotifications);
router.post('/org/mark-read', verifyToken, isSubAdmin, notif.markOrgAllAsRead);

module.exports = router;
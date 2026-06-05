// middleware/checkMessagingEligibility.js
const pool = require('../config/db');

const checkMessagingEligibility = async (req, res, next) => {
    try {
        const senderId = parseInt(req.user.id);
        const senderType = req.user.role;
        const { targetId } = req.body;

        let studentId, subAdminId;
        if (senderType === 'student') {
            studentId = senderId;
            subAdminId = parseInt(targetId);
        } else {
            subAdminId = senderId;
            studentId = parseInt(targetId);
        }

        // Check status scoped to THIS specific org's scholarship
        const result = await pool.query(`
            SELECT a.status 
            FROM applications a
            JOIN scholarships sp ON a.scholarship_id = sp.id
            WHERE a.student_id = $1 
              AND sp.sub_admin_id = $2
            ORDER BY a.created_at DESC 
            LIMIT 1
        `, [studentId, subAdminId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: "No application found between these parties." });
        }

        const { status } = result.rows[0];
        const allowed = ['approved', 'renewal'];

        if (!allowed.includes(status.toLowerCase())) {
            return res.status(403).json({
                success: false,
                message: `Messaging unavailable. Application status is: ${status}`
            });
        }

        next();
    } catch (err) {
        console.error("Eligibility check error:", err.message);
        res.status(500).json({ success: false, message: "Server error during eligibility check." });
    }
};

module.exports = checkMessagingEligibility;
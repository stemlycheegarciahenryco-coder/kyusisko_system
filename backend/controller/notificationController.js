const pool = require('../config/db');

// =================================================================
// STUDENT NOTIFICATION CONTROLLERS
// =================================================================

exports.getStudentNotifications = async (req, res) => {
  const studentId = req.user.id; 

  try {
    // Guaranteed by 'isStudent' middleware to only target student rows
    const query = `
      SELECT id, title, message, is_read, created_at, application_id, org_id
      FROM notifications
      WHERE student_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [studentId]);
    return res.status(200).json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const student_id = req.user.id;
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications 
       WHERE student_id = $1 AND is_read = FALSE`,
      [student_id]
    );
    res.status(200).json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const student_id = req.user.id;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE student_id = $1 AND is_read = FALSE`,
      [student_id]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// =================================================================
// SUB-ADMIN / ORGANIZATION CONTROLLERS
// =================================================================

exports.getOrgNotifications = async (req, res) => {
  try {
    const org_id = req.user.id; // Tied safely to SubAdmin via your new route setup

    // Extra safety: Filter out any shared notification layouts by targeting org logs specifically
    const result = await pool.query(
      `SELECT id, title, message, is_read, created_at, application_id, org_id
       FROM notifications
       WHERE org_id = $1 AND student_id IS NULL
       ORDER BY created_at DESC`,
      [org_id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Fetch Org Notifications Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markOrgAllAsRead = async (req, res) => {
  try {
    const org_id = req.user.id;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE org_id = $1 AND student_id IS NULL AND is_read = FALSE`,
      [org_id]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
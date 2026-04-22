const pool = require('../config/db');

/**
 * GET DASHBOARD STATS
 * Provides the counts for the Root Admin dashboard cards
 */
exports.getStats = async (req, res) => {
  try {
    const [students, applications, scholarships, subAdmins] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM students'),
      pool.query('SELECT COUNT(*) FROM applications'),
      pool.query('SELECT COUNT(*) FROM scholarships'),
      pool.query('SELECT COUNT(*) FROM sub_admins WHERE is_active = true')
    ]);

    res.json({
      totalStudents: parseInt(students.rows[0].count) || 0,
      totalApplications: parseInt(applications.rows[0].count) || 0,
      totalScholarships: parseInt(scholarships.rows[0].count) || 0,
      totalSubAdmins: parseInt(subAdmins.rows[0].count) || 0,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
/**
 * GET ALL APPROVED SUB-ADMINS
 * This is for the "Main" sub-admin list (not the onboarding/pending list)
 */
exports.getSubAdmins = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, org_name, sub_email, first_name, last_name, contact_number, created_at
      FROM sub_admins 
      WHERE is_active = true
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Fetch SubAdmins Error:", err.message);
    res.status(500).json({ error: 'Server Error fetching sub-admins' });
  }
};



const updateStatus = async (req, res) => {
    const { applicationId, newStatus } = req.body; // e.g., 'approved' or 'rejected'

    try {
        // 1. Update the student_applications table
        await pool.query(
            'UPDATE student_applications SET status = $1 WHERE id = $2',
            [newStatus, applicationId]
        );

        // 2. ADD THIS: Log the admin's decision
        await pool.query(
            'INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)',
            [
                req.user.id, 
                `ADMIN_${newStatus.toUpperCase()}`, 
                `Admin ${newStatus} application #${applicationId}`
            ]
        );

        res.json({ message: `Application ${newStatus}` });
    } catch (err) { /* ... */ }
};
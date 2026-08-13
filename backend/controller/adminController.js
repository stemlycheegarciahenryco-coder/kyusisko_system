const pool = require('../config/db');
const { trackEvent } = require('../utils/logger');

/**
 * GET DASHBOARD STATS
 * Provides the counts for the Root Admin dashboard cards
 */
exports.getStats = async (req, res) => {
  try {
    const [
      studentsCount, 
      applicationsCount, 
      scholarshipsCount, 
      subAdminsCount,
      recentStudents,
      recentProviders
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM students'),
      pool.query('SELECT COUNT(*) FROM applications'), 
      pool.query('SELECT COUNT(*) FROM scholarships'),
      pool.query('SELECT COUNT(*) FROM sub_admins WHERE is_active = true'),
      
      // 🚀 FIXED USING ALIASES: Map sfirst_name/slast_name to first_name/last_name
      pool.query('SELECT id, sfirst_name AS first_name, slast_name AS last_name FROM students ORDER BY id DESC LIMIT 5'),
      
      // 🚀 FIXED USING ALIASES: Map org_name to name, and sub_email to email
      pool.query('SELECT id, org_name AS name, sub_email AS email FROM sub_admins ORDER BY id DESC LIMIT 5')
    ]);

    res.json({
      totalStudents: parseInt(studentsCount.rows[0].count) || 0,
      totalApplications: parseInt(applicationsCount.rows[0].count) || 0,
      totalScholarships: parseInt(scholarshipsCount.rows[0].count) || 0,
      totalSubAdmins: parseInt(subAdminsCount.rows[0].count) || 0,
      recentStudents: recentStudents.rows,
      recentProviders: recentProviders.rows
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

/**
 * UPDATE STUDENT APPLICATION STATUS
 */
exports.updateStatus = async (req, res) => {
    const { applicationId, newStatus } = req.body; 
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // 1. Update the correct applications table
        await pool.query(
            'UPDATE applications SET status = $1 WHERE id = $2', 
            [newStatus, applicationId]
        );

        // 2. Track Event via Logger Helper — system-level action, not tied to any org
        await trackEvent({
            userId: req.user ? req.user.id : null, 
            actionType: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} (Admin)`,
            ipAddress: ip,
            details: `Admin modified status of application ID #${applicationId} to status: ${newStatus}.`
        });

        res.json({ message: `Application ${newStatus}` });
    } catch (err) { 
        console.error("Update Status Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// reportssssss section
exports.getReports = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id AS report_id,
        r.reason,
        r.status,
        r.created_at,

        -- Student info
        CONCAT(s.sfirst_name, ' ', s.slast_name) AS student_name,
        s.student_email,

        -- Scholarship full details
        sc.id AS scholarship_id,
        sc.title AS scholarship_title,
        sc.description,
        sc.deadline,
        sc.slots,
        sc.gwa_requirement,
        sc.fund_type,
        sc.status AS scholarship_status,
        sc.amount_range,
        sc.criteria,
        sc.taken_down,

        -- Org info
        sa.org_name,
        sa.org_pic,
        sa.sub_email AS org_email,
        sa.contact_number AS org_contact

      FROM reports r
      JOIN students s ON r.student_id = s.id
      JOIN scholarships sc ON r.scholarship_id = sc.id
      JOIN sub_admins sa ON sc.sub_admin_id = sa.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Get Reports Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// TAKE DOWN a scholarship (admin only)
exports.takedownScholarship = async (req, res) => {
  const { scholarshipId } = req.params;
  const { reason } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // 1. Get scholarship + org info
    const scholarshipCheck = await pool.query(
      `SELECT sc.sub_admin_id, sc.title, sa.org_name
       FROM scholarships sc
       JOIN sub_admins sa ON sc.sub_admin_id = sa.id
       WHERE sc.id = $1`,
      [scholarshipId]
    );

    if (scholarshipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Scholarship not found" });
    }

    const { sub_admin_id, title, org_name } = scholarshipCheck.rows[0];

    console.log(`Taking down scholarship "${title}" owned by org ID: ${sub_admin_id}`);

    // 2. Take down the scholarship
    await pool.query(
      `UPDATE scholarships SET taken_down = TRUE, status = 'Closed' WHERE id = $1`,
      [scholarshipId]
    );

    // 3. Resolve all reports for this scholarship
    await pool.query(
      `UPDATE reports SET status = 'resolved' WHERE scholarship_id = $1`,
      [scholarshipId]
    );

    // 4. Insert notification for the org
    await pool.query(
      `INSERT INTO notifications (
        title,
        message,
        student_id,
        org_id,
        is_read,
        created_at
      ) VALUES ($1, $2, $3, $4, FALSE, NOW())`,
      [
        '⚠️ Scholarship Taken Down',
        `Your scholarship program "${title}" has been taken down by the system administrator. Reason: ${reason || 'Reported violation'}. Please contact support for more information.`,
        null,
        sub_admin_id 
      ]
    );

    // 5. Track Enforcement Action — system-level action targeting a specific org
    await trackEvent({
        userId: req.user ? req.user.id : null,
        targetOrgId: sub_admin_id,
        actionType: 'Scholarship Takedown',
        ipAddress: ip,
        details: `Administrative takedown forced on scholarship program "${title}" (ID: ${scholarshipId}) managed by "${org_name}". Reason: ${reason || 'Unspecified violation'}.`
    });

    res.status(200).json({
      success: true,
      message: `Scholarship taken down. Org (ID: ${sub_admin_id}) notified.`
    });
  } catch (err) {
    console.error("Admin Takedown Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DISMISS a single report (no action taken)
exports.dismissReport = async (req, res) => {
  const { reportId } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const reportQuery = await pool.query(
      `SELECT r.reason, sc.title FROM reports r 
       JOIN scholarships sc ON r.scholarship_id = sc.id 
       WHERE r.id = $1`, [reportId]
    );

    await pool.query(
      `UPDATE reports SET status = 'dismissed' WHERE id = $1`,
      [reportId]
    );

    const contextInfo = reportQuery.rows[0];
    const itemTitle = contextInfo ? `filed against "${contextInfo.title}"` : `ID #${reportId}`;

    // Log dismissal — system-level action
    await trackEvent({
        userId: req.user ? req.user.id : null,
        actionType: 'Report Dismissed',
        ipAddress: ip,
        details: `Report ${itemTitle} was reviewed and dismissed by admin. No structural action taken.`
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Dismiss Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET SYSTEM AUDIT LOG FEED
 * System admin gets full oversight: their own platform-level actions
 * (system_admin_audit_trails) UNIONed with every provider's activity
 * (provider_audit_trails). Providers themselves never see this combined
 * feed — their own org-side endpoint filters strictly by sub_admin_id.
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const queryText = `
      SELECT * FROM (
        -- System-level actions (admin takedowns, report dismissals, etc.)
        SELECT
          sat.id,
          sat.action_type,
          sat.details,
          sat.created_at,
          COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), 'System Admin') AS actor_name,
          u.email AS actor_email,
          'Admin' AS actor_role,
          org.org_name AS related_org_name
        FROM system_admin_audit_trails sat
        LEFT JOIN users u ON sat.admin_id = u.id
        LEFT JOIN sub_admins org ON sat.target_org_id = org.id

        UNION ALL

        -- Provider-level actions, scoped per org
        SELECT
          pat.id,
          pat.action_type,
          pat.details,
          pat.created_at,
          COALESCE(NULLIF(TRIM(CONCAT(actor.first_name, ' ', actor.last_name)), ''), actor.org_name, 'Organization') AS actor_name,
          actor.sub_email AS actor_email,
          CASE WHEN actor.account_type = 'co_admin' THEN 'Co-Admin' ELSE 'Organization' END AS actor_role,
          org.org_name AS related_org_name
        FROM provider_audit_trails pat
        LEFT JOIN sub_admins actor ON pat.actor_id = actor.id
        LEFT JOIN sub_admins org ON pat.sub_admin_id = org.id
      ) combined
      ORDER BY created_at DESC
      LIMIT 250
    `;

    const { rows } = await pool.query(queryText);
    
    return res.status(200).json({
      success: true,
      logs: rows
    });
  } catch (error) {
    console.error('Audit route query failure:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Database error fetching audit records.'
    });
  }
};
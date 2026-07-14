const pool = require('../config/db');

// 1. Get All Comments for an Application (Sorted Chronologically)
exports.getCommentsByApplication = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const query = `
      SELECT 
        c.id,
        c.application_id,
        c.student_id,
        c.sub_admin_id,
        c.sender_role,
        c.comment_text,
        c.created_at,
        s.sfirst_name,
        s.slast_name,
        s.sprofile_pic,
        COALESCE(sa.org_name) AS admin_username
      FROM application_comments c
      LEFT JOIN students s ON c.student_id = s.id
      LEFT JOIN sub_admins sa ON c.sub_admin_id = sa.id
      WHERE c.application_id = $1
      ORDER BY c.created_at ASC
    `;

    const result = await pool.query(query, [applicationId]);
    
    return res.status(200).json({
      success: true,
      comments: result.rows
    });
  } catch (err) {
    console.error("Fetch timeline comments error:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching timeline comments." });
  }
};

// 2. Add a New Comment to the Application Timeline
exports.addComment = async (req, res) => {
  const { applicationId } = req.params;
  const { sender_role, sender_id, comment_text } = req.body;

  if (!comment_text || comment_text.trim() === '') {
    return res.status(400).json({ success: false, error: "Comment text cannot be empty." });
  }

  try {
    let studentId = null;
    let subAdminId = null;

    if (sender_role === 'student') {
      studentId = sender_id;
    } else if (sender_role === 'sub_admin') {
      subAdminId = sender_id;
    } else {
      return res.status(400).json({ success: false, error: "Invalid sender role type specified." });
    }

    const insertQuery = `
      INSERT INTO application_comments (application_id, student_id, sub_admin_id, sender_role, comment_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const newCommentResult = await pool.query(insertQuery, [
      applicationId, 
      studentId, 
      subAdminId, 
      sender_role, 
      comment_text.trim()
    ]);

    const insertedComment = newCommentResult.rows[0];

    // Fetch details instantly to push back to UI without waiting for a re-fetch
    const hydrationQuery = `
      SELECT 
        c.*,
        s.sfirst_name, s.slast_name, s.sprofile_pic,
        COALESCE(sa.org_name) AS admin_username
      FROM application_comments c
      LEFT JOIN students s ON c.student_id = s.id
      LEFT JOIN sub_admins sa ON c.sub_admin_id = sa.id
      WHERE c.id = $1
    `;
    const fullComment = await pool.query(hydrationQuery, [insertedComment.id]);

    return res.status(201).json({
      success: true,
      comment: fullComment.rows[0]
    });
  } catch (err) {
    console.error("Add timeline comment error:", err);
    return res.status(500).json({ success: false, error: "Internal server error submitting timeline comment." });
  }
};
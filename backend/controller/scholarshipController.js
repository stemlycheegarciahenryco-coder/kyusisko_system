const pool = require('../config/db'); // your pg pool




//THIS FILE IS FOR SCHOLAR MANAGE SCHOLARSHIPS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// POST /scholarship
const createScholarship = async (req, res) => {
  try {
    // 1. Get info from body (DON'T destructure sub_admin_id here)
    const { title, 
            description, 
            deadline,
            target_academic_level, 
            min_gwa_requirement } = req.body;
    
    // 2. Get the ID from your middleware (req.user is populated by your JWT verify)
    if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    const sub_admin_id = req.user.id; 

    
    const finalGwa = (min_gwa_requirement === "" || min_gwa_requirement === undefined) ? null : parseFloat(min_gwa_requirement);

    const result = await pool.query(
  `INSERT INTO scholarships (
    sub_admin_id, 
    title, 
    description, 
    deadline,  
    status, 
    target_academic_level, 
    min_gwa_requirement
  )
   
   VALUES ($1, $2, $3, $4, 'draft', $5, $6)
   RETURNING *`,
  [sub_admin_id, title, description, deadline, target_academic_level, finalGwa]
);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Scholarship Create Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /scholarship  (only scholarships of this sub_admin)
const getScholarships = async (req, res) => {
  try {
    const sub_admin_id = req.user.id;

    // This query gets the scholarships AND the counts of applications per scholarship
    const result = await pool.query(
      `SELECT 
        s.*, 
        COUNT(a.id) AS total_apps,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) AS pending_count,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) AS accepted_count
      FROM scholarships s
      LEFT JOIN applications a ON s.id = a.scholarship_id
      WHERE s.sub_admin_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC`,
      [sub_admin_id]
    );

    // Also fetch the 5 most recent applicants across ALL programs for the dashboard table
    const recentApps = await pool.query(
      `SELECT a.id, st.sfirst_name, st.slast_name, s.title as program_name, a.submitted_at
       FROM applications a
       JOIN students st ON a.student_id = st.id
       JOIN scholarships s ON a.scholarship_id = s.id
       WHERE s.sub_admin_id = $1
       ORDER BY a.submitted_at DESC
       LIMIT 5`,
      [sub_admin_id]
    );

    res.status(200).json({ 
      success: true, 
      data: result.rows, 
      recent: recentApps.rows 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /scholarship/:id
const getScholarshipById = async (req, res) => {
  try {
    const { id } = req.params;
    

    const result = await pool.query(
      `SELECT * FROM scholarships WHERE id = $1`, 
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Scholarship not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /scholarship/:id this is for updating in modal 
const updateScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = req.user.id;
    const { title, description, deadline,  } = req.body;

    const result = await pool.query(
      `UPDATE scholarships
       SET title = $1, description = $2, deadline = $3, updated_at = NOW()
       WHERE id = $5 AND sub_admin_id = $6
       RETURNING *`,
      [title, description, deadline,  id, sub_admin_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Scholarship not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /scholarship/:id/status  (draft → open → closed → archived)
const updateScholarshipStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = req.user.id; // Ensure this is coming from your JWT middleware
    const { status } = req.body;

    const formattedStatus = status.toLowerCase();
    const allowed = ['draft', 'open', 'closed', 'archived'];
    
    if (!allowed.includes(formattedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE scholarships 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND sub_admin_id = $3
       RETURNING *`,
      [formattedStatus, id, sub_admin_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Scholarship not found or you do not have permission.' 
      });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// DELETE /scholarship/:id
const deleteScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = req.user.id;

    await pool.query(
      `DELETE FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [id, sub_admin_id]
    );

    res.status(200).json({ success: true, message: 'Scholarship deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveScholarshipFields = async (req, res) => {
  const { id } = req.params; // scholarship_id from URL
  const { fields } = req.body;
  const sub_admin_id = req.user.id; 
  
  const client = await pool.connect();

  try {
    // Ownership check remains the same
    const ownershipCheck = await client.query(
      'SELECT id FROM scholarships WHERE id = $1 AND sub_admin_id = $2',
      [id, sub_admin_id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await client.query('BEGIN');

    // 1. Match your table name: form_fields
    await client.query('DELETE FROM form_fields WHERE scholarship_id = $1', [id]);

    for (const [index, field] of fields.entries()) {
      await client.query(
        `INSERT INTO form_fields 
         (scholarship_id, field_label, field_type, is_required, options, validation_rules, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id, 
          field.field_label, 
          field.field_type, 
          field.is_required || false, 
          JSON.stringify(field.options || {}), 
          JSON.stringify(field.validation_rules || {}), // Added from your ERD
          field.sort_order || index
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Form fields saved!" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
};

const getScholarshipFields = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM form_fields WHERE scholarship_id = $1 ORDER BY sort_order ASC',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};





module.exports = {
  getScholarshipFields,
  createScholarship,
  getScholarships,
  getScholarshipById,
  saveScholarshipFields,
  updateScholarship,
  updateScholarshipStatus,
  deleteScholarship,
  
};
const pool = require('../config/db');

// 💡 BULLETPROOF FIX: RegEx String Parser to catch and strip "GMT+0800" strings 
const formatToLocalDateString = (inputDate) => {
  if (!inputDate) return null;
  
  const dateStr = String(inputDate).trim();

  // If it contains 'GMT', extract standard components manually
  if (dateStr.includes('GMT')) {
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return null;
    }
  }

  // Check if it's already a clean YYYY-MM-DD string
  const cleanMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (cleanMatch) {
    return cleanMatch[1];
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  } catch (err) {
    return null;
  }
  
  return null;
};

// POST /api/scholarships
const createScholarship = async (req, res) => {
  const { title, description, deadline, slots, gwa, fund_type, requirements, amount_range, criteria } = req.body;
  const sub_admin_id = req.user.id;
  
  const attachmentPaths = req.files ? req.files.map(f => f.path) : [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 💡 FIX: Intercept deadline field and immunize it before parsing parameters
    const cleanDeadline = formatToLocalDateString(deadline);

    const parsedRequirements = typeof requirements === 'string' ? JSON.parse(requirements) : (requirements || []);
    const parsedCriteria = typeof criteria === 'string' ? JSON.parse(criteria) : (criteria || []);

    const parsedGwa = parseFloat(gwa);
    const finalGwa = (gwa === "" || gwa == null || isNaN(parsedGwa)) ? null : parsedGwa;
    const finalSlots = (slots === "" || slots == null || slots === undefined) ? null : parseInt(slots, 10);

    // Insert main scholarship
    const schResult = await client.query(
      `INSERT INTO scholarships (sub_admin_id, title, description, deadline, slots, gwa_requirement, fund_type, amount_range, criteria, attachments, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
       RETURNING id`,
      [sub_admin_id, title, description, cleanDeadline, finalSlots, finalGwa, fund_type, amount_range, parsedCriteria, attachmentPaths]
    );

    const scholarshipId = schResult.rows[0].id;

    // Insert Requirements
    if (parsedRequirements && parsedRequirements.length > 0) {
      for (const reqItem of parsedRequirements) {
        if (reqItem.label) {
          await client.query(
            `INSERT INTO scholarship_requirements (scholarship_id, field_label, field_type, is_required) 
             VALUES ($1, $2, $3, $4)`,
            [scholarshipId, reqItem.label, reqItem.type || 'file', true]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, scholarshipId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Create Error:", err.message); 
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  } finally {
    client.release();
  }
};

// GET /api/scholarships
const getScholarships = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM scholarships WHERE sub_admin_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/scholarships/view-details/:id
const getScholarshipById = async (req, res) => {
  try {
    const { id } = req.params;
    const scholarshipResult = await pool.query(`SELECT * FROM scholarships WHERE id = $1`, [id]);
    
    if (scholarshipResult.rows.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    const reqResult = await pool.query(
      `SELECT * FROM scholarship_requirements WHERE scholarship_id = $1`, 
      [id]
    );

    const scholarship = {
      ...scholarshipResult.rows[0],
      criteria: scholarshipResult.rows[0].criteria || [],
      requirements: reqResult.rows 
    };

    res.status(200).json({ success: true, data: scholarship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// edit scholarship
const updateScholarship = async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, slots, gwa, fund_type, amount_range, criteria, requirements } = req.body;
  const sub_admin_id = req.user.id;
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); 

    const cleanDeadline = formatToLocalDateString(deadline);
    const parsedGwa = parseFloat(gwa);
    const finalGwa = (gwa === "" || gwa == null || isNaN(parsedGwa)) ? null : parsedGwa;
    const finalSlots = (slots === "" || slots == null || slots === undefined) ? null : parseInt(slots, 10);

    // Update the main scholarship record
    await client.query(
      `UPDATE scholarships 
       SET title = $1, description = $2, deadline = $3, slots = $4, 
           gwa_requirement = $5, fund_type = $6, amount_range = $7, 
           criteria = $8, updated_at = NOW() 
       WHERE id = $9 AND sub_admin_id = $10`,
      [title, description, cleanDeadline, finalSlots, finalGwa, fund_type, amount_range, criteria || [], id, sub_admin_id]
    );

    // 💡 FIX: Wipe out old items first to clear out stale parameters
    await client.query(
      `DELETE FROM scholarship_requirements WHERE scholarship_id = $1`,
      [id]
    );

    if (requirements && Array.isArray(requirements)) {
      for (const reqItem of requirements) {
        const labelToSave = reqItem.label || reqItem.field_label;
        const typeToSave = reqItem.type || reqItem.field_type || 'file';

        if (labelToSave) { 
          await client.query(
            `INSERT INTO scholarship_requirements (scholarship_id, field_label, field_type, is_required) 
             VALUES ($1, $2, $3, $4)`,
            [id, labelToSave, typeToSave, true]
          );
        }
      }
    }

    await client.query('COMMIT'); 
    res.status(200).json({ success: true, message: "Scholarship updated successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Update Error:", err.message);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  } finally {
    client.release();
  }
};

// PATCH /api/scholarships/:id/status
const updateScholarshipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = status.toLowerCase();

    const result = await pool.query(
      `UPDATE scholarships 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND sub_admin_id = $3 
       RETURNING *`,
      [normalizedStatus, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Scholarship not found or unauthorized" });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Status Update Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/scholarships/:id
const deleteScholarship = async (req, res) => {
  try {
    await pool.query(`DELETE FROM scholarships WHERE id = $1 AND sub_admin_id = $2`, [req.params.id, req.user.id]);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/scholarships/:id/requirements
const getRequirements = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scholarship_requirements WHERE scholarship_id = $1',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createScholarship,
  getScholarships,
  getScholarshipById,
  updateScholarshipStatus,
  deleteScholarship,
  updateScholarship,
  getRequirements
};
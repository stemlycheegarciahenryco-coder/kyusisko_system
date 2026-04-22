const pool = require('../config/db');

// helper — verify scholarship belongs to this sub_admin
const verifyOwnership = async (scholarship_id, sub_admin_id) => {
  const result = await pool.query(
    `SELECT id FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
    [scholarship_id, sub_admin_id]
  );
  return result.rows.length > 0;
};
//THIS FILE IS FOR SCHOLAR MANAGE FIELDSSSS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// POST /scholarship/:id/fields
const createScholarshipField = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = req.user.id;
    const { field_label, field_type, is_required, options, validation_rules, sort_order } = req.body;

    const owned = await verifyOwnership(id, sub_admin_id);
    if (!owned)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    // validate field_type
    const allowed_types = ['text', 'textarea', 'file', 'select', 'checkbox', 'radio', 'date', 'number'];
    if (!allowed_types.includes(field_type))
      return res.status(400).json({ success: false, message: 'Invalid field_type' });

    // options required for select/radio/checkbox
    if (['select', 'radio', 'checkbox'].includes(field_type) && !options)
      return res.status(400).json({ success: false, message: `options is required for field_type: ${field_type}` });

    const result = await pool.query(
      `INSERT INTO form_fields 
        (scholarship_id, field_label, field_type, is_required, options, validation_rules, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        field_label,
        field_type,
        is_required ?? true,
        options ? JSON.stringify(options) : null,
        validation_rules ? JSON.stringify(validation_rules) : null,
        sort_order ?? 0
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /scholarship/:id/fields
const getScholarshipFields = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = req.user.id;

    const owned = await verifyOwnership(id, sub_admin_id);
    if (!owned)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const result = await pool.query(
      `SELECT * FROM form_fields WHERE scholarship_id = $1 ORDER BY sort_order ASC`,
      [id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /scholarship/:id/fields/:fid
const updateScholarshipField = async (req, res) => {
  try {
    const { id, fid } = req.params;
    const sub_admin_id = req.user.id;
    const { field_label, field_type, is_required, options, validation_rules, sort_order } = req.body;

    const owned = await verifyOwnership(id, sub_admin_id);
    if (!owned)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const result = await pool.query(
      `UPDATE form_fields
       SET field_label = $1, field_type = $2, is_required = $3,
           options = $4, validation_rules = $5, sort_order = $6
       WHERE id = $7 AND scholarship_id = $8
       RETURNING *`,
      [
        field_label,
        field_type,
        is_required,
        options ? JSON.stringify(options) : null,
        validation_rules ? JSON.stringify(validation_rules) : null,
        sort_order,
        fid,
        id
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Field not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /scholarship/:id/fields/:fid
const deleteScholarshipField = async (req, res) => {
  try {
    const { id, fid } = req.params;
    const sub_admin_id = req.user.id;

    const owned = await verifyOwnership(id, sub_admin_id);
    if (!owned)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    await pool.query(
      `DELETE FROM form_fields WHERE id = $1 AND scholarship_id = $2`,
      [fid, id]
    );

    res.status(200).json({ success: true, message: 'Field deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /scholarship/:id/fields/:fid/status  (toggle is_required)
const toggleScholarshipFieldStatus = async (req, res) => {
  try {
    const { id, fid } = req.params;
    const sub_admin_id = req.user.id;

    const owned = await verifyOwnership(id, sub_admin_id);
    if (!owned)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const result = await pool.query(
      `UPDATE form_fields
       SET is_required = NOT is_required
       WHERE id = $1 AND scholarship_id = $2
       RETURNING *`,
      [fid, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Field not found' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createScholarshipField,
  getScholarshipFields,
  updateScholarshipField,
  deleteScholarshipField,
  toggleScholarshipFieldStatus,
};
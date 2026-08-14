const pool = require('../config/db');
// 🔴 ADDED: Queue Manager for background AI matching
const { addJob } = require('../queues/queueManager');
const { supabaseAdmin } = require('../config/supabaseClient');


async function resolveOrgId(requesterId) {
    const r = await pool.query(
        'SELECT account_type, parent_org_id FROM sub_admins WHERE id = $1',
        [requesterId]
    );
    if (r.rows.length === 0) return null;
    const { account_type, parent_org_id } = r.rows[0];
    return account_type === 'co_admin' ? parent_org_id : requesterId;
}

const formatToLocalDateString = (inputDate) => {
  if (!inputDate) return null;
  const dateStr = String(inputDate).trim();

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

  const cleanMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (cleanMatch) return cleanMatch[1];

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

  const attachmentPaths = [];
  const client = await pool.connect();

  try {
    const sub_admin_id = await resolveOrgId(req.user.id);
    if (!sub_admin_id) {
      client.release();
      return res.status(404).json({ success: false, message: "Org not found." });
    }
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileName = `${Date.now()}-${cleanFileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('provider-reference-download')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabaseAdmin.storage
          .from('provider-reference-download')
          .getPublicUrl(fileName);

        attachmentPaths.push(publicUrlData.publicUrl);
      }
    }

    await client.query('BEGIN');

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

    // ─────────────────────────────────────────────────────────────────────────
    // 🚀 SCENARIO A: Dispatch Background AI Matching Jobs for All Active Students
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const activeStudents = await pool.query(`SELECT id FROM students WHERE sis_active = true`);
      await Promise.all(
        activeStudents.rows.map(student =>
          addJob('engineMatching', 'computeMatch', {
            studentId: student.id,
            scholarshipId: scholarshipId
          })
        )
      );
    } catch (queueErr) {
      console.error("Failed to queue AI matching jobs on creation:", queueErr.message);
    }

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
    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    const result = await pool.query(
      `SELECT 
        s.*, 
        sa.org_pic, 
        sa.org_name
       FROM scholarships s
       LEFT JOIN sub_admins sa ON s.sub_admin_id = sa.id
       WHERE s.sub_admin_id = $1 
       ORDER BY s.created_at DESC`,
      [orgId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Database Error:", err.message);
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

// Edit scholarship
const updateScholarship = async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, slots, gwa, fund_type, amount_range, criteria, requirements } = req.body;

  const client = await pool.connect();

  try {
    const sub_admin_id = await resolveOrgId(req.user.id);
    if (!sub_admin_id) {
      client.release();
      return res.status(404).json({ success: false, message: "Org not found." });
    }

    await client.query('BEGIN'); 

    const cleanDeadline = formatToLocalDateString(deadline);
    const parsedGwa = parseFloat(gwa);
    const finalGwa = (gwa === "" || gwa == null || isNaN(parsedGwa)) ? null : parsedGwa;
    const finalSlots = (slots === "" || slots == null || slots === undefined) ? null : parseInt(slots, 10);

    await client.query(
      `UPDATE scholarships 
       SET title = $1, description = $2, deadline = $3, slots = $4, 
           gwa_requirement = $5, fund_type = $6, amount_range = $7, 
           criteria = $8, updated_at = NOW() 
       WHERE id = $9 AND sub_admin_id = $10`,
      [title, description, cleanDeadline, finalSlots, finalGwa, fund_type, amount_range, criteria || [], id, sub_admin_id]
    );

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

    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    const result = await pool.query(
      `UPDATE scholarships 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND sub_admin_id = $3 
       RETURNING *`,
      [normalizedStatus, req.params.id, orgId]
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
    const orgId = await resolveOrgId(req.user.id);
    if (!orgId) return res.status(404).json({ success: false, message: "Org not found." });

    await pool.query(`DELETE FROM scholarships WHERE id = $1 AND sub_admin_id = $2`, [req.params.id, orgId]);
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
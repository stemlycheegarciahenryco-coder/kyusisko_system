const pool = require('../config/db');

// POST /scholarship/:id/apply
// student submits an application with responses to all fields

const applyScholarship = async (req, res) => {
  const client = await pool.connect(); 
  try {
    const { id } = req.params;          // scholarship_id
    const student_id = req.user.id;     // from auth middleware
    
    // 1. EXTRACTION & PARSING
    let { responses } = req.body; 
    if (typeof responses === 'string') {
      try {
        responses = JSON.parse(responses);
      } catch (e) {
        client.release();
        return res.status(400).json({ success: false, message: 'Invalid responses format' });
      }
    }

    await client.query('BEGIN');

    // 2. CHECK IF SCHOLARSHIP EXISTS AND IS OPEN
    // Note: We no longer select '*' to avoid pulling the now-deleted 'slots' column
    const scholarship = await client.query(
      `SELECT status, deadline FROM scholarships WHERE id = $1`,
      [id]
    );

    if (scholarship.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    if (scholarship.rows[0].status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Scholarship is not open for applications' });
    }

    // 3. CHECK DEADLINE
    const deadline = scholarship.rows[0].deadline;
    if (deadline && new Date() > new Date(deadline)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    // 4. CHECK IF STUDENT ALREADY APPLIED
    const existing = await client.query(
      `SELECT id FROM applications WHERE scholarship_id = $1 AND student_id = $2`,
      [id, student_id]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'You already applied to this scholarship' });
    }

    // --- OLD STEP 5 (SLOT CHECK) REMOVED FROM HERE ---

    // 5. VALIDATE REQUIRED FIELDS
    const requiredFields = await client.query(
      `SELECT id, field_label FROM form_fields 
        WHERE scholarship_id = $1 AND is_required = TRUE`,
      [id]
    );

    const answeredIds = (responses || []).map(r => Number(r.form_field_id));
    const missingFields = requiredFields.rows.filter(
      field => !answeredIds.includes(field.id)
    );

    if (missingFields.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing: missingFields.map(f => f.field_label)
      });
    }

    // 6. CREATE THE APPLICATION
    const application = await client.query(
      `INSERT INTO applications (scholarship_id, student_id, status)
        VALUES ($1, $2, 'pending')
        RETURNING *`,
      [id, student_id]
    );

    const application_id = application.rows[0].id;

    // 7. SAVE EACH RESPONSE
for (const response of responses) {
  let response_value = response.response_value;

  if (req.files) {
    // Look for the file where fieldname matches the form_field_id
    const uploadedFile = req.files.find(f => f.fieldname === String(response.form_field_id));
    if (uploadedFile) {
      // CLEAN THE PATH: replace backslashes and remove the 'uploads/' prefix
      // Result: 'documents/my-file.pdf'
      response_value = uploadedFile.path.replace(/\\/g, '/').replace(/^uploads\//, '');
    }
  }

  await client.query(
    `INSERT INTO application_responses (application_id, form_field_id, response_value)
      VALUES ($1, $2, $3)`,
    [application_id, response.form_field_id, response_value]
  );
}

    await client.query('COMMIT');

await pool.query(
            'INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)',
            [
                req.user.id, 
                'STUDENT_APPLY', 
                `Student applied for Scholarship (ID: ${id})`
            ]
        );
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application.rows[0]
    });
    
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error("Apply Error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// GET /applications/my            — student views their own applications
const getMyApplications = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await pool.query(
      `SELECT 
         a.id,
         a.status,
         a.submitted_at,
         s.title AS scholarship_title,
         s.deadline,
         sa.org_name AS organization
       FROM applications a
       JOIN scholarships s ON s.id = a.scholarship_id
       JOIN sub_admins sa ON sa.id = s.sub_admin_id
       WHERE a.student_id = $1
       ORDER BY a.submitted_at DESC`,
      [student_id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /applications/my/:appId     — student views one application + their responses
const getMyApplicationById = async (req, res) => {
  try {
    const { appId } = req.params;
    const student_id = req.user.id;

    // get application
    const application = await pool.query(
      `SELECT 
         a.*,
         s.title AS scholarship_title,
         s.deadline,
         sa.org_name AS organization
       FROM applications a
       JOIN scholarships s ON s.id = a.scholarship_id
       JOIN sub_admins sa ON sa.id = s.sub_admin_id
       WHERE a.id = $1 AND a.student_id = $2`,
      [appId, student_id]
    );

    if (application.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });

    // get responses with field labels
    const responses = await pool.query(
      `SELECT 
         ar.id,
         ar.response_value,
         ff.field_label,
         ff.field_type
       FROM application_responses ar
       JOIN form_fields ff ON ff.id = ar.form_field_id
       WHERE ar.application_id = $1
       ORDER BY ff.sort_order ASC`,
      [appId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...application.rows[0],
        responses: responses.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /scholarship/:id/applications — sub_admin views all applicants (Summary List)
const getScholarshipApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = parseInt(req.user.id);

    // verify ownership of the scholarship
    const owned = await pool.query(
      `SELECT id FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [parseInt(id), sub_admin_id]
    );
    if (owned.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const result = await pool.query(
      `SELECT 
          a.id,
          a.status,
          a.submitted_at,
          s.sfirst_name,
          s.slast_name,
          s.student_email
       FROM applications a
       JOIN students s ON s.id = a.student_id
       WHERE a.scholarship_id = $1
       ORDER BY a.submitted_at DESC`,
      [id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /scholarship/:id/applications/:appId — sub_admin views one application in full (Detailed View)
const getApplicationDetail = async (req, res) => {
  try {
    const { id, appId } = req.params;
    const sub_admin_id = req.user.id;

    // 1. Verify that this scholarship actually belongs to the logged-in sub_admin
    const owned = await pool.query(
      `SELECT id FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [id, sub_admin_id]
    );
    
    if (owned.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Unauthorized access to this scholarship.' });

    // 2. Fetch application and student details
    const application = await pool.query(
  `SELECT 
      a.id, a.status, a.submitted_at, a.scholarship_id,
      s.sfirst_name, s.slast_name, s.student_email, s.sprofile_pic,
      s.academic_category, s.sbirth_date, s.sgender, s.scontact_number,
      ar.school_name, ar.gwa, ar.grade_level,ar.term  
   FROM applications a
   JOIN students s ON s.id = a.student_id
   LEFT JOIN academic_records ar ON ar.student_id = s.id 
   WHERE a.id = $1 AND a.scholarship_id = $2`,
  [appId, id]
);

    if (application.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });

    // 3. Fetch the custom form responses (including labels and types)
    const responses = await pool.query(
      `SELECT 
          ar.response_value,
          ff.field_label,
          ff.field_type
       FROM application_responses ar
       JOIN form_fields ff ON ff.id = ar.form_field_id
       WHERE ar.application_id = $1
       ORDER BY ff.sort_order ASC`,
      [appId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...application.rows[0],
        responses: responses.rows
      }
    });
  } catch (err) {
    console.error("Detail Fetch Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /scholarship/:id/applications/:appId/status  — sub_admin updates application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { id, appId } = req.params; // id is scholarship_id
    const sub_admin_id = req.user.id;
    const { status } = req.body;

    const allowed = ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    // Verify ownership
    const owned = await pool.query(
      `SELECT title FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [id, sub_admin_id]
    );
    if (owned.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const scholarshipName = owned.rows[0].title;

    // Perform Update
    const result = await pool.query(
      `UPDATE applications
       SET status = $1, updated_at = NOW()
       WHERE id = $2 
       AND scholarship_id = $3
       AND EXISTS (
         SELECT 1 FROM scholarships 
         WHERE id = $3 AND sub_admin_id = $4
       )
       RETURNING *`,
      [status, appId, id, sub_admin_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });

    const applicationData = result.rows[0];

    // --- NOTIFICATION LOGIC ---
    const notifTitle = `Application ${status.replace('_', ' ').toUpperCase()}`;
    const notifMessage = `Your application for "${scholarshipName}" has been validated to ${status.replace('_', ' ')}.`;

    await pool.query(
      `INSERT INTO notifications (student_id, title, message) 
       VALUES ($1, $2, $3)`,
      [applicationData.student_id, notifTitle, notifMessage]
    );

    // --- ADD AUDIT TRAIL LOGIC HERE ---
    // This logs WHICH Sub-Admin (Org) updated WHICH student's application
    const auditAction = `APP_${status.toUpperCase()}`;
    const auditDetails = `Org (ID: ${sub_admin_id}) set application #${appId} for "${scholarshipName}" to ${status}`;

    await pool.query(
      `INSERT INTO audit_trails (user_id, action_type, details) 
       VALUES ($1, $2, $3)`,
      [sub_admin_id, auditAction, auditDetails]
    );
    // ------------------------------------

    res.status(200).json({ success: true, data: applicationData });
  } catch (err) {
    console.error("Audit Log Error:", err.message); // Helpful for debugging
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  applyScholarship,
  getMyApplications,
  getMyApplicationById,
  getScholarshipApplications,
  getApplicationDetail,
  updateApplicationStatus
  
};
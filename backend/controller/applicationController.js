const pool = require('../config/db');

// POST /scholarship/:id/apply
// student submits an application with responses to all fields
const applyScholarship = async (req, res) => {
  const client = await pool.connect(); 
  try {
    const { id } = req.params;
    const student_id = req.user.id;
    
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

    // 1. CHECK SCHOLARSHIP EXISTS AND IS OPEN
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

    // 2. CHECK DEADLINE
    const deadline = scholarship.rows[0].deadline;
    if (deadline && new Date() > new Date(deadline)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    // 3. CHECK DUPLICATE APPLICATION
    const existing = await client.query(
      `SELECT id FROM applications WHERE scholarship_id = $1 AND student_id = $2`,
      [id, student_id]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'You already applied to this scholarship' });
    }

    // 4. VALIDATE REQUIRED FIELDS
    // ✅ Fixed: was 'form_fields', actual table is 'scholarship_requirements'
    const requiredFields = await client.query(
      `SELECT id, field_label FROM scholarship_requirements 
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

    // 5. CREATE APPLICATION
    const application = await client.query(
      `INSERT INTO applications (scholarship_id, student_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [id, student_id]
    );

    const application_id = application.rows[0].id;

    // 6. SAVE EACH RESPONSE
    // ✅ Fixed: was 'application_responses'/'form_field_id', 
    //           actual table is 'application_submissions'/'requirement_id'
    for (const response of responses) {
      const requirement_id = response.form_field_id; // frontend sends form_field_id

      // Check if a file was uploaded for this field
      let file_path = null;
      let text_value = null;

      if (req.files) {
        const uploadedFile = req.files.find(
          f => f.fieldname === String(requirement_id)
        );
        if (uploadedFile) {
          file_path = uploadedFile.path.replace(/\\/g, '/').replace(/^uploads\//, '');
        }
      }

      // If no file, use the text value
      if (!file_path) {
        text_value = response.response_value || null;
      }

      await client.query(
        `INSERT INTO application_submissions 
           (application_id, requirement_id, file_path, text_value)
         VALUES ($1, $2, $3, $4)`,
        [application_id, requirement_id, file_path, text_value]
      );
    }

    await client.query('COMMIT');

    // 7. AUDIT TRAIL
    await pool.query(
                    //!audit
      'INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)',
      [req.user.id, 'STUDENT_APPLY', `Student applied for Scholarship (ID: ${id})`]
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


// GET /details-scholarships/:id studentView
/* Backend Controller Endpoint Logic */
const getScholarshipDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get Scholarship Details (Now safely including provider_type column)
    const scholarship = await pool.query(
      `SELECT s.*, 
        provider_type AS provider_type,
        sa.org_name, 
        sa.org_pic,
        sa.contact_number,
        sa.sub_email,
        sa.website,
        sa.street_address,
        sa.barangay,
        sa.city,
        sa.region
      FROM scholarships s 
      JOIN sub_admins sa ON s.sub_admin_id = sa.id 
      WHERE s.id = $1`, [id]);
    

    if (scholarship.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    // 2. Get Requirements/Fields
    const fields = await pool.query(
      `SELECT * FROM scholarship_requirements WHERE scholarship_id = $1 ORDER BY id ASC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        scholarship: scholarship.rows[0],
        fields: fields.rows
      }
    });
  } catch (err) {
    console.error("Error fetching scholarship details:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /scholarship/:id/applications — sub_admin views all applicants (Summary List) side dashboard
const getScholarshipApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = parseInt(req.user.id);

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
          a.created_at AS submitted_at,
          s.sfirst_name,
          s.slast_name,
          s.scontact_number,
          s.student_email,
          s.sprofile_pic
        
       FROM applications a
       JOIN students s ON s.id = a.student_id
       WHERE a.scholarship_id = $1
       ORDER BY a.created_at DESC`,
      [id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Get Applicants Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET /scholarship/:id/applications/:appId — sub_admin views one application in full (Detailed View)
const getApplicationDetail = async (req, res) => {
  try {
    const { id, appId } = req.params;
    const sub_admin_id = req.user.id;

    const owned = await pool.query(
      `SELECT id FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [id, sub_admin_id]
    );
    if (owned.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Unauthorized access to this scholarship.' });

    // Added: s.school, s.course, and parent details using a left join
    const application = await pool.query(
      `SELECT 
          a.id, a.status, a.created_at AS submitted_at, a.scholarship_id,
          s.sfirst_name, s.slast_name, s.student_email, s.sprofile_pic,
          s.sgender, s.scontact_number, s.portfolio_data, s.bio,
          clg.name AS school,
          crs.name AS course,
          p.father_name, p.father_contact,
          p.mother_name, p.mother_contact,
          p.guardian_name, p.guardian_contact,
          p.house_address
       FROM applications a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN student_parents p ON p.student_id = s.id
       LEFT JOIN student_onboarding_profiles ob ON ob.student_id = s.id
       LEFT JOIN colleges clg ON clg.id = ob.college_id
       LEFT JOIN courses crs ON crs.id = ob.course_id
       WHERE a.id = $1 AND a.scholarship_id = $2`,
      [appId, id]
    );

    if (application.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });

    // Original requirement submissions
    const responsesResult = await pool.query(
      `SELECT sub.file_path, sub.text_value, req.field_label, req.field_type
       FROM application_submissions sub
       JOIN scholarship_requirements req ON req.id = sub.requirement_id
       WHERE sub.application_id = $1
       ORDER BY req.id ASC`,
      [appId]
    );

    // Latest compliance request
    const complianceRequestsResult = await pool.query(
      `SELECT * FROM compliance_requests
       WHERE application_id = $1
       ORDER BY created_at ASC`,
      [appId]
    );

    // Fetch ALL compliance submissions
    const allComplianceDocsResult = await pool.query(
      `SELECT file_path, created_at
       FROM application_submissions
       WHERE application_id = $1 
         AND source = 'compliance'
       ORDER BY created_at ASC`,
      [appId]
    );

    // Fetch Renewal Docs
    const renewalDocsResult = await pool.query(
      `SELECT file_path, created_at
       FROM application_submissions
       WHERE application_id = $1 AND source = 'renewal'
       ORDER BY created_at DESC`,
      [appId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...application.rows[0],
        responses: responsesResult.rows,
        compliance_history: complianceRequestsResult.rows,
        compliance_docs: allComplianceDocsResult.rows,
        renewal_docs: renewalDocsResult.rows,
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
    const { id, appId } = req.params;
    const sub_admin_id = req.user.id;
    const { status } = req.body;

    const allowed = ['pending', 'under_review', 'approved', 'not_eligible'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const owned = await pool.query(
      `SELECT title FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [id, sub_admin_id]
    );
    if (owned.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const scholarshipName = owned.rows[0].title;

    const result = await pool.query(
      `UPDATE applications
       SET status = $1
       WHERE id = $2 
       AND scholarship_id = $3
       AND EXISTS (
         SELECT 1 FROM scholarships WHERE id = $3 AND sub_admin_id = $4
       )
       RETURNING *`,
      [status, appId, id, sub_admin_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });

    const applicationData = result.rows[0];

    // Tailored notification per status
    const notifMap = {
      approved: {
        title: 'Application Approved 🎉',
        message: `Congratulations! Your application for "${scholarshipName}" has been approved. You are now eligible for this scholarship.`,
      },
      under_review: {
        title: 'Action Required: Submit Compliance Documents',
        message: `Your application for "${scholarshipName}" requires additional documents. Please check My Scholarships to comply and message the organization.`,
      },
      not_eligible: {
        title: 'Application Not Eligible',
        message: `We regret to inform you that your application for "${scholarshipName}" has been marked as not eligible.`,
      },
      pending: {
        title: 'Application Pending',
        message: `Your application for "${scholarshipName}" is pending review.`,
      },
    };

    const notif = notifMap[status] || {
      title: `Application ${status}`,
      message: `Your application for "${scholarshipName}" was updated to ${status}.`,
    };

    await pool.query(
      `INSERT INTO notifications (student_id, title, message, application_id, org_id, is_read)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [applicationData.student_id, notif.title, notif.message, appId, sub_admin_id]
    );

    await pool.query(
      //!audit
      `INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)`,
      [sub_admin_id, `APP_${status.toUpperCase()}`, `Org (ID: ${sub_admin_id}) set application #${appId} for "${scholarshipName}" to ${status}`]
    );

    res.status(200).json({ success: true, data: applicationData });
  } catch (err) {
    console.error("Update Status Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
//org send compliance docs
const sendComplianceRequest = async (req, res) => {
  try {
    const { id, appId } = req.params;
    const sub_admin_id = req.user.id;
    const { reason, required_docs } = req.body;

    if (!reason || !required_docs) {
      return res.status(400).json({ success: false, message: 'Reason and required documents are required.' });
    }

    // Verify ownership
    const owned = await pool.query(
      `SELECT title FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [id, sub_admin_id]
    );
    if (owned.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const scholarshipName = owned.rows[0].title;

    // Get student_id from application
    const app = await pool.query(
      `SELECT student_id FROM applications WHERE id = $1`, [appId]
    );
    if (app.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });

    const student_id = app.rows[0].student_id;

    // Save compliance request
    await pool.query(
      `INSERT INTO compliance_requests (application_id, reason, required_docs)
       VALUES ($1, $2, $3)`,
      [appId, reason, required_docs]
    );

    // Update application status to under_review
    await pool.query(
      `UPDATE applications SET status = 'under_review' WHERE id = $1`, [appId]
    );

    // Notify student
    await pool.query(
      `INSERT INTO notifications (student_id, title, message, application_id, org_id, is_read)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [
        student_id,
        'Action Required: Compliance Documents Needed',
        `Your application for "${scholarshipName}" requires additional documents. Reason: ${reason}. Required: ${required_docs}. Please go to My Scholarships to upload.`,
        appId,
        sub_admin_id
      ]
    );

    await pool.query(

                  //!audit
      `INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)`,
      [sub_admin_id, 'APP_COMPLY', `Org sent compliance request for application #${appId}`]
    );

    res.status(200).json({ success: true, message: 'Compliance request sent.' });
  } catch (err) {
    console.error("Compliance Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// NEW: GET /applications/:appId/compliance  — student fetches their compliance request
const getComplianceRequest = async (req, res) => {
  try {
    const { appId } = req.params;
    const result = await pool.query(
      `SELECT * FROM compliance_requests 
       WHERE application_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [appId]
    );
    res.status(200).json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// NEW: POST /applications/:appId/comply-submit — student uploads compliance docs
const submitComplianceDocuments = async (req, res) => {
  const client = await pool.connect();
  try {
    const { appId } = req.params;
    const student_id = req.user.id;
    const { compliance_id } = req.body;

    await client.query('BEGIN');

    // Save uploaded files as new application_submissions
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = file.path.replace(/\\/g, '/').replace(/^uploads\//, '');
        await client.query(
          `INSERT INTO application_submissions (application_id, requirement_id, file_path,source)
           VALUES ($1, NULL, $2, 'compliance')`,
          [appId, filePath]
        );
      }
    }

    // Mark compliance as submitted
    if (compliance_id) {
      await client.query(
        `UPDATE compliance_requests SET status = 'submitted' WHERE id = $1`,
        [compliance_id]
      );
    }

    // Update application back to pending for org review
    await client.query(
      `UPDATE applications SET status = 'pending' WHERE id = $1`, [appId]
    );

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Compliance documents submitted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Comply Submit Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};




module.exports = {
  applyScholarship,
  getScholarshipDetails,
  getScholarshipApplications,
  getApplicationDetail,
  updateApplicationStatus,
  sendComplianceRequest,
  getComplianceRequest,
  submitComplianceDocuments,

};
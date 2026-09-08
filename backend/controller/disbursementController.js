const pool = require('../config/db');
const { trackEvent } = require('../utils/logger');
const { resolveOrgId } = require('./applicationController');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Storage Client (Supports both SUPABASE_API_URL and SUPABASE_URL)
const supabase = createClient(
  process.env.SUPABASE_API_URL || process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'org-receipt';

// POST /scholarship/:id/applications/:appId/disburse
const recordDisbursement = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id, appId } = req.params;
    const sub_admin_id = await resolveOrgId(req.user.id);
    if (!sub_admin_id) return res.status(404).json({ success: false, message: 'Org not found.' });

    const amount_range = Number(req.body.amount_range);
    const remarks = req.body.remarks || null;
    const mode = req.body.mode || 'Cash';
    let receipt_url = null;

    // --- SUPABASE STORAGE UPLOAD ---
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `disbursements/${appId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({ success: false, message: 'Failed to upload receipt to Supabase storage.' });
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      receipt_url = publicUrlData.publicUrl;
    }

    if (!amount_range || amount_range <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount greater than 0.' });
    }

    await client.query('BEGIN');

    const scholarshipResult = await client.query(
      `SELECT id, title, sub_admin_id, total_budget, remaining_budget
       FROM scholarships
       WHERE id = $1 AND sub_admin_id = $2
       FOR UPDATE`,
      [id, sub_admin_id]
    );

    if (scholarshipResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Unauthorized or scholarship not found.' });
    }

    const scholarship = scholarshipResult.rows[0];

    if (scholarship.remaining_budget === null) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This scholarship has no budget set yet. Set a total budget before disbursing funds.'
      });
    }

    if (amount_range > Number(scholarship.remaining_budget)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Amount exceeds remaining budget (₱${Number(scholarship.remaining_budget).toLocaleString()} left).`
      });
    }

    const appResult = await client.query(
      `SELECT a.id, a.status, a.student_id, s.sfirst_name, s.slast_name
       FROM applications a
       JOIN students s ON s.id = a.student_id
       WHERE a.id = $1 AND a.scholarship_id = $2
       FOR UPDATE`,
      [appId, id]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const application = appResult.rows[0];

    if (!['approved', 'active'].includes(application.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Only approved/active scholars can receive a disbursement.'
      });
    }

    // 1. Log the disbursement with mode and Supabase receipt URL
    const inserted = await client.query(
      `INSERT INTO disbursements (application_id, scholarship_id, student_id, sub_admin_id, amount, remarks, mode, receipt_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [appId, id, application.student_id, sub_admin_id, amount_range, remarks, mode, receipt_url]
    );

    // 2. Deduct from the scholarship's remaining budget
    await client.query(
      `UPDATE scholarships SET remaining_budget = remaining_budget - $1 WHERE id = $2`,
      [amount_range, id]
    );

    // 3. Update application flags and amounts
    await client.query(
      `UPDATE applications
       SET is_disbursed = true,
           amount_range = COALESCE(amount_range, 0) + $1,
           total_disbursed = COALESCE(total_disbursed, 0) + $1
       WHERE id = $2`,
      [amount_range, appId]
    );

    // 4. Notify the student
    await client.query(
      `INSERT INTO notifications (student_id, title, message, application_id, org_id, is_read)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [
        application.student_id,
        'Funds Released 💸',
        `₱${amount_range.toLocaleString()} has been disbursed to you via ${mode} for "${scholarship.title}".`,
        appId,
        sub_admin_id
      ]
    );

    await client.query('COMMIT');

    await trackEvent({
      subAdminId: sub_admin_id,
      userId: req.user.id,
      studentId: application.student_id,
      actionType: 'Disbursement Recorded',
      details: `Disbursed ₱${amount_range.toLocaleString()} via ${mode} to ${application.sfirst_name} ${application.slast_name} for "${scholarship.title}" (application #${appId}).`
    });

    res.status(201).json({ success: true, data: inserted.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Record Disbursement Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// GET /scholarship/:id/disbursements
const getDisbursementLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const sub_admin_id = await resolveOrgId(req.user.id);
    if (!sub_admin_id) return res.status(404).json({ success: false, message: 'Org not found.' });

    const owned = await pool.query(
      `SELECT id, title, total_budget, remaining_budget FROM scholarships WHERE id = $1 AND sub_admin_id = $2`,
      [id, sub_admin_id]
    );
    if (owned.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const ledger = await pool.query(
      `SELECT
          d.id,
          d.amount,
          d.remarks,
          d.mode,
          d.receipt_path,
          d.disbursed_at,
          s.sfirst_name,
          s.slast_name,
          sch.title AS program_name
       FROM disbursements d
       JOIN students s ON s.id = d.student_id
       JOIN scholarships sch ON sch.id = d.scholarship_id
       WHERE d.scholarship_id = $1
       ORDER BY d.disbursed_at DESC`,
      [id]
    );

    const totalGiven = ledger.rows.reduce((sum, row) => sum + Number(row.amount), 0);

    res.status(200).json({
      success: true,
      data: {
        scholarship: owned.rows[0],
        total_given: totalGiven,
        entries: ledger.rows
      }
    });
  } catch (err) {
    console.error('Get Disbursement Ledger Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /disbursements (Org-wide)
const getOrgDisbursementLedger = async (req, res) => {
  try {
    const sub_admin_id = await resolveOrgId(req.user.id);
    if (!sub_admin_id) return res.status(404).json({ success: false, message: 'Org not found.' });

    const ledger = await pool.query(
      `SELECT
          d.id,
          d.amount,
          d.remarks,
          d.mode,
          d.receipt_path,
          d.disbursed_at,
          s.sfirst_name,
          s.slast_name,
          sch.title AS program_name,
          sch.id AS scholarship_id
       FROM disbursements d
       JOIN students s ON s.id = d.student_id
       JOIN scholarships sch ON sch.id = d.scholarship_id
       WHERE sch.sub_admin_id = $1
       ORDER BY d.disbursed_at DESC`,
      [sub_admin_id]
    );

    const totalGiven = ledger.rows.reduce((sum, row) => sum + Number(row.amount), 0);

    res.status(200).json({ success: true, data: { total_given: totalGiven, entries: ledger.rows } });
  } catch (err) {
    console.error('Get Org Disbursement Ledger Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /my-disbursements
const getMyDisbursements = async (req, res) => {
  try {
    const student_id = req.user.id;

    const ledger = await pool.query(
      `SELECT
          d.id,
          d.amount,
          d.remarks,
          d.mode,
          d.receipt_path,
          d.disbursed_at,
          sch.id AS scholarship_id,
          sch.title AS program_name,
          sa.org_name,
          sa.org_pic
       FROM disbursements d
       JOIN scholarships sch ON sch.id = d.scholarship_id
       JOIN sub_admins sa ON sa.id = sch.sub_admin_id
       WHERE d.student_id = $1
       ORDER BY d.disbursed_at DESC`,
      [student_id]
    );

    const totalReceived = ledger.rows.reduce((sum, row) => sum + Number(row.amount), 0);

    res.status(200).json({
      success: true,
      data: { total_received: totalReceived, entries: ledger.rows }
    });
  } catch (err) {
    console.error('Get My Disbursements Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  recordDisbursement,
  getDisbursementLedger,
  getOrgDisbursementLedger,
  getMyDisbursements,
};
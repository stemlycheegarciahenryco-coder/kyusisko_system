const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis'); 
const pool = require('../config/db');
const { trackEvent } = require('../utils/logger');
const redisConnection = require('../config/queueConnection');

const applicationQueue = new Queue('applicationSubmissionQueue', { 
  connection: redisConnection 
});

const applicationWorker = new Worker('applicationSubmissionQueue', async (job) => {
  const { id, student_id, responses, scholarshipTitle, sub_admin_id } = job.data;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const studentInfo = await client.query(
      `SELECT sfirst_name, slast_name FROM students WHERE id = $1`, 
      [student_id]
    );
    const studentName = studentInfo.rows.length > 0 
      ? `${studentInfo.rows[0].sfirst_name} ${studentInfo.rows[0].slast_name}`
      : "A student";

    const application = await client.query(
      `INSERT INTO applications (scholarship_id, student_id, status) 
       VALUES ($1, $2, 'pending') RETURNING *`, 
      [id, student_id]
    );
    const application_id = application.rows[0].id;

    for (const response of responses) {
      await client.query(
        `INSERT INTO application_submissions (application_id, requirement_id, file_path, text_value)
         VALUES ($1, $2, $3, $4)`,
        [application_id, response.requirement_id, response.file_path, response.text_value]
      );
    }

    // ─── ADDED: SEND NOTIFICATION TO ORG ───
    await client.query(
      `INSERT INTO notifications (org_id, student_id, title, message, application_id, is_read, created_at)
       VALUES ($1, NULL, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)`,
      [
        sub_admin_id, 
        'New Application Received', 
        `${studentName} applied for "${scholarshipTitle}".`, 
        application_id
      ]
    );

    await client.query('COMMIT');

    await trackEvent({
      subAdminId: sub_admin_id,
      studentId: student_id,
      actionType: 'Student Application Submitted',
      details: `${studentName} applied for "${scholarshipTitle}" (Scholarship ID: ${id}).`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in background application task processing: ${error}`);
    throw error; 
  } finally {
    client.release();
  }
}, { connection: redisConnection });

module.exports = { applicationQueue };
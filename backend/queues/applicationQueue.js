const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis'); // Make sure you have installed ioredis via npm!
const pool = require('../config/db');

// 1. Establish the Core Redis Connection
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

// 2. Define the Application Queue
const applicationQueue = new Queue('applicationSubmissionQueue', { 
  connection: redisConnection 
});

// 3. Define the Background Worker to handle DB writing tasks
const applicationWorker = new Worker('applicationSubmissionQueue', async (job) => {
  const { id, student_id, responses, scholarshipTitle, sub_admin_id } = job.data;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch student info to get their name for the live activity feed
    const studentInfo = await client.query(
      `SELECT sfirst_name, slast_name FROM students WHERE id = $1`, 
      [student_id]
    );
    const studentName = studentInfo.rows.length > 0 
      ? `${studentInfo.rows[0].sfirst_name} ${studentInfo.rows[0].slast_name}`
      : "A student";

    // Insert new parent application record cleanly
    const application = await client.query(
      `INSERT INTO applications (scholarship_id, student_id, application_status) 
       VALUES ($1, $2, 'pending') RETURNING *`, 
      [id, student_id]
    );
    const application_id = application.rows[0].id;

    // Save each individual field response securely
    for (const response of responses) {
      await client.query(
        `INSERT INTO application_submissions (application_id, requirement_id, file_path, text_value)\r\n         VALUES ($1, $2, $3, $4)`,
        [application_id, response.requirement_id, response.file_path, response.text_value]
      );
    }

    await client.query('COMMIT');

    // Log the event to your Audit Trail
    await pool.query(
      'INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)',
      [student_id, 'STUDENT_APPLY', `Student applied for Scholarship (ID: ${id})`]
    );

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in background application task processing: ${error}`);
    throw error; // Let BullMQ retry
  } finally {
    client.release();
  }
}, { connection: redisConnection });

module.exports = { applicationQueue };
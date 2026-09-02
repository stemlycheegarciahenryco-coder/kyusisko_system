// workers/matchingWorker.js
const { Worker } = require('bullmq');
const pool = require('../config/db');
const redisClient = require('../config/queueConnection');
const { calculateRuleMatch, buildStudentProfile } = require('../utils/ruleMatcher');

const engineMatchingWorker = new Worker(
  'engineMatching',
  async (job) => {
    const { studentId, scholarshipId } = job.data;

    // 1. Fetch Student Profile
    const profileResult = await pool.query(
      `SELECT sop.*, s.bio, s.portfolio_data, s.year_level, s.sgender AS gender, s.gwa,
              c.name AS course_name, col.name AS college_name
       FROM student_onboarding_profiles sop
       JOIN students s ON s.id = sop.student_id
       LEFT JOIN courses c ON c.id = sop.course_id
       LEFT JOIN colleges col ON col.id = sop.college_id
       WHERE sop.student_id = $1`,
      [studentId]
    );

    if (profileResult.rows.length === 0) return;

    const pRow = profileResult.rows[0];
    const student = { bio: pRow.bio, year_level: pRow.year_level, gender: pRow.gender, gwa: pRow.gwa };
    const studentProfile = buildStudentProfile(student, pRow, { courseName: pRow.course_name, collegeName: pRow.college_name });

    // 2. Fetch Scholarship Details
    const scholarshipResult = await pool.query(
      `SELECT id, title, description, criteria, gwa_requirement FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );

    if (scholarshipResult.rows.length === 0) return;
    const scholarship = scholarshipResult.rows[0];

    // 3. Execute Rule Matcher
    const result = await calculateRuleMatch(studentProfile, scholarship);

    // 4. Save Rule Results to PostgreSQL
    const computedNow = new Date().toISOString();
    await pool.query(
      `INSERT INTO match_scores (student_id, scholarship_id, is_eligible, criteria_results, summary, computed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (student_id, scholarship_id)
       DO UPDATE SET is_eligible = $3, criteria_results = $4, summary = $5, computed_at = NOW()`,
      [
        studentId, 
        scholarshipId, 
        result.is_eligible, 
        JSON.stringify(result.criteria_results), 
        result.summary
      ]
    );

    // 5. Update Redis Cache
    const redisKey = `match:${studentId}:${scholarshipId}`;
    const cachePayload = {
      is_eligible: result.is_eligible,
      criteria_results: result.criteria_results,
      summary: result.summary,
      computed_at: computedNow
    };
    await redisClient.setex(redisKey, 86400, JSON.stringify(cachePayload));
  },
  {
    connection: redisClient
  }
);

engineMatchingWorker.on('failed', (job, err) => {
  console.error(`Matching Job ${job?.id} failed with error: ${err.message}`);
});

module.exports = { engineMatchingWorker };
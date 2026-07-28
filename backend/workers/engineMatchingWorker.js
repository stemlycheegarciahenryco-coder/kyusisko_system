// workers/aiMatchingWorker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const pool = require('../config/db');
const redisClient = require('../config/queueConnection');
const { getAIMatch, buildStudentProfileForAI } = require('../utils/engineMatcher');



const engineMatchingWorker = new Worker(
  'engineMatching',
  async (job) => {
    const { studentId, scholarshipId } = job.data;

    // 1. Fetch Student Profile Data
    const profileResult = await pool.query(
      `SELECT sop.*, s.bio, s.portfolio_data, s.year_level, s.sgender AS gender,
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
    const student = { bio: pRow.bio, portfolio_data: pRow.portfolio_data, year_level: pRow.year_level, gender: pRow.gender };
    const aiProfile = buildStudentProfileForAI(student, pRow, { courseName: pRow.course_name, collegeName: pRow.college_name });

    // 2. Fetch Scholarship Details
    const scholarshipResult = await pool.query(
      `SELECT id, title, description, criteria FROM scholarships WHERE id = $1`,
      [scholarshipId]
    );

    if (scholarshipResult.rows.length === 0) return;
    const scholarship = scholarshipResult.rows[0];

    // 3. Call Gemini AI Engine
    const result = await getAIMatch(aiProfile, scholarship);
    if (!result) return; // Retries handled by BullMQ if it threw an error

    // 4. Save to PostgreSQL Database
    const computedNow = new Date().toISOString();
    await pool.query(
      `INSERT INTO match_scores (student_id, scholarship_id, match_score, criteria_results, ai_summary, computed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (student_id, scholarship_id)
       DO UPDATE SET match_score = $3, criteria_results = $4, ai_summary = $5, computed_at = NOW()`,
      [studentId, scholarshipId, result.match_score, JSON.stringify(result.criteria_results), result.ai_summary]
    );

    // 5. Update Redis Cache
    const redisKey = `match:${studentId}:${scholarshipId}`;
    const cachePayload = {
      match_score: result.match_score,
      criteria_results: result.criteria_results,
      ai_summary: result.ai_summary,
      computed_at: computedNow
    };
    await redisClient.setex(redisKey, 86400, JSON.stringify(cachePayload));
  },
  {
    connection: redisClient,
    // 🛡️ CRITICAL RATE LIMITER: Processes max 10 jobs per second (1000ms).
    // This mathematically guarantees you stay within Gemini's API limits!
    limiter: {
      max: 10,
      duration: 1000
    }
  }
);

engineMatchingWorker.on('failed', (job, err) => {
  console.error(`Engine Matching Job ${job?.id} failed with error: ${err.message}`);
});

module.exports = { engineMatchingWorker };
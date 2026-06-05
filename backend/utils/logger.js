// utils/logger.js
const pool = require('../config/db');

const trackEvent = async ({ userId, subAdminId, studentId, actionType, ipAddress, details }) => {
  try {
    const queryText = `
      INSERT INTO audit_trails (user_id, sub_admin_id, student_id, action_type, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    // Pass null values safely for the columns that don't apply to this specific event
    await pool.query(queryText, [
      userId || null, 
      subAdminId || null, 
      studentId || null, 
      actionType, 
      details
    ]);
  } catch (err) {
    console.error("❌ Failed to write to audit_trails:", err.message);
  }
};

module.exports = { trackEvent };
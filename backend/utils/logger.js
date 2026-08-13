// utils/logger.js
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────
// Routing rule:
//   - subAdminId present  → PROVIDER-scoped action → provider_audit_trails
//     (userId is the actor — the org admin/co-admin who did it; subAdminId
//     is the owning org)
//   - subAdminId absent   → SYSTEM-level action → system_admin_audit_trails
//     (userId is the system admin who did it, from `users`; targetOrgId /
//     targetStudentId are optional — set them when the system action is
//     *about* a specific org or student, e.g. a takedown, without turning
//     it into a provider-owned row)
//
// `ipAddress` is accepted but intentionally unused — neither table has a
// column for it yet. Wire it in later if you decide you want it stored.
const trackEvent = async ({
  userId,
  subAdminId,
  studentId,
  actionType,
  ipAddress,
  details,
  targetOrgId = null,
  targetStudentId = null,
}) => {
  try {
    if (subAdminId) {
      const queryText = `
        INSERT INTO provider_audit_trails (sub_admin_id, actor_id, student_id, action_type, details)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(queryText, [
        subAdminId,
        userId || null,
        studentId || null,
        actionType,
        details
      ]);
    } else {
      const queryText = `
        INSERT INTO system_admin_audit_trails (admin_id, target_org_id, target_student_id, action_type, details)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(queryText, [
        userId || null,
        targetOrgId || null,
        targetStudentId || studentId || null,
        actionType,
        details
      ]);
    }
  } catch (err) {
    console.error("❌ Failed to write to audit trail:", err.message);
  }
};

module.exports = { trackEvent };
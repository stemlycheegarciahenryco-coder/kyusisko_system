/**
 * ONE-TIME BACKFILL SCRIPT
 * Generates embeddings for every existing scholarship and student profile
 * that doesn't have one yet. Run this once after applying
 * 001_add_embeddings.sql and starting the local embedding service.
 *
 * Setup:
 *   1. Make sure embedding-service is running:
 *        cd embedding-service && uvicorn app:app --port 8001
 *   2. Run from your backend project root (where config/db.js lives):
 *        node backfill-embeddings.js
 *
 * Safe to re-run: only rows with a NULL embedding are processed, so it
 * won't waste calls re-embedding things that already have a vector.
 */

const db = require('./config/db');
const { getEmbedding, buildScholarshipSummary, buildProfileSummary } = require('./utils/embeddings');

// pgvector expects the literal text format: [0.01,0.02,0.03,...]
function toPgVector(arr) {
  return `[${arr.join(',')}]`;
}

async function backfillScholarships() {
  console.log('\n── Backfilling scholarships ──');
  const { rows } = await db.query(
    `SELECT id, title, description, fund_type, gwa_requirement, criteria
     FROM scholarships
     WHERE embedding IS NULL`
  );

  console.log(`Found ${rows.length} scholarships without an embedding.`);

  for (const scholarship of rows) {
    const summary = buildScholarshipSummary(scholarship);
    const embedding = await getEmbedding(summary);

    if (!embedding) {
      console.warn(`⚠️  Skipped scholarship #${scholarship.id} (embedding service unavailable or empty text)`);
      continue;
    }

    await db.query(
      `UPDATE scholarships SET embedding = $1, embedding_updated_at = NOW() WHERE id = $2`,
      [toPgVector(embedding), scholarship.id]
    );
    console.log(`✅ Scholarship #${scholarship.id} — "${scholarship.title}"`);
  }
}

async function backfillStudentProfiles() {
  console.log('\n── Backfilling student profiles ──');
  const { rows } = await db.query(
    `SELECT 
       sop.*, 
       s.bio, s.portfolio_data, s.year_level, s.sgender,
       c.name AS course_name,
       col.name AS college_name
     FROM student_onboarding_profiles sop
     JOIN students s ON s.id = sop.student_id
     LEFT JOIN courses c ON c.id = sop.course_id
     LEFT JOIN colleges col ON col.id = sop.college_id
     WHERE sop.embedding IS NULL`
  );

  console.log(`Found ${rows.length} student profiles without an embedding.`);

  for (const row of rows) {
    const student = { bio: row.bio, portfolio_data: row.portfolio_data, year_level: row.year_level, gender: row.sgender };
    const profile = row; // has all student_onboarding_profiles fields plus course_name/college_name

    const summary = buildProfileSummary(student, profile, {
      courseName: row.course_name,
      collegeName: row.college_name,
    });
    const embedding = await getEmbedding(summary);

    if (!embedding) {
      console.warn(`⚠️  Skipped profile for student #${row.student_id} (embedding service unavailable or empty text)`);
      continue;
    }

    await db.query(
      `UPDATE student_onboarding_profiles 
       SET profile_summary = $1, embedding = $2, embedding_updated_at = NOW() 
       WHERE student_id = $3`,
      [summary, toPgVector(embedding), row.student_id]
    );
    console.log(`✅ Student #${row.student_id} — "${summary.slice(0, 60)}..."`);
  }
}

(async () => {
  try {
    await backfillScholarships();
    await backfillStudentProfiles();
    console.log('\n🎉 Backfill complete.');
  } catch (err) {
    console.error('\n❌ Backfill failed:', err.message);
  } finally {
    process.exit(0);
  }
})();
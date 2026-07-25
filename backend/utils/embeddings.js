const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────
// EMBEDDING CLIENT
// Uses Google Gemini's free embedding API (gemini-embedding-001). No
// credit card required — free tier is generous (1,500 requests/day),
// which is plenty for a scholarship platform's testing and normal use.
// This is the ONLY "AI" call in the semantic-matching pipeline — no
// training happens anywhere here, it's just a translate-text-to-numbers call.
// ─────────────────────────────────────────────────────────────────────────
const EMBEDDING_MODEL = 'gemini-embedding-001';
const OUTPUT_DIMENSIONS = 768; // good balance of quality vs. storage size

async function getEmbedding(text) {
  if (!text || !text.trim()) return null;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
      {
        content: { parts: [{ text }] },
        outputDimensionality: OUTPUT_DIMENSIONS,
      },
      {
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data.embedding.values; // array of 768 floats
  } catch (err) {
    console.error('Embedding API error:', err.response?.data || err.message);
    return null; // caller should fall back gracefully (skip semantic scoring)
  }
}

/*
// ─── OpenAI version (kept for reference — needs paid balance) ────────────
// const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions
// async function getEmbedding(text) {
//   if (!text || !text.trim()) return null;
//   try {
//     const res = await axios.post(
//       'https://api.openai.com/v1/embeddings',
//       { model: EMBEDDING_MODEL, input: text },
//       { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
//     );
//     return res.data.data[0].embedding;
//   } catch (err) {
//     console.error('Embedding API error:', err.response?.data || err.message);
//     return null;
//   }
// }

// ─── Local free version (fastembed microservice, zero rate limits) ───────
// const LOCAL_EMBEDDING_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8001/embed';
// async function getEmbedding(text) {
//   if (!text || !text.trim()) return null;
//   try {
//     const res = await axios.post(LOCAL_EMBEDDING_URL, { text });
//     return res.data.embedding; // array of 384 floats
//   } catch (err) {
//     console.error('Local embedding service error:', err.response?.data || err.message);
//     return null;
//   }
// }
*/

// ─────────────────────────────────────────────────────────────────────────
// CRITERIA → readable phrase, so the scholarship embedding captures meaning
// instead of raw tokens like "PWD" / "4Ps"
// ─────────────────────────────────────────────────────────────────────────
const CRITERIA_PHRASES = {
  'PWD': 'open to persons with disabilities',
  'Indigenous': 'open to indigenous peoples and cultural minorities',
  'Working Student': 'open to working students',
  'Athlete': 'open to student athletes',
  'Poverty Program': 'open to students under a government poverty assistance program',
  '4Ps': 'open to 4Ps beneficiary families',
  'Religion': 'has a religious affiliation requirement',
  'College Specific': 'restricted to a specific college',
  'Course Specific': 'restricted to a specific course or degree program',
};

/**
 * Builds the text that gets embedded for a scholarship.
 * Call this whenever a scholarship is created or updated.
 *
 * Handles three criteria shapes:
 *   - plain string, e.g. "PWD"                      -> looked up in CRITERIA_PHRASES
 *   - { type: "Religion", value: "Roman Catholic" }  -> "requires Religion: Roman Catholic"
 *   - { type: "custom", label: "..." }               -> the label goes in as-is, since
 *     this is the ONLY place these custom criteria get matched at all — there's no
 *     rule-engine equivalent for them, so the embedding is what makes them count.
 */
function buildScholarshipSummary(scholarship) {
  const criteria = (() => {
    try {
      return Array.isArray(scholarship.criteria)
        ? scholarship.criteria
        : JSON.parse(scholarship.criteria || '[]');
    } catch {
      return [];
    }
  })();

  const criteriaPhrases = criteria.map(c => {
    if (typeof c === 'object' && c !== null) {
      if (c.type === 'custom') return c.label;
      if (c.type && c.value) return `requires ${c.type}: ${c.value}`;
      return '';
    }
    return CRITERIA_PHRASES[c] || c;
  }).filter(Boolean);

  const parts = [
    scholarship.title,
    scholarship.description,
    scholarship.fund_type && `Funding type: ${scholarship.fund_type}.`,
    scholarship.gwa_requirement && `Requires a GWA of ${scholarship.gwa_requirement} or better.`,
    criteriaPhrases.length > 0 && criteriaPhrases.join('. ') + '.',
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Builds the text that gets embedded for a student profile.
 * Call this whenever a student completes onboarding or edits their profile.
 *
 * @param {object} student - row from `students` table
 * @param {object} profile - row from `student_onboarding_profiles` table
 * @param {object} [opts] - optional lookups
 * @param {string} [opts.courseName] - resolved course name from courses table
 * @param {string} [opts.collegeName] - resolved college name from colleges table
 */
function buildProfileSummary(student, profile, opts = {}) {
  const { courseName, collegeName } = opts;

  let portfolioTitles = [];
  try {
    const portfolio = typeof student.portfolio_data === 'string'
      ? JSON.parse(student.portfolio_data)
      : student.portfolio_data;
    if (Array.isArray(portfolio)) {
      portfolioTitles = portfolio
        .map(item => (typeof item === 'object' ? item.title : item))
        .filter(Boolean);
    }
  } catch {
    portfolioTitles = [];
  }

  let sportsInterests = [];
  try {
    sportsInterests = Array.isArray(profile.sports_interests)
      ? profile.sports_interests
      : JSON.parse(profile.sports_interests || '[]');
  } catch {
    sportsInterests = [];
  }

  const degreeName = profile.other_degree_program || courseName;
  const schoolName = profile.other_school || collegeName;

  const parts = [
    degreeName && `${degreeName} student`,
    schoolName && `at ${schoolName}`,
    student.year_level && `${student.year_level.replace(/_/g, ' ')} year level`,
    student.gender && `gender: ${student.gender}`,
    student.bio,
    profile.is_pwd && 'is a person with disability',
    profile.is_indigenous && `is indigenous${profile.indigenous_group ? ` (${profile.indigenous_group})` : ''}`,
    profile.is_working_student && 'is a working student',
    profile.is_athlete && `is a student athlete${sportsInterests.length ? ` interested in ${sportsInterests.join(', ')}` : ''}`,
    profile.is_poverty_program && `is enrolled in a poverty assistance program${profile.program_type ? ` (${profile.program_type})` : ''}`,
    (profile.religion || profile.other_religion) && `practices ${profile.other_religion || profile.religion}`,
    portfolioTitles.length > 0 && `Achievements: ${portfolioTitles.join(', ')}.`,
  ].filter(Boolean);

  return parts.join('. ');
}

// ─────────────────────────────────────────────────────────────────────────
// Cosine similarity — plain math, used as a JS fallback if not using
// pgvector's native `<=>` operator in SQL.
// ─────────────────────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
  getEmbedding,
  buildScholarshipSummary,
  buildProfileSummary,
  cosineSimilarity,
};
const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────
// AI MATCHER
// Reads a scholarship's raw criteria array (whatever the provider typed —
// no fixed types, no dropdowns) and a student's full profile, and asks
// Gemini to judge, criterion by criterion, whether the student qualifies.
//
// This REPLACES the fixed-field rule engine + embedding similarity for
// scoring purposes. There is no per-criterion-type code to maintain —
// the model reads whatever is in the criteria array and whatever is in
// the profile, and reasons about the match itself.
// ─────────────────────────────────────────────────────────────────────────
const CHAT_MODEL = 'gemini-2.5-flash';

/**
 * Builds a clean, readable profile object for the AI to reason over.
 * Deliberately plain field names / values (not raw DB column names)
 * so the model doesn't have to guess what "is_pwd" or "sgender" means.
 */
function buildStudentProfileForAI(student, profile, opts = {}) {
  const { courseName, collegeName } = opts;

  let portfolioTitles = [];
  try {
    const portfolio = typeof student.portfolio_data === 'string'
      ? JSON.parse(student.portfolio_data)
      : student.portfolio_data;
    if (Array.isArray(portfolio)) {
      portfolioTitles = portfolio.map(i => (typeof i === 'object' ? i.title : i)).filter(Boolean);
    }
  } catch { /* ignore malformed portfolio data */ }

  let sportsInterests = [];
  try {
    sportsInterests = Array.isArray(profile.sports_interests)
      ? profile.sports_interests
      : JSON.parse(profile.sports_interests || '[]');
  } catch { /* ignore */ }

  return {
    course: profile.other_degree_program || courseName || null,
    school: profile.other_school || collegeName || null,
    year_level: student.year_level || null,
    gender: student.gender || null,
    religion: profile.other_religion || profile.religion || null,
    bio: student.bio || null,
    is_pwd: !!profile.is_pwd,
    is_indigenous: !!profile.is_indigenous,
    indigenous_group: profile.indigenous_group || null,
    is_working_student: !!profile.is_working_student,
    is_athlete: !!profile.is_athlete,
    sports_interests: sportsInterests,
    is_poverty_program: !!profile.is_poverty_program,
    program_type: profile.program_type || null,
    achievements: portfolioTitles,
  };
}

/**
 * Sends the student profile + raw criteria array to Gemini, gets back a
 * structured judgment for every criterion, and an overall 0-100 score.
 * Returns null on any failure so the caller can fall back gracefully.
 */
async function getAIMatch(studentProfileForAI, scholarship) {
  let criteria = [];
  try {
    criteria = Array.isArray(scholarship.criteria)
      ? scholarship.criteria
      : JSON.parse(scholarship.criteria || '[]');
  } catch {
    criteria = [];
  }

  // No criteria at all = open to everyone, no AI call needed
  if (criteria.length === 0) {
    return {
      match_score: 50,
      criteria_results: [],
      ai_summary: 'Open to all students — no specific eligibility requirements.',
    };
  }

  const prompt = `You are an eligibility-matching assistant for a scholarship platform. Compare a student's profile against a scholarship's eligibility criteria.

Student profile (JSON):
${JSON.stringify(studentProfileForAI, null, 2)}

Scholarship: "${scholarship.title}"
Description: "${scholarship.description || 'N/A'}"
Eligibility criteria (each string is a separate requirement to evaluate):
${JSON.stringify(criteria, null, 2)}

For EACH criterion, decide if the student's profile satisfies it. If the profile has no information relevant to a criterion, treat it as NOT matched (do not assume).

Respond with ONLY valid JSON, no markdown, no explanation outside the JSON, in exactly this shape:
{
  "criteria_results": [
    { "criterion": "<criterion text>", "matches": true or false, "reason": "<one short clause, under 12 words>" }
  ],
  "match_score": <integer 0-100, overall eligibility fit>,
  "summary": "<one sentence, under 20 words, explaining the overall result to the student>"
}`;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      },
      {
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const raw = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      match_score: Math.max(0, Math.min(100, Math.round(parsed.match_score))),
      criteria_results: parsed.criteria_results || [],
      ai_summary: parsed.summary || null,
    };
  } catch (err) {
    console.error('AI Matcher error:', err.response?.data || err.message);
    return null; // caller falls back to cached/stale result or a safe default
  }
}

module.exports = { getAIMatch, buildStudentProfileForAI };
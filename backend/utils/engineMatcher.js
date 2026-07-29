// utils/engineMatcher.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * 3-Tier Matcher: Model 1 ──> Model 2 ──> Local Rule Engine Fallback
 * Guarantees zero crashes or 500 errors returned to the user.
 */
async function getAIMatch(studentProfile, scholarship) {
  const prompt = `
    You are an AI scholarship eligibility matcher.
    Evaluate student eligibility for the scholarship based on their profile.
    
    Student Profile: ${JSON.stringify(studentProfile)}
    Scholarship Details: ${JSON.stringify(scholarship)}

    Respond strictly in JSON format:
    {
      "match_score": number (0-100),
      "criteria_results": [
        { "criterion": string, "matches": boolean, "reason": string }
      ],
      "ai_summary": string
    }
  `;

  // 1️⃣ TIER 1: Primary Model (Fastest / Modern)
  try {
    const primaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await primaryModel.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);
    
    return { ...data, is_fallback: false };
  } catch (error) {
    console.warn(`⚠️ [Tier 1 Failed - 429/Quota]: ${error.message}`);
    console.warn(`🔄 Escalating to Tier 2 (Secondary Model)...`);
  }

  // 2️⃣ TIER 2: Secondary Model (Alternative Quota Pool)
  try {
    const secondaryModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await secondaryModel.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return { ...data, is_fallback: false };
  } catch (error) {
    console.warn(`⚠️ [Tier 2 Failed - 429/Quota]: ${error.message}`);
    console.warn(`⚙️ Escalating to Tier 3 (Deterministic Local Rule Engine)...`);
  }

  // 3️⃣ TIER 3: Local Rule Engine (100% Reliable Offline Fallback)
  return calculateRuleBasedMatch(studentProfile, scholarship);
}

/**
 * Deterministic Fallback Engine (Runs purely on Node.js server)
 */
function calculateRuleBasedMatch(studentProfile, scholarship) {
  let score = 100;
  const criteriaResults = [];

  // GWA Requirement Check
  if (scholarship.gwa_requirement && studentProfile.gwa) {
    const studentGwa = parseFloat(studentProfile.gwa);
    const reqGwa = parseFloat(scholarship.gwa_requirement);
    const meetsGwa = studentGwa <= reqGwa;

    if (!meetsGwa) score -= 35;
    criteriaResults.push({
      criterion: `GWA Requirement (${reqGwa})`,
      matches: meetsGwa,
      reason: meetsGwa 
        ? `GWA (${studentGwa}) satisfies requirement.` 
        : `GWA (${studentGwa}) exceeds allowable threshold (${reqGwa}).`
    });
  }

  // Course Criteria Keyword Match
  if (scholarship.criteria && Array.isArray(scholarship.criteria) && scholarship.criteria.length > 0) {
    let matchedCount = 0;
    scholarship.criteria.forEach(criterion => {
      const isMatch = studentProfile.courseName && 
        studentProfile.courseName.toLowerCase().includes(criterion.toLowerCase());
      
      if (isMatch) matchedCount++;

      criteriaResults.push({
        criterion: `Criteria: ${criterion}`,
        matches: isMatch,
        reason: isMatch ? "Course matches requirement." : "Course does not explicitly match."
      });
    });

    if (matchedCount === 0) score -= 25;
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    match_score: finalScore,
    criteria_results: criteriaResults,
    ai_summary: `[Fallback Engine] Computed via standard rule engine (GWA & course requirements evaluated).`,
    is_fallback: true
  };
}

module.exports = {
  getAIMatch,
  buildStudentProfileForAI: (student, row, meta) => ({
    gwa: row.gwa || student.gwa,
    courseName: meta.courseName,
    collegeName: meta.collegeName,
    yearLevel: student.year_level,
    gender: student.gender,
    bio: student.bio
  })
};
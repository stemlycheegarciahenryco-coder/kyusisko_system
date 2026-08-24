// test-matcher.js
const { calculateRuleMatch, buildStudentProfile } = require('./backend/utils/ruleMatcher');

async function testEngine() {
  const mockStudentRow = { gwa: '1.98', sdistrict: '3', is_working_student: false };
  const mockStudent = { year_level: 'Freshmen', gender: 'Female' };
  
  // Student taking BSCS
  const profile = buildStudentProfile(mockStudent, mockStudentRow, {
    courseName: 'BS Information Technology',
    collegeName: 'STI COLLEGE NOVALICHES'
    
  });

  // Test Case 1: Matching Scholarship (GWA 2.0, Target BS Computer Science)
  const matchingScholarship = {
    id: '1',
    gwa_requirement: '2.0',
    criteria: ['Bachelor of Science in Information Technology, Freshman']
  };

  // Test Case 2: Unrelated Program (Target BS Architecture)
  const unrelatedScholarship = {
    id: '2',
    gwa_requirement: '2.0',
    criteria: ['BS Architecture']
  };

  console.log('--- TEST 1: Should Pass (Fuzzy match + GWA passed) ---');
  console.log(await calculateRuleMatch(profile, matchingScholarship));

  console.log('\n--- TEST 2: Should Fail (Unrelated course) ---');
  console.log(await calculateRuleMatch(profile, unrelatedScholarship));
}

testEngine();
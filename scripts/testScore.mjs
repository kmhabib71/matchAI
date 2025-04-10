// This is an ES module script to test the matching algorithm
// Run with: node --experimental-modules testScore.mjs

// Mock data for testing
const baseUser = {
  _id: "user1",
  name: "Test User 1",
  gender: "male",
  personalityQuiz: {
    completed: true,
    answers: {
      // Profile info
      profile_2: "male", // Gender
      profile_3: "1990", // Birth year
      profile_4: "Dhaka", // City
      profile_5: "Engineer", // Profession
      profile_7: "bachelor's", // Education
      profile_8: "islam", // Religion
      profile_9: "single", // Marital status
      profile_12: "reading, music, travel", // Hobbies

      // Personality traits (1-5 scale)
      personality_1: "3: Neutral", // Openness
      personality_2: "3: Neutral", // Conscientiousness
      personality_3: "3: Neutral", // Extraversion
      personality_4: "3: Neutral", // Agreeableness
      personality_5: "3: Neutral", // Neuroticism
      personality_6: "3: Neutral", // Anxious attachment
      personality_7: "3: Neutral", // Secure attachment
      personality_9: "3: Neutral", // Family values
      personality_10: "3: Neutral", // Career values
      personality_11: "3: Neutral", // Adventure values
      personality_12: "3: Neutral", // Stability values

      // Preferences
      preferences_1: "25-35", // Age preference
      preferences_2: "Engineer, Doctor", // Profession preference
      preferences_4: "bachelor's", // Education preference
      preferences_5: "Same city", // City preference
    },
  },
};

const candidateUser = {
  _id: "user2",
  name: "Test User 2",
  gender: "female",
  personalityQuiz: {
    completed: true,
    answers: {
      // Profile info
      profile_2: "female", // Gender
      profile_3: "1992", // Birth year
      profile_4: "Dhaka", // City
      profile_5: "Doctor", // Profession
      profile_7: "master's", // Education
      profile_8: "islam", // Religion
      profile_9: "single", // Marital status
      profile_12: "reading, cooking", // Hobbies

      // Personality traits
      personality_1: "4: Agree", // Openness
      personality_2: "3: Neutral", // Conscientiousness
      personality_3: "3: Neutral", // Extraversion
      personality_4: "4: Agree", // Agreeableness
      personality_5: "2: Disagree", // Neuroticism
      personality_6: "3: Neutral", // Anxious attachment
      personality_7: "4: Agree", // Secure attachment
      personality_9: "4: Agree", // Family values
      personality_10: "3: Neutral", // Career values
      personality_11: "3: Neutral", // Adventure values
      personality_12: "4: Agree", // Stability values
    },
  },
};

// Another candidate with different values
const candidateUser2 = {
  _id: "user3",
  name: "Test User 3",
  gender: "female",
  personalityQuiz: {
    completed: true,
    answers: {
      // Profile info
      profile_2: "female", // Gender
      profile_3: "1995", // Birth year
      profile_4: "Chittagong", // Different city
      profile_5: "Teacher", // Different profession
      profile_7: "bachelor's", // Education
      profile_8: "islam", // Religion
      profile_9: "single", // Marital status
      profile_12: "sports, cooking, music", // Different hobbies

      // Personality traits - more different from base user
      personality_1: "5: Strongly Agree", // Openness
      personality_2: "4: Agree", // Conscientiousness
      personality_3: "2: Disagree", // Extraversion
      personality_4: "5: Strongly Agree", // Agreeableness
      personality_5: "1: Strongly Disagree", // Neuroticism
      personality_6: "2: Disagree", // Anxious attachment
      personality_7: "5: Strongly Agree", // Secure attachment
      personality_9: "5: Strongly Agree", // Family values
      personality_10: "2: Disagree", // Career values
      personality_11: "4: Agree", // Adventure values
      personality_12: "5: Strongly Agree", // Stability values
    },
  },
};

// Manual implementation of the matching algorithm - simplified version

// Calculate personality score
function calculatePersonalityScore(user1, user2) {
  const user1Traits = {
    openness: parseInt(
      user1.personalityQuiz?.answers?.personality_1?.split(":")[0] || 3
    ),
    conscientiousness: parseInt(
      user1.personalityQuiz?.answers?.personality_2?.split(":")[0] || 3
    ),
    extraversion: parseInt(
      user1.personalityQuiz?.answers?.personality_3?.split(":")[0] || 3
    ),
    agreeableness: parseInt(
      user1.personalityQuiz?.answers?.personality_4?.split(":")[0] || 3
    ),
    neuroticism: parseInt(
      user1.personalityQuiz?.answers?.personality_5?.split(":")[0] || 3
    ),
  };

  const user2Traits = {
    openness: parseInt(
      user2.personalityQuiz?.answers?.personality_1?.split(":")[0] || 3
    ),
    conscientiousness: parseInt(
      user2.personalityQuiz?.answers?.personality_2?.split(":")[0] || 3
    ),
    extraversion: parseInt(
      user2.personalityQuiz?.answers?.personality_3?.split(":")[0] || 3
    ),
    agreeableness: parseInt(
      user2.personalityQuiz?.answers?.personality_4?.split(":")[0] || 3
    ),
    neuroticism: parseInt(
      user2.personalityQuiz?.answers?.personality_5?.split(":")[0] || 3
    ),
  };

  // Calculate differences
  const opennessDiff =
    Math.abs(user1Traits.openness - user2Traits.openness) / 4;
  const conscientiousnessDiff =
    Math.abs(user1Traits.conscientiousness - user2Traits.conscientiousness) / 4;

  // Special extraversion handling
  const extraversionDiff = Math.abs(
    user1Traits.extraversion - user2Traits.extraversion
  );
  const extraversionScore =
    extraversionDiff <= 2
      ? 1 - extraversionDiff / 4
      : 1 - (extraversionDiff - 1) / 3;

  const agreeablenessDiff =
    Math.abs(user1Traits.agreeableness - user2Traits.agreeableness) / 4;
  const neuroticismDiff =
    Math.abs(user1Traits.neuroticism - user2Traits.neuroticism) / 4;

  // Convert to similarity scores (0-1 where 1 = perfect match)
  const opennessScore = 1 - opennessDiff;
  const conscientiousnessScore = 1 - conscientiousnessDiff;
  const agreeablenessScore = 1 - agreeablenessDiff;
  const neuroticismScore = 1 - neuroticismDiff;

  // Weighted average based on algorithm
  const weightedScore =
    opennessScore * 0.15 +
    conscientiousnessScore * 0.2 +
    extraversionScore * 0.15 +
    agreeablenessScore * 0.25 +
    neuroticismScore * 0.25;

  return weightedScore * 100;
}

// Calculate attachment score
function calculateAttachmentScore(user1, user2) {
  const user1Secure = parseInt(
    user1.personalityQuiz?.answers?.personality_7?.split(":")[0] || 3
  );
  const user1Anxious = parseInt(
    user1.personalityQuiz?.answers?.personality_6?.split(":")[0] || 3
  );

  const user2Secure = parseInt(
    user2.personalityQuiz?.answers?.personality_7?.split(":")[0] || 3
  );
  const user2Anxious = parseInt(
    user2.personalityQuiz?.answers?.personality_6?.split(":")[0] || 3
  );

  const secureDiff = Math.abs(user1Secure - user2Secure) / 4;
  const anxiousDiff = Math.abs(user1Anxious - user2Anxious) / 4;

  const secureScore = 1 - secureDiff;
  const anxiousScore = 1 - anxiousDiff;

  return ((secureScore + anxiousScore) / 2) * 100;
}

// Calculate hobbies score
function calculateHobbiesScore(user1, user2) {
  const user1Hobbies = (user1.personalityQuiz?.answers?.profile_12 || "")
    .split(",")
    .map((h) => h.trim().toLowerCase());

  const user2Hobbies = (user2.personalityQuiz?.answers?.profile_12 || "")
    .split(",")
    .map((h) => h.trim().toLowerCase());

  if (user1Hobbies.length === 0 || user2Hobbies.length === 0) {
    return 0;
  }

  // Calculate Jaccard similarity
  const intersection = user1Hobbies.filter((h) => user2Hobbies.includes(h));
  const union = [...new Set([...user1Hobbies, ...user2Hobbies])];

  console.log(`Hobbies intersection: ${intersection}`);
  console.log(`Hobbies union: ${union}`);

  return (intersection.length / union.length) * 100;
}

// Calculate compatibility score - simplified version
function calculateCompatibilityScore(user1, user2) {
  // Calculate individual scores
  const personalityScore = calculatePersonalityScore(user1, user2);
  const attachmentScore = calculateAttachmentScore(user1, user2);

  // Calculate hobbies score
  const hobbiesScore = calculateHobbiesScore(user1, user2);

  // Hardcode other scores for simplicity
  const demographicsScore = 100; // Assume perfect match
  const preferencesScore = 80;

  // City scoring - same as in the algorithm
  const user1City = user1.personalityQuiz?.answers?.profile_4;
  const user2City = user2.personalityQuiz?.answers?.profile_4;
  const cityScore =
    user1City === user2City ? 100 : personalityScore >= 90 ? 100 : 70;

  // Education scoring - simplified
  const educationScore =
    user2.personalityQuiz?.answers?.profile_7 === "master's" ? 100 : 50;

  // Calculate weighted score
  const weightedScore =
    personalityScore * 0.4 +
    attachmentScore * 0.2 +
    hobbiesScore * 0.1 +
    preferencesScore * 0.075 +
    cityScore * 0.075 +
    educationScore * 0.1 +
    0.05 * 100; // Adding 5% unaccounted for above

  return {
    score: weightedScore,
    details: {
      personalityScore,
      attachmentScore,
      hobbiesScore,
      demographicsScore,
      preferencesScore,
      cityScore,
      educationScore,
    },
  };
}

// Test the algorithm with our mock data
console.log("===== TESTING MATCH SCORING =====");
console.log("\nBASE USER:", baseUser.name);
console.log("Hobbies:", baseUser.personalityQuiz.answers.profile_12);

console.log("\nCANDIDATE 1:", candidateUser.name);
console.log("Hobbies:", candidateUser.personalityQuiz.answers.profile_12);
const score1 = calculateCompatibilityScore(baseUser, candidateUser);
console.log("\nMATCH SCORE:", score1.score.toFixed(2) + "%");
console.log("SCORE DETAILS:", score1.details);

console.log("\nCANDIDATE 2:", candidateUser2.name);
console.log("Hobbies:", candidateUser2.personalityQuiz.answers.profile_12);
const score2 = calculateCompatibilityScore(baseUser, candidateUser2);
console.log("\nMATCH SCORE:", score2.score.toFixed(2) + "%");
console.log("SCORE DETAILS:", score2.details);

console.log("\nComparing scores - Candidate 1 vs Candidate 2:");
console.log(
  `Personality: ${score1.details.personalityScore.toFixed(
    2
  )}% vs ${score2.details.personalityScore.toFixed(2)}%`
);
console.log(
  `Attachment: ${score1.details.attachmentScore.toFixed(
    2
  )}% vs ${score2.details.attachmentScore.toFixed(2)}%`
);
console.log(
  `Hobbies: ${score1.details.hobbiesScore.toFixed(
    2
  )}% vs ${score2.details.hobbiesScore.toFixed(2)}%`
);
console.log(
  `City: ${score1.details.cityScore.toFixed(
    2
  )}% vs ${score2.details.cityScore.toFixed(2)}%`
);

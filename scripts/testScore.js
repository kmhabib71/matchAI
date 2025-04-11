// This is a CommonJS script to test the matching algorithm
// Run with: node testScore.js

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

  console.log("User 1 personality traits:", user1Traits);
  console.log("User 2 personality traits:", user2Traits);

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

  console.log("Personality score components:");
  console.log(
    `- Openness: ${opennessScore.toFixed(2)} (diff: ${opennessDiff.toFixed(2)})`
  );
  console.log(
    `- Conscientiousness: ${conscientiousnessScore.toFixed(
      2
    )} (diff: ${conscientiousnessDiff.toFixed(2)})`
  );
  console.log(
    `- Extraversion: ${extraversionScore.toFixed(
      2
    )} (diff: ${extraversionDiff})`
  );
  console.log(
    `- Agreeableness: ${agreeablenessScore.toFixed(
      2
    )} (diff: ${agreeablenessDiff.toFixed(2)})`
  );
  console.log(
    `- Neuroticism: ${neuroticismScore.toFixed(
      2
    )} (diff: ${neuroticismDiff.toFixed(2)})`
  );

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

  console.log("Attachment traits:");
  console.log(`User 1 - Secure: ${user1Secure}, Anxious: ${user1Anxious}`);
  console.log(`User 2 - Secure: ${user2Secure}, Anxious: ${user2Anxious}`);

  const secureDiff = Math.abs(user1Secure - user2Secure) / 4;
  const anxiousDiff = Math.abs(user1Anxious - user2Anxious) / 4;

  const secureScore = 1 - secureDiff;
  const anxiousScore = 1 - anxiousDiff;

  console.log(
    `Secure score: ${secureScore.toFixed(2)} (diff: ${secureDiff.toFixed(2)})`
  );
  console.log(
    `Anxious score: ${anxiousScore.toFixed(2)} (diff: ${anxiousDiff.toFixed(
      2
    )})`
  );

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

  console.log("Hobbies comparison:");
  console.log(`User 1 hobbies: ${user1Hobbies.join(", ")}`);
  console.log(`User 2 hobbies: ${user2Hobbies.join(", ")}`);

  if (user1Hobbies.length === 0 || user2Hobbies.length === 0) {
    console.log("No hobbies to compare!");
    return 0;
  }

  // Calculate Jaccard similarity
  const intersection = user1Hobbies.filter((h) => user2Hobbies.includes(h));
  const union = [...new Set([...user1Hobbies, ...user2Hobbies])];

  console.log(`Hobbies intersection: ${intersection.join(", ")}`);
  console.log(`Hobbies union: ${union.join(", ")}`);
  console.log(
    `Jaccard similarity: ${intersection.length}/${union.length} = ${(
      (intersection.length / union.length) *
      100
    ).toFixed(2)}%`
  );

  return (intersection.length / union.length) * 100;
}

// Calculate compatibility score - simplified version
function calculateCompatibilityScore(user1, user2) {
  console.log("\n===== CALCULATING COMPATIBILITY SCORE =====");

  // Calculate individual scores
  console.log("\n----- PERSONALITY SCORING -----");
  const personalityScore = calculatePersonalityScore(user1, user2);
  console.log(`Personality score: ${personalityScore.toFixed(2)}%`);

  console.log("\n----- ATTACHMENT SCORING -----");
  const attachmentScore = calculateAttachmentScore(user1, user2);
  console.log(`Attachment score: ${attachmentScore.toFixed(2)}%`);

  console.log("\n----- HOBBIES SCORING -----");
  const hobbiesScore = calculateHobbiesScore(user1, user2);
  console.log(`Hobbies score: ${hobbiesScore.toFixed(2)}%`);

  // City scoring
  const user1City = user1.personalityQuiz?.answers?.profile_4;
  const user2City = user2.personalityQuiz?.answers?.profile_4;
  const sameCity = user1City === user2City;
  const cityScore = sameCity ? 100 : personalityScore >= 90 ? 100 : 70;
  console.log(
    `\nCity comparison: ${user1City} vs ${user2City} - ${
      sameCity ? "MATCH" : "DIFFERENT"
    }`
  );
  console.log(
    `City score: ${cityScore}% (with personality override: ${
      personalityScore >= 90
    })`
  );

  // Education scoring
  const user1Education = user1.personalityQuiz?.answers?.profile_7;
  const user1EducationPref = user1.personalityQuiz?.answers?.preferences_4;
  const user2Education = user2.personalityQuiz?.answers?.profile_7;
  const educationMatch =
    user2Education === user1EducationPref ||
    (user1EducationPref === "bachelor's" && user2Education === "master's") ||
    (user1EducationPref === "hsc" &&
      ["bachelor's", "master's"].includes(user2Education));
  const educationScore = educationMatch ? 100 : 50;

  console.log(
    `\nEducation comparison: ${user1Education} (pref: ${user1EducationPref}) vs ${user2Education} - ${
      educationMatch ? "MEETS PREFERENCE" : "BELOW PREFERENCE"
    }`
  );
  console.log(`Education score: ${educationScore}%`);

  // Preferences score - simplified
  const preferencesScore = 80; // Just a placeholder for this test

  // Demographics score - simplified
  const demographicsScore = 100; // Just a placeholder for this test

  // Calculate weighted score
  const weightedScore =
    personalityScore * 0.4 + // 40%
    attachmentScore * 0.2 + // 20%
    hobbiesScore * 0.1 + // 10%
    preferencesScore * 0.075 + // 7.5%
    cityScore * 0.075 + // 7.5%
    educationScore * 0.1 + // 10%
    demographicsScore * 0.05; // 5%

  console.log("\n===== WEIGHTED SCORE CALCULATION =====");
  console.log(
    `Personality: ${personalityScore.toFixed(2)}% × 0.4 = ${(
      personalityScore * 0.4
    ).toFixed(2)}%`
  );
  console.log(
    `Attachment: ${attachmentScore.toFixed(2)}% × 0.2 = ${(
      attachmentScore * 0.2
    ).toFixed(2)}%`
  );
  console.log(
    `Hobbies: ${hobbiesScore.toFixed(2)}% × 0.1 = ${(
      hobbiesScore * 0.1
    ).toFixed(2)}%`
  );
  console.log(
    `Preferences: ${preferencesScore}% × 0.075 = ${(
      preferencesScore * 0.075
    ).toFixed(2)}%`
  );
  console.log(
    `City: ${cityScore}% × 0.075 = ${(cityScore * 0.075).toFixed(2)}%`
  );
  console.log(
    `Education: ${educationScore}% × 0.1 = ${(educationScore * 0.1).toFixed(
      2
    )}%`
  );
  console.log(
    `Demographics: ${demographicsScore}% × 0.05 = ${(
      demographicsScore * 0.05
    ).toFixed(2)}%`
  );

  // Check for demographics penalty
  let finalScore = weightedScore;
  if (demographicsScore < 60) {
    console.log(
      `\nDEMOGRAPHICS PENALTY APPLIED: Score < 60% (${demographicsScore}%)`
    );
    finalScore *= 0.2;
    console.log(
      `Score reduced: ${weightedScore.toFixed(2)}% → ${finalScore.toFixed(2)}%`
    );
  }

  // Check for full match bonus
  const allFieldsMatch =
    demographicsScore === 100 &&
    preferencesScore === 100 &&
    hobbiesScore > 0 &&
    personalityScore >= 90 &&
    attachmentScore >= 90;

  if (allFieldsMatch) {
    console.log(`\nFULL MATCH BONUS APPLIED: +10 points`);
    finalScore += 10;
  }

  console.log(`\nFINAL MATCH SCORE: ${finalScore.toFixed(2)}%`);

  return {
    score: finalScore,
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
console.log("CANDIDATE 1:", candidateUser.name);
const score1 = calculateCompatibilityScore(baseUser, candidateUser);

console.log("\n" + "=".repeat(50) + "\n");

console.log("BASE USER:", baseUser.name);
console.log("CANDIDATE 2:", candidateUser2.name);
const score2 = calculateCompatibilityScore(baseUser, candidateUser2);

console.log("\n" + "=".repeat(50) + "\n");

console.log("COMPARING THE TWO CANDIDATES:");
console.log(`Candidate 1 (${candidateUser.name}): ${score1.score.toFixed(2)}%`);
console.log(
  `Candidate 2 (${candidateUser2.name}): ${score2.score.toFixed(2)}%`
);
console.log(`Difference: ${Math.abs(score1.score - score2.score).toFixed(2)}%`);

// Compare specific score components
console.log("\nSCORE COMPONENT COMPARISON:");
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
  `City: ${score1.details.cityScore}% vs ${score2.details.cityScore}%`
);

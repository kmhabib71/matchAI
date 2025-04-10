const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
dotenv.config();

// Try different import paths for the matching algorithm
let matchingAlgorithm;
const possiblePaths = [
  "../dist/lib/ai/matchingAlgorithm",
  "../src/lib/ai/matchingAlgorithm",
  "../lib/ai/matchingAlgorithm",
  path.resolve(__dirname, "../src/lib/ai/matchingAlgorithm"),
  path.resolve(__dirname, "../dist/lib/ai/matchingAlgorithm"),
];

// Try each path until one works
let successfulPath = null;
for (const modulePath of possiblePaths) {
  try {
    matchingAlgorithm = require(modulePath);
    successfulPath = modulePath;
    console.log(`Successfully imported matchingAlgorithm from: ${modulePath}`);
    break;
  } catch (error) {
    console.log(`Failed to import from ${modulePath}: ${error.code}`);
  }
}

// Exit if no path worked
if (!matchingAlgorithm) {
  console.error(
    "ERROR: Could not find matchingAlgorithm module. Tried paths:",
    possiblePaths
  );
  console.error("Check your build configuration and try again.");
  console.error(
    "You may need to build your project first with 'npm run build'."
  );
  process.exit(1);
}

// Destructure the functions from the module
const {
  calculateCompatibilityScore,
  calculatePersonalityScore,
  calculateAttachmentScore,
  calculateValuesScore,
  calculateHobbiesScore,
  calculateDemographicScore,
  calculatePreferencesScore,
} = matchingAlgorithm;

// Function to find a user by email
async function findUserByEmail(db, email) {
  return await db.collection("users").findOne({ email });
}

// Function to manually score and log detailed results
function manualScoreCalculation(baseUser, candidateUser) {
  console.log("\n========== MANUAL SCORE CALCULATION ==========");

  // Calculate individual scores
  const personalityScore = calculatePersonalityScore(baseUser, candidateUser);
  const attachmentScore = calculateAttachmentScore(baseUser, candidateUser);
  const valuesScore = calculateValuesScore(baseUser, candidateUser);
  const hobbiesScore = calculateHobbiesScore(baseUser, candidateUser);
  const demographicsScore = calculateDemographicScore(baseUser, candidateUser);
  const preferencesScore = calculatePreferencesScore(baseUser, candidateUser);

  // Log base user details
  console.log(`Base User: ${baseUser.name} (${baseUser.email})`);
  console.log(
    `Gender: ${baseUser.gender} | Quiz Gender: ${baseUser.personalityQuiz?.answers?.profile_2}`
  );
  console.log(`Religion: ${baseUser.personalityQuiz?.answers?.profile_8}`);
  console.log(
    `Marital Status: ${baseUser.personalityQuiz?.answers?.profile_9}`
  );

  // Log candidate details
  console.log(`\nCandidate: ${candidateUser.name} (${candidateUser.email})`);
  console.log(
    `Gender: ${candidateUser.gender} | Quiz Gender: ${candidateUser.personalityQuiz?.answers?.profile_2}`
  );
  console.log(`Religion: ${candidateUser.personalityQuiz?.answers?.profile_8}`);
  console.log(
    `Marital Status: ${candidateUser.personalityQuiz?.answers?.profile_9}`
  );

  // Log hobbies details for both users
  const baseUserHobbies = (baseUser.personalityQuiz?.answers?.profile_12 || "")
    .split(",")
    .map((h) => h.trim().toLowerCase());
  const candidateHobbies = (
    candidateUser.personalityQuiz?.answers?.profile_12 || ""
  )
    .split(",")
    .map((h) => h.trim().toLowerCase());

  console.log(`\nBase User Hobbies: ${baseUserHobbies.join(", ")}`);
  console.log(`Candidate Hobbies: ${candidateHobbies.join(", ")}`);

  // Calculate hobby intersection and union
  const intersection = baseUserHobbies.filter((hobby) =>
    candidateHobbies.includes(hobby)
  );
  const union = [...new Set([...baseUserHobbies, ...candidateHobbies])];

  console.log(`Hobbies Intersection: ${intersection.join(", ")}`);
  console.log(`Hobbies Union: ${union.join(", ")}`);
  console.log(
    `Hobbies Jaccard Similarity: ${intersection.length}/${union.length} = ${
      (intersection.length / Math.max(1, union.length)) * 100
    }%`
  );

  // Log more detailed education info
  console.log(
    `\nBase User Education: ${baseUser.personalityQuiz?.answers?.profile_7}`
  );
  console.log(
    `Candidate Education: ${candidateUser.personalityQuiz?.answers?.profile_7}`
  );
  console.log(
    `Base User Education Preference: ${baseUser.personalityQuiz?.answers?.preferences_4}`
  );

  // Detail city info
  console.log(
    `\nBase User City: ${baseUser.personalityQuiz?.answers?.profile_4}`
  );
  console.log(
    `Candidate City: ${candidateUser.personalityQuiz?.answers?.profile_4}`
  );
  console.log(
    `Base User City Preference: ${baseUser.personalityQuiz?.answers?.preferences_5}`
  );

  // Log profession details
  console.log(
    `\nBase User Profession: ${baseUser.personalityQuiz?.answers?.profile_5}`
  );
  console.log(
    `Candidate Profession: ${candidateUser.personalityQuiz?.answers?.profile_5}`
  );
  console.log(
    `Base User Profession Preferences: ${
      baseUser.personalityQuiz?.answers?.preferences_2 || "None"
    }`
  );

  // PERSONALITY DETAILS
  console.log("\n----- PERSONALITY DETAILS -----");
  console.log(
    `Base User Openness (personality_1): ${baseUser.personalityQuiz?.answers?.personality_1}`
  );
  console.log(
    `Candidate Openness (personality_1): ${candidateUser.personalityQuiz?.answers?.personality_1}`
  );

  console.log(
    `Base User Conscientiousness (personality_2): ${baseUser.personalityQuiz?.answers?.personality_2}`
  );
  console.log(
    `Candidate Conscientiousness (personality_2): ${candidateUser.personalityQuiz?.answers?.personality_2}`
  );

  console.log(
    `Base User Extraversion (personality_3): ${baseUser.personalityQuiz?.answers?.personality_3}`
  );
  console.log(
    `Candidate Extraversion (personality_3): ${candidateUser.personalityQuiz?.answers?.personality_3}`
  );

  console.log(
    `Base User Agreeableness (personality_4): ${baseUser.personalityQuiz?.answers?.personality_4}`
  );
  console.log(
    `Candidate Agreeableness (personality_4): ${candidateUser.personalityQuiz?.answers?.personality_4}`
  );

  console.log(
    `Base User Neuroticism (personality_5): ${baseUser.personalityQuiz?.answers?.personality_5}`
  );
  console.log(
    `Candidate Neuroticism (personality_5): ${candidateUser.personalityQuiz?.answers?.personality_5}`
  );

  // ATTACHMENT DETAILS
  console.log("\n----- ATTACHMENT DETAILS -----");
  console.log(
    `Base User Anxious Attachment (personality_6): ${baseUser.personalityQuiz?.answers?.personality_6}`
  );
  console.log(
    `Candidate Anxious Attachment (personality_6): ${candidateUser.personalityQuiz?.answers?.personality_6}`
  );

  console.log(
    `Base User Secure Attachment (personality_7): ${baseUser.personalityQuiz?.answers?.personality_7}`
  );
  console.log(
    `Candidate Secure Attachment (personality_7): ${candidateUser.personalityQuiz?.answers?.personality_7}`
  );

  // VALUES DETAILS
  console.log("\n----- VALUES DETAILS -----");
  console.log(
    `Base User Family Value (personality_9): ${baseUser.personalityQuiz?.answers?.personality_9}`
  );
  console.log(
    `Candidate Family Value (personality_9): ${candidateUser.personalityQuiz?.answers?.personality_9}`
  );

  console.log(
    `Base User Career Value (personality_10): ${baseUser.personalityQuiz?.answers?.personality_10}`
  );
  console.log(
    `Candidate Career Value (personality_10): ${candidateUser.personalityQuiz?.answers?.personality_10}`
  );

  console.log(
    `Base User Adventure Value (personality_11): ${baseUser.personalityQuiz?.answers?.personality_11}`
  );
  console.log(
    `Candidate Adventure Value (personality_11): ${candidateUser.personalityQuiz?.answers?.personality_11}`
  );

  console.log(
    `Base User Stability Value (personality_12): ${baseUser.personalityQuiz?.answers?.personality_12}`
  );
  console.log(
    `Candidate Stability Value (personality_12): ${candidateUser.personalityQuiz?.answers?.personality_12}`
  );

  // Log the scores
  console.log("\n----- COMPATIBILITY SCORES -----");
  console.log(
    `Personality Score: ${personalityScore.toFixed(2)}% (Weight: 40%)`
  );
  console.log(`Attachment Score: ${attachmentScore.toFixed(2)}% (Weight: 20%)`);
  console.log(`Values Score: ${valuesScore.toFixed(2)}% (Weight: 15%)`);
  console.log(`Hobbies Score: ${hobbiesScore.toFixed(2)}% (Weight: 10%)`);
  console.log(
    `Demographics Score: ${demographicsScore.toFixed(
      2
    )}% (Weight in TypeScript algo: special reduction)`
  );
  console.log(
    `Preferences Score: ${preferencesScore.toFixed(2)}% (Weight: 7.5%)`
  );

  // Calculate weighted score manually
  let manualWeightedScore =
    personalityScore * 0.4 +
    attachmentScore * 0.2 +
    valuesScore * 0.15 +
    hobbiesScore * 0.1 +
    preferencesScore * 0.075;

  // Get city score (as in calculateCompatibilityScore)
  const userCity = baseUser.personalityQuiz?.answers?.profile_4;
  const candidateCity = candidateUser.personalityQuiz?.answers?.profile_4;
  const cityScore =
    userCity === candidateCity ? 100 : personalityScore >= 90 ? 100 : 70;

  console.log(`City Score: ${cityScore.toFixed(2)}% (Weight: 7.5%)`);
  manualWeightedScore += cityScore * 0.075;

  // Apply demographics reduction if needed
  if (demographicsScore < 60) {
    console.log(
      `\nDEMOGRAPHICS PENALTY APPLIED: Score < 60% (${demographicsScore.toFixed(
        2
      )}%)`
    );
    console.log(`Reducing total score by factor of 0.2`);
    manualWeightedScore *= 0.2;
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
    manualWeightedScore += 10;
  }

  console.log(
    `\nManually Calculated Final Score: ${manualWeightedScore.toFixed(2)}%`
  );

  // Calculate using the library function
  const compatibilityScore = calculateCompatibilityScore(
    baseUser,
    candidateUser
  );
  console.log(
    `Library Function Score: ${compatibilityScore.score.toFixed(2)}%`
  );

  console.log("\nScore Details from Library Function:");
  console.log(JSON.stringify(compatibilityScore.matchDetails, null, 2));

  // Check for discrepancy
  const discrepancy = Math.abs(manualWeightedScore - compatibilityScore.score);
  if (discrepancy > 0.1) {
    console.log(
      `\n⚠️ WARNING: Score discrepancy detected (${discrepancy.toFixed(
        2
      )} difference)`
    );
    console.log(
      "This suggests there may be a calculation error in the algorithm."
    );
  } else {
    console.log("\n✓ Scores match within acceptable tolerance");
  }
}

// Main function
async function main() {
  // Connect to MongoDB
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/matchmaking";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Find the base user by email
    const baseEmail = "km.habibs@gmail.com";
    const baseUser = await findUserByEmail(db, baseEmail);

    if (!baseUser) {
      console.error(`Base user with email ${baseEmail} not found.`);
      process.exit(1);
    }

    console.log(`Found base user: ${baseUser.name}`);

    // Find 5 random users to compare with
    const otherUsers = await db
      .collection("users")
      .find({
        email: { $ne: baseEmail },
        "personalityQuiz.completed": true,
        gender: baseUser.gender === "male" ? "female" : "male", // Get opposite gender
      })
      .limit(5)
      .toArray();

    console.log(
      `Found ${otherUsers.length} users to compare with the base user.`
    );

    // Calculate and log compatibility scores for each user
    for (const user of otherUsers) {
      manualScoreCalculation(baseUser, user);
      console.log("\n" + "=".repeat(50) + "\n");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Run the script
main().catch(console.error);

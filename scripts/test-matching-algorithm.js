// Script to test the matching algorithm with updated user profiles
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "matchmaking";

// Basic validation for MongoDB URI
if (!MONGODB_URI) {
  console.error(
    "ERROR: MONGODB_URI is not defined in the environment variables"
  );
  process.exit(1);
}

console.log(`Using database: ${MONGODB_DB}`);
console.log(`MongoDB URI defined: ${MONGODB_URI ? "Yes" : "No"}`);

// Since we can't directly import TypeScript files in Node.js, we'll create simplified versions
// of the matching algorithm functions here
function calculateCompatibilityScore(user1, user2) {
  // Simple compatibility calculation logic for testing
  let score = 70; // Base score

  // Add points for matching personality traits
  if (user1.personalityType === user2.personalityType) {
    score += 20;
  } else if (user1.personalityType && user2.personalityType) {
    // Add points for complementary personality types
    const firstLetter1 = user1.personalityType.charAt(0);
    const firstLetter2 = user2.personalityType.charAt(0);

    // E/I compatibility
    if (
      (firstLetter1 === "E" && firstLetter2 === "I") ||
      (firstLetter1 === "I" && firstLetter2 === "E")
    ) {
      score += 10;
    }

    // Other type compatibilities...
    if (user1.personalityType.charAt(1) === user2.personalityType.charAt(1)) {
      score += 5;
    }
    if (user1.personalityType.charAt(2) === user2.personalityType.charAt(2)) {
      score += 5;
    }
    if (user1.personalityType.charAt(3) === user2.personalityType.charAt(3)) {
      score += 5;
    }
  }

  // Cap the score at 100
  return Math.min(100, score);
}

function getTopMatches(user, potentialMatches, count = 5) {
  const matches = [];

  for (const potentialMatch of potentialMatches) {
    const score = calculateCompatibilityScore(user, potentialMatch);
    const compatibilityReasons = [];
    const sharedValues = [];
    const topTraits = [];

    // Generate compatibility reasons
    if (user.personalityType && potentialMatch.personalityType) {
      if (user.personalityType === potentialMatch.personalityType) {
        compatibilityReasons.push(
          `You both have the same personality type (${user.personalityType})`
        );
      } else {
        compatibilityReasons.push(
          `Your personality types (${user.personalityType} and ${potentialMatch.personalityType}) complement each other`
        );
      }
    }

    // Add some example shared values
    if (user.personalityQuiz && potentialMatch.personalityQuiz) {
      const userInterests = user.personalityQuiz.answers.profile_12 || "";
      const matchInterests =
        potentialMatch.personalityQuiz.answers.profile_12 || "";

      // Extract interests as arrays
      const userInterestsArray = userInterests.split(", ");
      const matchInterestsArray = matchInterests.split(", ");

      // Find common interests
      for (const interest of userInterestsArray) {
        if (matchInterestsArray.includes(interest)) {
          sharedValues.push(`Shared interest in ${interest}`);
        }
      }
    }

    // Add personality traits
    if (
      potentialMatch.personalityQuiz &&
      potentialMatch.personalityQuiz.traits
    ) {
      topTraits.push(...potentialMatch.personalityQuiz.traits);
    }

    const explanation =
      score > 85
        ? "You two have exceptional compatibility! Our AI analysis suggests you share important values and communication styles."
        : score > 70
        ? "You have good compatibility. You share some interests and have complementary personalities."
        : "You have moderate compatibility. You might have different approaches but could learn from each other.";

    matches.push({
      match: potentialMatch,
      score,
      explanation,
      compatibilityReasons,
      sharedValues,
      topTraits,
    });
  }

  // Sort by score and return top matches
  return matches.sort((a, b) => b.score - a.score).slice(0, count);
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log("Attempting to connect to MongoDB...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Successfully connected to MongoDB");
    return { client, db: client.db(MONGODB_DB) };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error;
  }
}

// Test matching algorithm with real users
async function testMatchingAlgorithm(db) {
  const usersCollection = db.collection("users");

  // Get all users
  const users = await usersCollection.find({}).toArray();

  if (users.length === 0) {
    console.log("No users found in the database.");
    return;
  }

  console.log(`Found ${users.length} users for matching.`);

  // Test matching for a few selected users to verify algorithm
  const testUsers = users.slice(0, 5); // Take first 5 users for testing

  for (const user of testUsers) {
    console.log(
      `\n===== Testing matches for ${user.name || user.email} (${
        user.gender
      }, ${user.personalityType || "No personality type"}) =====`
    );

    // Get potential matches (excluding the current user)
    const potentialMatches = users.filter(
      (potentialMatch) =>
        potentialMatch._id.toString() !== user._id.toString() &&
        // Filter for opposite gender (a key requirement in our algorithm)
        ((user.gender === "Male" && potentialMatch.gender === "Female") ||
          (user.gender === "Female" && potentialMatch.gender === "Male"))
    );

    console.log(
      `Found ${potentialMatches.length} potential matches (opposite gender)`
    );

    if (potentialMatches.length === 0) {
      console.log("No potential matches found for this user. Skipping...");
      continue;
    }

    try {
      // Get top matches using our algorithm
      const topMatches = getTopMatches(user, potentialMatches, 3);

      console.log(`Top 3 matches for ${user.name || user.email}:`);
      topMatches.forEach((match, index) => {
        console.log(
          `\n${index + 1}. ${match.match.name || match.match.email} (${
            match.match.gender
          }, ${match.match.personalityType || "Unknown"}):`
        );
        console.log(`   Compatibility Score: ${match.score}%`);
        console.log(`   Explanation: ${match.explanation}`);

        if (
          match.compatibilityReasons &&
          match.compatibilityReasons.length > 0
        ) {
          console.log("   Compatibility Reasons:");
          match.compatibilityReasons.forEach((reason) => {
            console.log(`     - ${reason}`);
          });
        }

        if (match.sharedValues && match.sharedValues.length > 0) {
          console.log("   Shared Values:");
          match.sharedValues.forEach((value) => {
            console.log(`     - ${value}`);
          });
        }

        if (match.topTraits && match.topTraits.length > 0) {
          console.log("   Top Traits:");
          match.topTraits.forEach((trait) => {
            console.log(`     - ${trait}`);
          });
        }
      });
    } catch (error) {
      console.error(
        `Error getting matches for user ${user._id}:`,
        error.message
      );
    }
  }
}

// Main function
async function main() {
  let client;

  try {
    // Connect to database
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;

    // Test matching algorithm
    await testMatchingAlgorithm(db);

    console.log("\nMatching algorithm test completed successfully!");
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  } finally {
    // Close the connection
    if (client) {
      console.log("Closing MongoDB connection...");
      await client.close();
      console.log("Connection closed");
    }
  }
}

// Run the script
main();

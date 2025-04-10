// Script to fix the gender inconsistency in user records
// This ensures user.gender matches personalityQuiz.answers.profile_2

require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

(async function () {
  // MongoDB connection
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/matchmaking";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const userCollection = db.collection("users");

    // Find all users with completed personality quiz
    const users = await userCollection
      .find({
        "personalityQuiz.completed": true,
      })
      .toArray();

    console.log(`Found ${users.length} users with completed quizzes`);

    // Track update counts
    let updatedCount = 0;
    let maleCount = 0;
    let femaleCount = 0;

    // Process each user
    for (const user of users) {
      const quizAnswers = user.personalityQuiz?.answers || {};
      const quizGender = quizAnswers.profile_2;

      // Skip if no quiz gender
      if (!quizGender) {
        console.log(`User ${user._id}: No quiz gender found, skipping`);
        continue;
      }

      // If gender in user object doesn't match quiz gender, update it
      if (user.gender !== quizGender) {
        console.log(
          `User ${user._id} (${user.name}): Fixing gender mismatch - user.gender: ${user.gender}, quiz gender: ${quizGender}`
        );

        // Update the user object's gender field
        await userCollection.updateOne(
          { _id: user._id },
          { $set: { gender: quizGender } }
        );

        updatedCount++;
      }

      // Count genders for reporting
      if (quizGender === "male") {
        maleCount++;
      } else if (quizGender === "female") {
        femaleCount++;
      }
    }

    console.log(`\nUpdate Summary:`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`Gender mismatches fixed: ${updatedCount}`);
    console.log(`Male users: ${maleCount}`);
    console.log(`Female users: ${femaleCount}`);
    console.log(
      `Other gender users: ${users.length - maleCount - femaleCount}`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
})();

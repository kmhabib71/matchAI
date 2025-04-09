// Script to update user profiles with personality quiz data
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

// Generate personality quiz data for different user types
function generatePersonalityQuizData() {
  const quizProfiles = [
    // Profile 1: Extroverted Business Woman - ENFJ
    {
      completed: true,
      answers: {
        // Basic profile info
        profile_1: "Sarah",
        profile_2: "Female",
        profile_3: "1990",
        profile_4:
          "I'm a dedicated business owner looking for a meaningful connection.",
        profile_5: "Business Owner",
        profile_6: "BDT 50,000+",
        profile_7: "Master's",
        profile_8: "Christianity",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Travel, Business, Reading, Cooking",

        // MBTI questions
        mbti_1: "Social and energetic",
        mbti_2: "Hanging with friends",
        mbti_3: "Love at first sight",
        mbti_4: "Adventure trip",
        mbti_5: "More emotional",
        mbti_6: "Discuss openly",
        mbti_7: "Prefer waking up early",
        mbti_8: "Spending time together",

        // Preferences
        preferences_1: "28-32",
        preferences_2: "Business Owner, Employee",
        preferences_3: "BDT 30,001-50,000",
        preferences_4: "Bachelor's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ENFJ",
      traits: ["charismatic", "inspiring", "empathetic", "organized"],
    },

    // Profile 2: Introverted Tech Guy - INTJ
    {
      completed: true,
      answers: {
        profile_1: "Rahim",
        profile_2: "Male",
        profile_3: "1992",
        profile_4: "Software engineer who loves solving complex problems.",
        profile_5: "Employee",
        profile_6: "BDT 50,000+",
        profile_7: "Master's",
        profile_8: "Islam",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Reading, Gaming, Sports, Business",

        mbti_1: "Shy and quiet",
        mbti_2: "Relaxing at home",
        mbti_3: "Love develops over time",
        mbti_4: "Watching movies together",
        mbti_5: "More practical",
        mbti_6: "Need some alone time",
        mbti_7: "Prefer staying up late",
        mbti_8: "Helping out",

        preferences_1: "23-27",
        preferences_2: "Employee, Business Owner",
        preferences_3: "BDT 30,001-50,000",
        preferences_4: "Bachelor's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "INTJ",
      traits: ["analytical", "strategic", "independent", "determined"],
    },

    // Profile 3: Artistic Soul - INFP
    {
      completed: true,
      answers: {
        profile_1: "Maya",
        profile_2: "Female",
        profile_3: "1995",
        profile_4:
          "Artist and nature lover seeking someone who appreciates creativity.",
        profile_5: "Freelancer",
        profile_6: "BDT 15,001-30,000",
        profile_7: "Bachelor's",
        profile_8: "Hinduism",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Art, Music, Reading, Travel",

        mbti_1: "Shy and quiet",
        mbti_2: "Relaxing at home",
        mbti_3: "Love at first sight",
        mbti_4: "Romantic dinner",
        mbti_5: "More emotional",
        mbti_6: "Need some alone time",
        mbti_7: "Prefer staying up late",
        mbti_8: "Speaking sweet words",

        preferences_1: "23-27",
        preferences_2: "Freelancer, Business Owner",
        preferences_3: "Optional",
        preferences_4: "Optional",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "INFP",
      traits: ["creative", "empathetic", "authentic", "idealistic"],
    },

    // Profile 4: Practical Executive - ESTJ
    {
      completed: true,
      answers: {
        profile_1: "Karim",
        profile_2: "Male",
        profile_3: "1988",
        profile_4: "Corporate executive looking for a committed relationship.",
        profile_5: "Employee",
        profile_6: "BDT 50,000+",
        profile_7: "Master's",
        profile_8: "Islam",
        profile_9: "Divorced",
        profile_10: "Yes",
        profile_11: "Occasionally",
        profile_12: "Business, Sports, Travel, Reading",

        mbti_1: "Social and energetic",
        mbti_2: "Hanging with friends",
        mbti_3: "Love develops over time",
        mbti_4: "Adventure trip",
        mbti_5: "More practical",
        mbti_6: "Discuss openly",
        mbti_7: "Prefer waking up early",
        mbti_8: "Spending time together",

        preferences_1: "28-32",
        preferences_2: "Employee, Business Owner",
        preferences_3: "BDT 30,001-50,000",
        preferences_4: "Bachelor's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ESTJ",
      traits: ["organized", "practical", "direct", "systematic"],
    },

    // Profile 5: Free-spirited Adventurer - ESFP
    {
      completed: true,
      answers: {
        profile_1: "Priya",
        profile_2: "Female",
        profile_3: "1997",
        profile_4:
          "Travel enthusiast looking for someone to explore the world with.",
        profile_5: "Freelancer",
        profile_6: "BDT 30,001-50,000",
        profile_7: "Bachelor's",
        profile_8: "Unspecified",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Travel, Music, Art, Sports",

        mbti_1: "Social and energetic",
        mbti_2: "Hanging with friends",
        mbti_3: "Love at first sight",
        mbti_4: "Adventure trip",
        mbti_5: "More practical",
        mbti_6: "Discuss openly",
        mbti_7: "Depends on the situation",
        mbti_8: "Spending time together",

        preferences_1: "23-27",
        preferences_2: "Optional",
        preferences_3: "Optional",
        preferences_4: "Optional",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ESFP",
      traits: ["enthusiastic", "spontaneous", "friendly", "adaptable"],
    },

    // Profile 6: Traditional Family Man - ISFJ
    {
      completed: true,
      answers: {
        profile_1: "Ahmed",
        profile_2: "Male",
        profile_3: "1985",
        profile_4: "Family-oriented person seeking a serious relationship.",
        profile_5: "Employee",
        profile_6: "BDT 30,001-50,000",
        profile_7: "Master's",
        profile_8: "Islam",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Reading, Cooking, Sports, Music",

        mbti_1: "Shy and quiet",
        mbti_2: "Relaxing at home",
        mbti_3: "Love develops over time",
        mbti_4: "Cooking together",
        mbti_5: "More practical",
        mbti_6: "Need some alone time",
        mbti_7: "Prefer waking up early",
        mbti_8: "Helping out",

        preferences_1: "23-27",
        preferences_2: "Employee, Freelancer",
        preferences_3: "Optional",
        preferences_4: "Optional",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ISFJ",
      traits: ["supportive", "reliable", "observant", "patient"],
    },

    // Profile 7: Analytical Researcher - INTP
    {
      completed: true,
      answers: {
        profile_1: "Nusrat",
        profile_2: "Female",
        profile_3: "1993",
        profile_4:
          "Researcher who enjoys intellectual discussions and learning.",
        profile_5: "Employee",
        profile_6: "BDT 50,000+",
        profile_7: "Master's",
        profile_8: "Unspecified",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Reading, Gaming, Art, Music",

        mbti_1: "Shy and quiet",
        mbti_2: "Relaxing at home",
        mbti_3: "Love develops over time",
        mbti_4: "Watching movies together",
        mbti_5: "More emotional",
        mbti_6: "Need some alone time",
        mbti_7: "Prefer staying up late",
        mbti_8: "Speaking sweet words",

        preferences_1: "28-32",
        preferences_2: "Employee, Business Owner",
        preferences_3: "BDT 30,001-50,000",
        preferences_4: "Master's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "INTP",
      traits: ["logical", "innovative", "curious", "adaptable"],
    },

    // Profile 8: Entrepreneurial Visionary - ENTP
    {
      completed: true,
      answers: {
        profile_1: "Zaman",
        profile_2: "Male",
        profile_3: "1991",
        profile_4: "Entrepreneur who loves innovation and fresh ideas.",
        profile_5: "Business Owner",
        profile_6: "BDT 50,000+",
        profile_7: "Bachelor's",
        profile_8: "Islam",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "Occasionally",
        profile_12: "Business, Gaming, Travel, Sports",

        mbti_1: "Social and energetic",
        mbti_2: "Hanging with friends",
        mbti_3: "Love develops over time",
        mbti_4: "Adventure trip",
        mbti_5: "More emotional",
        mbti_6: "Discuss openly",
        mbti_7: "Depends on the situation",
        mbti_8: "Speaking sweet words",

        preferences_1: "23-27",
        preferences_2: "Business Owner, Employee",
        preferences_3: "BDT 30,001-50,000",
        preferences_4: "Bachelor's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ENTP",
      traits: ["innovative", "enthusiastic", "adaptable", "analytical"],
    },

    // Profile 9: Caring Nurse - ESFJ
    {
      completed: true,
      answers: {
        profile_1: "Tahmina",
        profile_2: "Female",
        profile_3: "1994",
        profile_4:
          "Compassionate healthcare professional looking for a genuine connection.",
        profile_5: "Employee",
        profile_6: "BDT 30,001-50,000",
        profile_7: "Bachelor's",
        profile_8: "Islam",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Cooking, Music, Reading, Travel",

        mbti_1: "Social and energetic",
        mbti_2: "Hanging with friends",
        mbti_3: "Love develops over time",
        mbti_4: "Cooking together",
        mbti_5: "More practical",
        mbti_6: "Discuss openly",
        mbti_7: "Prefer waking up early",
        mbti_8: "Helping out",

        preferences_1: "28-32",
        preferences_2: "Employee, Business Owner",
        preferences_3: "BDT 30,001-50,000",
        preferences_4: "Bachelor's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ESFJ",
      traits: ["supportive", "sociable", "practical", "organized"],
    },

    // Profile 10: Athletic Coach - ESTP
    {
      completed: true,
      answers: {
        profile_1: "Farhan",
        profile_2: "Male",
        profile_3: "1990",
        profile_4: "Fitness enthusiast who values health and active lifestyle.",
        profile_5: "Business Owner",
        profile_6: "BDT 30,001-50,000",
        profile_7: "Bachelor's",
        profile_8: "Islam",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Sports, Travel, Music, Gaming",

        mbti_1: "Social and energetic",
        mbti_2: "Exercise",
        mbti_3: "Love at first sight",
        mbti_4: "Adventure trip",
        mbti_5: "More practical",
        mbti_6: "Discuss openly",
        mbti_7: "Prefer waking up early",
        mbti_8: "Physical touch and hugs",

        preferences_1: "23-27",
        preferences_2: "Optional",
        preferences_3: "Optional",
        preferences_4: "Optional",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ESTP",
      traits: ["energetic", "practical", "spontaneous", "adaptable"],
    },

    // Profile 11: Dedicated Teacher - ENFP
    {
      completed: true,
      answers: {
        profile_1: "Rini",
        profile_2: "Female",
        profile_3: "1992",
        profile_4: "Passionate teacher who loves inspiring others.",
        profile_5: "Employee",
        profile_6: "BDT 15,001-30,000",
        profile_7: "Master's",
        profile_8: "Hinduism",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Reading, Art, Music, Travel",

        mbti_1: "Social and energetic",
        mbti_2: "Hanging with friends",
        mbti_3: "Love at first sight",
        mbti_4: "Romantic dinner",
        mbti_5: "More emotional",
        mbti_6: "Discuss openly",
        mbti_7: "Depends on the situation",
        mbti_8: "Speaking sweet words",

        preferences_1: "28-32",
        preferences_2: "Employee, Business Owner",
        preferences_3: "Optional",
        preferences_4: "Bachelor's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ENFP",
      traits: ["passionate", "imaginative", "people-oriented", "enthusiastic"],
    },

    // Profile 12: Detail-oriented Craftsman - ISTP
    {
      completed: true,
      answers: {
        profile_1: "Kabir",
        profile_2: "Male",
        profile_3: "1989",
        profile_4:
          "Craftsman who enjoys working with hands and solving practical problems.",
        profile_5: "Freelancer",
        profile_6: "BDT 15,001-30,000",
        profile_7: "Diploma",
        profile_8: "Buddhism",
        profile_9: "Single",
        profile_10: "No",
        profile_11: "No",
        profile_12: "Art, Business, Sports, Travel",

        mbti_1: "Shy and quiet",
        mbti_2: "Exercise",
        mbti_3: "Love develops over time",
        mbti_4: "Adventure trip",
        mbti_5: "More practical",
        mbti_6: "Need some alone time",
        mbti_7: "Prefer waking up early",
        mbti_8: "Helping out",

        preferences_1: "23-27",
        preferences_2: "Optional",
        preferences_3: "Optional",
        preferences_4: "Optional",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ISTP",
      traits: ["practical", "logical", "spontaneous", "independent"],
    },

    // Profile 13: Nurturing Homemaker - ISFP
    {
      completed: true,
      answers: {
        profile_1: "Maliha",
        profile_2: "Female",
        profile_3: "1995",
        profile_4:
          "Homemaker who values family traditions and creating a comfortable home.",
        profile_5: "Unemployed",
        profile_6: "BDT 0-5,000",
        profile_7: "HSC",
        profile_8: "Islam",
        profile_9: "Divorced",
        profile_10: "Yes",
        profile_11: "No",
        profile_12: "Cooking, Art, Music, Reading",

        mbti_1: "Shy and quiet",
        mbti_2: "Relaxing at home",
        mbti_3: "Love develops over time",
        mbti_4: "Cooking together",
        mbti_5: "More practical",
        mbti_6: "Need some alone time",
        mbti_7: "Prefer waking up early",
        mbti_8: "Helping out",

        preferences_1: "33-37",
        preferences_2: "Business Owner, Employee",
        preferences_3: "BDT 30,001-50,000",
        preferences_4: "Optional",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ISFP",
      traits: ["gentle", "sensitive", "spontaneous", "artistic"],
    },

    // Profile 14: Visionary Leader - ENTJ
    {
      completed: true,
      answers: {
        profile_1: "Farid",
        profile_2: "Male",
        profile_3: "1986",
        profile_4:
          "Business leader seeking someone who appreciates ambition and vision.",
        profile_5: "Business Owner",
        profile_6: "BDT 50,000+",
        profile_7: "Master's",
        profile_8: "Islam",
        profile_9: "Widowed",
        profile_10: "Yes",
        profile_11: "Occasionally",
        profile_12: "Business, Travel, Sports, Reading",

        mbti_1: "Social and energetic",
        mbti_2: "Hanging with friends",
        mbti_3: "Love develops over time",
        mbti_4: "Adventure trip",
        mbti_5: "More emotional",
        mbti_6: "Discuss openly",
        mbti_7: "Prefer waking up early",
        mbti_8: "Spending time together",

        preferences_1: "28-32",
        preferences_2: "Business Owner, Employee",
        preferences_3: "BDT 50,000+",
        preferences_4: "Bachelor's",
        preferences_5: "Optional",
      },
      completedAt: new Date(),
      personalityType: "ENTJ",
      traits: ["decisive", "efficient", "strategic", "assertive"],
    },
  ];

  return quizProfiles;
}

// Update users with personality quiz data
async function updateUsersWithQuizData(db) {
  const usersCollection = db.collection("users");

  // Get all users
  const users = await usersCollection.find({}).toArray();

  if (users.length === 0) {
    console.log("No users found in the database.");
    return;
  }

  console.log(`Found ${users.length} users to update.`);

  // Generate quiz data for different profiles
  const quizProfiles = generatePersonalityQuizData();

  // For each user, assign a profile
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    // Use modulo to cycle through quiz profiles if there are more users than profiles
    const profileIndex = i % quizProfiles.length;
    let quizData = quizProfiles[profileIndex];

    // Ensure gender matches the profile data
    if (
      user.gender &&
      user.gender.toLowerCase() !== quizData.answers.profile_2.toLowerCase()
    ) {
      // If user gender doesn't match profile gender, swap to a matching profile
      for (let j = 0; j < quizProfiles.length; j++) {
        if (
          quizProfiles[j].answers.profile_2.toLowerCase() ===
          user.gender.toLowerCase()
        ) {
          quizData = quizProfiles[j];
          break;
        }
      }
    }

    // Update user with ONLY the personality quiz data
    try {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            personalityQuiz: quizData,
            personalityType: quizData.personalityType,
          },
        }
      );

      console.log(
        `Updated user ${user.name || user.email} (${
          user._id
        }) with personality type: ${quizData.personalityType}`
      );
    } catch (error) {
      console.error(`Error updating user ${user._id}:`, error.message);
    }
  }

  console.log("Finished updating all users with personality quiz data.");
}

// Main function
async function main() {
  let client;

  try {
    // Connect to database
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;

    // Update users with quiz data
    await updateUsersWithQuizData(db);

    console.log("Script completed successfully!");
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  } finally {
    // Close the connection when done
    if (client) {
      console.log("Closing MongoDB connection...");
      await client.close();
      console.log("Connection closed");
    }
  }
}

// Run the script
main();

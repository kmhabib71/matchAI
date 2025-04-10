const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

// MongoDB connection string
const MONGODB_URI =
  "mongodb+srv://kmhabib:khurshida71@cluster0.qqlnw.mongodb.net/strangerchat?retryWrites=true&w=majority";

// Connect to MongoDB
async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("Connected to MongoDB");
  return client.db("strangerchat");
}

// Generate a random password hash
async function generatePasswordHash() {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash("password123", salt);
}

// Generate personality quiz answers similar to Kazi Habib's profile
function generateSimilarPersonalityQuizAnswers() {
  // Base personality answers similar to Kazi Habib's profile
  const baseAnswers = {
    personality_1: "4: agree",
    personality_2: "2: disagree",
    personality_3: "1: strongly disagree",
    personality_4: "4: agree",
    personality_5: "2: disagree",
    personality_6: "3: neutral",
    personality_7: "4: agree",
    personality_8: "2: disagree",
    personality_9: "1: strongly disagree",
    personality_10: "4: agree",
    personality_11: "3: neutral",
    personality_12: "1: strongly disagree",
  };

  // Create a copy of base answers
  const answers = { ...baseAnswers };

  // Randomly vary some answers slightly to create realistic variations
  // We'll randomly change 2-4 answers to be close to the original
  const numChanges = Math.floor(Math.random() * 3) + 2;
  const questionKeys = Object.keys(baseAnswers);

  for (let i = 0; i < numChanges; i++) {
    const randomKey =
      questionKeys[Math.floor(Math.random() * questionKeys.length)];
    const currentAnswer = baseAnswers[randomKey];
    const currentValue = parseInt(currentAnswer.charAt(0));

    // Change the answer slightly (by 1 point) if possible
    let newValue;
    if (currentValue === 1) {
      newValue = 2;
    } else if (currentValue === 5) {
      newValue = 4;
    } else {
      // Randomly go up or down by 1
      newValue = currentValue + (Math.random() < 0.5 ? -1 : 1);
    }

    // Map the new value to the corresponding answer text
    let newAnswer;
    switch (newValue) {
      case 1:
        newAnswer = "1: strongly disagree";
        break;
      case 2:
        newAnswer = "2: disagree";
        break;
      case 3:
        newAnswer = "3: neutral";
        break;
      case 4:
        newAnswer = "4: agree";
        break;
      case 5:
        newAnswer = "5: strongly agree";
        break;
    }

    answers[randomKey] = newAnswer;
  }

  // Add preference answers similar to Kazi's
  answers["preferences_1"] = "23-28"; // Same age preference

  // Randomly choose from similar occupation preferences
  const occupationOptions = [
    "student, employee, business owner",
    "employee, business owner",
    "business owner, student",
    "student, employee",
  ];
  answers["preferences_2"] =
    occupationOptions[Math.floor(Math.random() * occupationOptions.length)];

  // Education preference
  const educationOptions = ["hsc", "bachelor's", "diploma", "hsc, bachelor's"];
  answers["preferences_4"] =
    educationOptions[Math.floor(Math.random() * educationOptions.length)];

  // City preference
  answers["preferences_5"] = "any city";

  // Profile info
  const firstNames = [
    "Sadia",
    "Nusrat",
    "Fatima",
    "Mithila",
    "Tasneem",
    "Zara",
    "Nazia",
    "Sabrina",
    "Farida",
    "Raisa",
    "Tania",
    "Lamia",
    "Samia",
    "Nabila",
  ];
  const lastNames = [
    "Ahmed",
    "Khan",
    "Rahman",
    "Chowdhury",
    "Islam",
    "Hasan",
    "Begum",
    "Ali",
    "Sultana",
    "Miah",
    "Kabir",
    "Hoque",
    "Akter",
    "Jahan",
  ];

  answers["profile_1"] = `${
    firstNames[Math.floor(Math.random() * firstNames.length)]
  } ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  answers["profile_2"] = "female"; // Opposite gender for matching

  // Birth year close to Kazi's (2000)
  const yearOffset = Math.floor(Math.random() * 5) - 2; // -2 to +2 years
  answers["profile_3"] = `${2000 + yearOffset}`;

  // Location - Chattogram and nearby cities
  const cities = [
    "Chattogram",
    "Dhaka",
    "Comilla",
    "Cox's Bazar",
    "Noakhali",
    "Feni",
  ];
  answers["profile_4"] = cities[Math.floor(Math.random() * cities.length)];

  // Occupation
  const occupations = ["student", "employee", "business owner"];
  answers["profile_5"] =
    occupations[Math.floor(Math.random() * occupations.length)];

  // Education
  const education = ["bachelor's", "hsc", "master's"];
  answers["profile_7"] =
    education[Math.floor(Math.random() * education.length)];

  // Religion - mostly match with Kazi's (Islam)
  const religions = ["islam", "islam", "islam", "islam", "hindu", "christian"]; // 4/6 chance of Islam
  answers["profile_8"] =
    religions[Math.floor(Math.random() * religions.length)];

  // Marital status
  answers["profile_9"] = "single";

  // Hobbies - some overlap with Kazi's
  const allHobbies = [
    "reading",
    "music",
    "travel",
    "cooking",
    "art",
    "photography",
    "dancing",
    "gaming",
    "sports",
    "movies",
  ];

  // Include at least one of Kazi's hobbies (reading or music)
  let selectedHobbies = [];
  if (Math.random() < 0.8) {
    // 80% chance to have reading
    selectedHobbies.push("reading");
  }
  if (Math.random() < 0.7) {
    // 70% chance to have music
    selectedHobbies.push("music");
  }

  // Add 1-2 more random hobbies
  const additionalHobbies = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < additionalHobbies; i++) {
    const hobby = allHobbies[Math.floor(Math.random() * allHobbies.length)];
    if (!selectedHobbies.includes(hobby)) {
      selectedHobbies.push(hobby);
    }
  }

  answers["profile_12"] = selectedHobbies.join(", ");

  return answers;
}

// Create a similar user to Kazi Habib's profile
async function createSimilarUser(index) {
  const passwordHash = await generatePasswordHash();
  const personalityQuizAnswers = generateSimilarPersonalityQuizAnswers();

  // Extract age from profile_3 (birth year)
  const birthYear = parseInt(personalityQuizAnswers["profile_3"]);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Determine city in Bengali
  const cityMapping = {
    Dhaka: "ঢাকা",
    Chattogram: "চট্টগ্রাম",
    Comilla: "কুমিল্লা",
    "Cox's Bazar": "কক্সবাজার",
    Noakhali: "নোয়াখালী",
    Feni: "ফেনী",
  };

  const city = personalityQuizAnswers["profile_4"];
  const bnCity = cityMapping[city] || "চট্টগ্রাম"; // Default to Chattogram if not found

  const timestamp = Date.now();

  return {
    name: personalityQuizAnswers["profile_1"],
    email: `matchuser${index}_${timestamp}@example.com`,
    password: passwordHash,
    age: age,
    gender: "female", // Opposite to Kazi for matching
    orientation: "Straight",
    location: {
      type: "Point",
      coordinates: [0, 0], // Default coordinates
      city: bnCity,
      country: "Bangladesh",
    },
    additionalPhotos: [],
    interests: ["Reading", "Music", "Travel"].slice(
      0,
      Math.floor(Math.random() * 3) + 1
    ),
    relationshipGoals: ["Serious"], // Same as Kazi
    dealBreakers: [],
    preferences: {
      minAge: Math.max(18, age - 5),
      maxAge: age + 5,
      distance: 50,
      dealBreakers: [],
      relationshipGoals: [],
      genderPreference: [],
      maxDistance: 50,
      relationshipType: [],
    },
    profileCompleted: true,
    interactions: {
      nextMatchClicks: 0,
      messagesSent: 0,
      messagesReceived: 0,
    },
    personalityQuiz: {
      completed: true,
      completedAt: new Date(),
      personalityType: "ISTP", // Same as Kazi for higher matching
      traits: [],
      answers: personalityQuizAnswers,
    },
    verificationScore: 0,
    roles: ["user"],
    verifications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
    personalityType: "ISTP", // Same as Kazi
    isActive: true,
    isTestUser: true,
    personalityQuizResults: [],
    lastActive: new Date(),
    lifestyle: {
      smoking: "No", // Same as Kazi
      drinking: "No", // Same as Kazi
      diet: "Any", // Same as Kazi
      religion: "Any", // Same as Kazi
    },
    profileImage: "", // No image for test users
  };
}

// Generate similar users
async function generateSimilarUsers() {
  try {
    const db = await connectToMongoDB();

    // Generate and insert 50 similar users
    const users = [];
    const numUsers = 50;

    console.log(
      `Generating ${numUsers} users similar to Kazi Habib's profile...`
    );

    for (let i = 1; i <= numUsers; i++) {
      const user = await createSimilarUser(i);
      users.push(user);

      // Log progress
      if (i % 10 === 0) {
        console.log(`Generated ${i} similar users...`);
      }
    }

    // Insert all users at once
    const result = await db.collection("users").insertMany(users);
    console.log(`Successfully inserted ${result.insertedCount} similar users.`);

    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
generateSimilarUsers();

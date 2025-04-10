const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

// MongoDB connection string from the mongodb.ts file
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

// Generate random city
function getRandomCity() {
  const districts = [
    { name: "Dhaka", bn_name: "ঢাকা" },
    { name: "Chattogram", bn_name: "চট্টগ্রাম" },
    { name: "Comilla", bn_name: "কুমিল্লা" },
    { name: "Sylhet", bn_name: "সিলেট" },
    { name: "Rajshahi", bn_name: "রাজশাহী" },
    { name: "Khulna", bn_name: "খুলনা" },
    { name: "Barisal", bn_name: "বরিশাল" },
    { name: "Rangpur", bn_name: "রংপুর" },
    { name: "Mymensingh", bn_name: "ময়মনসিংহ" },
    { name: "Dinajpur", bn_name: "দিনাজপুর" },
    { name: "Gazipur", bn_name: "গাজীপুর" },
    { name: "Narayanganj", bn_name: "নারায়ণগঞ্জ" },
  ];
  const district = districts[Math.floor(Math.random() * districts.length)];
  return district.name; // Return the English name
}

// Generate random age between 20 and 40
function getRandomAge() {
  return Math.floor(Math.random() * 20) + 20;
}

// Generate random gender
function getRandomGender() {
  const genders = ["male", "female"];
  return genders[Math.floor(Math.random() * genders.length)];
}

// Generate random orientation
function getRandomOrientation() {
  const orientations = ["Straight", "Gay", "Bisexual"];
  return orientations[Math.floor(Math.random() * orientations.length)];
}

// Generate random relationship goals
function getRandomRelationshipGoals() {
  const goals = ["Casual", "Serious", "Friendship", "Marriage", "Not Sure"];
  const numGoals = Math.floor(Math.random() * 2) + 1; // 1 or 2 goals
  const selectedGoals = [];

  for (let i = 0; i < numGoals; i++) {
    const goal = goals[Math.floor(Math.random() * goals.length)];
    if (!selectedGoals.includes(goal)) {
      selectedGoals.push(goal);
    }
  }

  return selectedGoals;
}

// Generate personality quiz answers
function generatePersonalityQuizAnswers() {
  const personalityQuizAnswers = {};

  // Profile questions
  personalityQuizAnswers["profile_1"] = `user ${Math.floor(
    Math.random() * 1000
  )}`;
  personalityQuizAnswers["profile_2"] = getRandomGender();
  personalityQuizAnswers["profile_3"] = `${
    1980 + Math.floor(Math.random() * 25)
  }`;
  personalityQuizAnswers["profile_4"] = getRandomCity();

  const occupations = [
    "student",
    "employee",
    "business owner",
    "freelancer",
    "unemployed",
  ];
  personalityQuizAnswers["profile_5"] =
    occupations[Math.floor(Math.random() * occupations.length)];

  const education = [
    "ssc",
    "hsc",
    "diploma",
    "bachelor's",
    "master's",
    "other",
  ];
  personalityQuizAnswers["profile_7"] =
    education[Math.floor(Math.random() * education.length)];

  const religions = [
    "islam",
    "hindu",
    "christian",
    "buddhist",
    "other",
    "none",
  ];
  personalityQuizAnswers["profile_8"] =
    religions[Math.floor(Math.random() * religions.length)];

  const maritalStatus = ["single", "divorced", "widowed"];
  personalityQuizAnswers["profile_9"] =
    maritalStatus[Math.floor(Math.random() * maritalStatus.length)];

  const hobbies = [
    "travel",
    "music",
    "reading",
    "cooking",
    "gaming",
    "business",
    "sports",
    "art",
    "other",
  ];
  const numHobbies = Math.floor(Math.random() * 3) + 1; // 1 to 3 hobbies
  const selectedHobbies = [];

  for (let i = 0; i < numHobbies; i++) {
    const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    if (!selectedHobbies.includes(hobby)) {
      selectedHobbies.push(hobby);
    }
  }

  personalityQuizAnswers["profile_12"] = selectedHobbies.join(", ");

  // Preferences questions
  const ageRanges = [
    "18-23",
    "23-28",
    "28-33",
    "33-38",
    "38-45",
    "45+",
    "any age",
  ];
  personalityQuizAnswers["preferences_1"] =
    ageRanges[Math.floor(Math.random() * ageRanges.length)];

  const preferredOccupations = [
    "student",
    "employee",
    "business owner",
    "freelancer",
    "unemployed",
  ];
  const numPreferredOccupations = Math.floor(Math.random() * 3) + 1; // 1 to 3 preferred occupations
  const selectedPreferredOccupations = [];

  for (let i = 0; i < numPreferredOccupations; i++) {
    const occupation =
      preferredOccupations[
        Math.floor(Math.random() * preferredOccupations.length)
      ];
    if (!selectedPreferredOccupations.includes(occupation)) {
      selectedPreferredOccupations.push(occupation);
    }
  }

  personalityQuizAnswers["preferences_2"] =
    selectedPreferredOccupations.join(", ");

  const preferredEducation = [
    "ssc",
    "hsc",
    "diploma",
    "bachelor's",
    "master's",
    "other",
  ];
  personalityQuizAnswers["preferences_4"] =
    preferredEducation[Math.floor(Math.random() * preferredEducation.length)];

  const cityPreferences = ["yes", "no", "any city"];
  personalityQuizAnswers["preferences_5"] =
    cityPreferences[Math.floor(Math.random() * cityPreferences.length)];

  // Personality questions (12 questions)
  for (let i = 1; i <= 12; i++) {
    const responses = [
      "1: strongly disagree",
      "2: disagree",
      "3: neutral",
      "4: agree",
      "5: strongly agree",
    ];
    personalityQuizAnswers[`personality_${i}`] =
      responses[Math.floor(Math.random() * responses.length)];
  }

  return personalityQuizAnswers;
}

// Determine MBTI personality type based on answers
function determinePersonalityType() {
  const types = [
    "ISTJ",
    "ISFJ",
    "INFJ",
    "INTJ",
    "ISTP",
    "ISFP",
    "INFP",
    "INTP",
    "ESTP",
    "ESFP",
    "ENFP",
    "ENTP",
    "ESTJ",
    "ESFJ",
    "ENFJ",
    "ENTJ",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

// Function to create a test user
async function createTestUser(index) {
  const passwordHash = await generatePasswordHash();
  const personalityQuizAnswers = generatePersonalityQuizAnswers();
  const personalityType = determinePersonalityType();
  const age = getRandomAge();
  const gender = getRandomGender();
  const orientation = getRandomOrientation();
  const timestamp = Date.now();

  return {
    name: `Test User ${index}-${timestamp}`,
    email: `testuser${index}_${timestamp}@example.com`,
    password: passwordHash,
    age: age,
    gender: gender,
    orientation: orientation,
    location: {
      type: "Point",
      coordinates: [0, 0],
      city: getRandomCity(),
      country: "Bangladesh",
    },
    additionalPhotos: [],
    interests: [],
    relationshipGoals: getRandomRelationshipGoals(),
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
      nextMatchClicks: Math.floor(Math.random() * 10),
      messagesSent: Math.floor(Math.random() * 20),
      messagesReceived: Math.floor(Math.random() * 15),
    },
    personalityQuiz: {
      completed: true,
      completedAt: new Date(),
      personalityType: personalityType,
      traits: [],
      answers: personalityQuizAnswers,
    },
    verificationScore: 0,
    roles: ["user"],
    verifications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    personalityType: personalityType,
    isActive: true,
    isTestUser: true,
    personalityQuizResults: [],
    lastActive: new Date(),
    lifestyle: {
      smoking: ["Yes", "No", "Sometimes"][Math.floor(Math.random() * 3)],
      drinking: ["Yes", "No", "Sometimes"][Math.floor(Math.random() * 3)],
      diet: ["Vegetarian", "Vegan", "Non-vegetarian", "Any"][
        Math.floor(Math.random() * 4)
      ],
      religion: ["Important", "Somewhat important", "Not important"][
        Math.floor(Math.random() * 3)
      ],
    },
    profileImage: "",
  };
}

// Main function to generate and insert test users
async function generateTestUsers() {
  try {
    const db = await connectToMongoDB();
    const usersCollection = db.collection("users");

    console.log("Generating 20 test users...");

    for (let i = 1; i <= 20; i++) {
      const testUser = await createTestUser(i);
      await usersCollection.insertOne(testUser);
      console.log(`Test user ${i} created`);
    }

    console.log("All test users have been created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error generating test users:", error);
    process.exit(1);
  }
}

// Run the script
generateTestUsers();

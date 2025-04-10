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

// Generate random city - using English names
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

  return districts[Math.floor(Math.random() * districts.length)].name;
}

// Generate random age between 18 and 45
function getRandomAge() {
  return Math.floor(Math.random() * 27) + 18;
}

// Generate random gender
function getRandomGender() {
  const genders = ["male", "female"];
  return genders[Math.floor(Math.random() * genders.length)];
}

// Generate random orientation
function getRandomOrientation() {
  const orientations = ["Straight", "Gay", "Bisexual", "Pansexual"];
  return orientations[Math.floor(Math.random() * orientations.length)];
}

// Generate random relationship goals
function getRandomRelationshipGoals() {
  const goals = ["Casual", "Serious", "Friendship", "Marriage", "Not Sure"];
  const numGoals = Math.floor(Math.random() * 3) + 1; // 1 to 3 goals
  const selectedGoals = [];

  for (let i = 0; i < numGoals; i++) {
    const goal = goals[Math.floor(Math.random() * goals.length)];
    if (!selectedGoals.includes(goal)) {
      selectedGoals.push(goal);
    }
  }

  return selectedGoals;
}

// Generate random interests
function getRandomInterests() {
  const interests = [
    "Reading",
    "Cooking",
    "Movies",
    "Music",
    "Travel",
    "Photography",
    "Art",
    "Dancing",
    "Hiking",
    "Swimming",
    "Cycling",
    "Gaming",
    "Yoga",
    "Meditation",
    "Fitness",
    "Technology",
    "Fashion",
    "Food",
    "History",
    "Sports",
  ];

  const numInterests = Math.floor(Math.random() * 6) + 1; // 1 to 6 interests
  const selectedInterests = [];

  for (let i = 0; i < numInterests; i++) {
    const interest = interests[Math.floor(Math.random() * interests.length)];
    if (!selectedInterests.includes(interest)) {
      selectedInterests.push(interest);
    }
  }

  return selectedInterests;
}

// Generate different personality quiz answers - more diverse patterns
function generatePersonalityQuizAnswers() {
  const personalityQuizAnswers = {};

  // Profile questions
  const firstNames = [
    "Arif",
    "Kamal",
    "Sadia",
    "Nusrat",
    "Rahim",
    "Jamil",
    "Fatima",
    "Mithila",
    "Tahmid",
    "Farid",
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
  ];

  personalityQuizAnswers["profile_1"] = `${
    firstNames[Math.floor(Math.random() * firstNames.length)]
  } ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  personalityQuizAnswers["profile_2"] = getRandomGender();

  // Birth year between 1975 and 2005
  personalityQuizAnswers["profile_3"] = `${
    1975 + Math.floor(Math.random() * 30)
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
    "phd",
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
    "photography",
    "dancing",
  ];
  const numHobbies = Math.floor(Math.random() * 4) + 1; // 1 to 4 hobbies
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

  const preferredOccupations = occupations.slice();
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

  const preferredEducation = education.slice();
  personalityQuizAnswers["preferences_4"] =
    preferredEducation[Math.floor(Math.random() * preferredEducation.length)];

  const cityPreferences = ["yes", "no", "any city"];
  personalityQuizAnswers["preferences_5"] =
    cityPreferences[Math.floor(Math.random() * cityPreferences.length)];

  // Personality questions (12 questions) - Create more diverse patterns
  const patterns = [
    // Extrovert pattern
    {
      1: "4: agree",
      2: "2: disagree",
      3: "5: strongly agree",
      4: "4: agree",
      5: "2: disagree",
      6: "3: neutral",
      7: "4: agree",
      8: "2: disagree",
      9: "4: agree",
      10: "3: neutral",
      11: "5: strongly agree",
      12: "2: disagree",
    },
    // Introvert pattern
    {
      1: "2: disagree",
      2: "4: agree",
      3: "1: strongly disagree",
      4: "4: agree",
      5: "3: neutral",
      6: "4: agree",
      7: "2: disagree",
      8: "4: agree",
      9: "3: neutral",
      10: "4: agree",
      11: "2: disagree",
      12: "4: agree",
    },
    // Ambitious pattern
    {
      1: "3: neutral",
      2: "5: strongly agree",
      3: "2: disagree",
      4: "3: neutral",
      5: "4: agree",
      6: "2: disagree",
      7: "3: neutral",
      8: "2: disagree",
      9: "3: neutral",
      10: "5: strongly agree",
      11: "4: agree",
      12: "5: strongly agree",
    },
    // Relaxed pattern
    {
      1: "4: agree",
      2: "1: strongly disagree",
      3: "3: neutral",
      4: "5: strongly agree",
      5: "1: strongly disagree",
      6: "2: disagree",
      7: "5: strongly agree",
      8: "3: neutral",
      9: "2: disagree",
      10: "1: strongly disagree",
      11: "4: agree",
      12: "1: strongly disagree",
    },
    // Mixed pattern
    {
      1: "3: neutral",
      2: "3: neutral",
      3: "3: neutral",
      4: "3: neutral",
      5: "3: neutral",
      6: "3: neutral",
      7: "3: neutral",
      8: "3: neutral",
      9: "3: neutral",
      10: "3: neutral",
      11: "3: neutral",
      12: "3: neutral",
    },
  ];

  // Choose a random pattern
  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];

  // Apply pattern with some randomization
  for (let i = 1; i <= 12; i++) {
    // 70% chance to follow pattern, 30% chance for random value
    if (Math.random() < 0.7) {
      personalityQuizAnswers[`personality_${i}`] = selectedPattern[i];
    } else {
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
  }

  return personalityQuizAnswers;
}

// Determine personality type based on answer patterns
function determinePersonalityType(answers) {
  // MBTI types
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

  // Count how many "agree" (4/5) vs "disagree" (1/2) responses for extroversion (q3)
  const personalityAnswers = {};
  for (let i = 1; i <= 12; i++) {
    if (answers[`personality_${i}`]) {
      personalityAnswers[i] = answers[`personality_${i}`].charAt(0);
    }
  }

  // Simplified personality type calculation
  let e = 0,
    i = 0,
    s = 0,
    n = 0,
    t = 0,
    f = 0,
    j = 0,
    p = 0;

  // E/I - Question 3
  if (personalityAnswers[3] >= "4") e += 2;
  else if (personalityAnswers[3] <= "2") i += 2;

  // S/N - Question 1
  if (personalityAnswers[1] >= "4") n += 2;
  else if (personalityAnswers[1] <= "2") s += 2;

  // T/F - Question 4
  if (personalityAnswers[4] >= "4") f += 2;
  else if (personalityAnswers[4] <= "2") t += 2;

  // J/P - Question 2
  if (personalityAnswers[2] >= "4") j += 2;
  else if (personalityAnswers[2] <= "2") p += 2;

  // Secondary questions
  if (personalityAnswers[7] >= "4") i += 1;
  else if (personalityAnswers[7] <= "2") e += 1;

  if (personalityAnswers[11] >= "4") n += 1;
  else if (personalityAnswers[11] <= "2") s += 1;

  if (personalityAnswers[9] >= "4") f += 1;
  else if (personalityAnswers[9] <= "2") t += 1;

  if (personalityAnswers[12] >= "4") j += 1;
  else if (personalityAnswers[12] <= "2") p += 1;

  // Determine type
  let type = "";
  type += e > i ? "E" : "I";
  type += s > n ? "S" : "N";
  type += t > f ? "T" : "F";
  type += j > p ? "J" : "P";

  return type;
}

// Function to create a test user
async function createTestUser(index) {
  const passwordHash = await generatePasswordHash();
  const personalityQuizAnswers = generatePersonalityQuizAnswers();
  const personalityType = determinePersonalityType(personalityQuizAnswers);
  const age = getRandomAge();
  const gender = getRandomGender();
  const orientation = getRandomOrientation();
  const timestamp = Date.now();
  const interests = getRandomInterests();

  return {
    name: `Demo User ${index}-${timestamp}`,
    email: `demouser${index}_${timestamp}@example.com`,
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
    interests: interests,
    relationshipGoals: getRandomRelationshipGoals(),
    dealBreakers: [],
    preferences: {
      minAge: Math.max(18, age - 7),
      maxAge: age + 7,
      distance: 30 + Math.floor(Math.random() * 70),
      dealBreakers: [],
      relationshipGoals: [],
      genderPreference: [],
      maxDistance: 30 + Math.floor(Math.random() * 70),
      relationshipType: [],
    },
    profileCompleted: true,
    interactions: {
      nextMatchClicks: Math.floor(Math.random() * 15),
      messagesSent: Math.floor(Math.random() * 25),
      messagesReceived: Math.floor(Math.random() * 20),
    },
    personalityQuiz: {
      completed: true,
      completedAt: new Date(),
      personalityType: personalityType,
      traits: [],
      answers: personalityQuizAnswers,
    },
    verificationScore: Math.floor(Math.random() * 5),
    roles: ["user"],
    verifications: [],
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
    ), // Random date in the last 30 days
    updatedAt: new Date(),
    personalityType: personalityType,
    isActive: true,
    isTestUser: true,
    personalityQuizResults: [],
    lastActive: new Date(
      Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
    ), // Random date in the last week
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
async function generateDemoUsers() {
  try {
    const db = await connectToMongoDB();
    const usersCollection = db.collection("users");

    console.log(
      "Generating 20 demo users with diverse personality patterns..."
    );

    for (let i = 1; i <= 20; i++) {
      const testUser = await createTestUser(i);
      await usersCollection.insertOne(testUser);
      console.log(
        `Demo user ${i} created with personality type ${testUser.personalityType}`
      );
    }

    console.log("All demo users have been created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error generating demo users:", error);
    process.exit(1);
  }
}

// Run the script
generateDemoUsers();

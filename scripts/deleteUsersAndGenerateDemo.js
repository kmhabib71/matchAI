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

// Delete all users except the one with email km.habibs@gmail.com
async function deleteUsers(db) {
  try {
    const result = await db.collection("users").deleteMany({
      email: { $ne: "km.habibs@gmail.com" },
    });
    console.log(`Deleted ${result.deletedCount} users`);
  } catch (error) {
    console.error("Error deleting users:", error);
  }
}

// Generate random city - using English names with Bengali mapping
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
  return { name: district.name, bn_name: district.bn_name };
}

// Generate random age between 18 and 45
function getRandomAge() {
  return Math.floor(Math.random() * 28) + 18;
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

  const numInterests = Math.floor(Math.random() * 5) + 1; // 1 to 5 interests
  const selectedInterests = [];

  for (let i = 0; i < numInterests; i++) {
    const interest = interests[Math.floor(Math.random() * interests.length)];
    if (!selectedInterests.includes(interest)) {
      selectedInterests.push(interest);
    }
  }

  return selectedInterests;
}

// Generate personality quiz answers that exactly match the options in the quiz component
function generatePersonalityQuizAnswers() {
  const answers = {};

  // Mapping for Bengali options to English responses
  const optionMapping = {
    // Question 1 (Openness)
    1: [
      "1: strongly disagree", // ১: একদম না 😒
      "2: disagree", // ২: না 😕
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😊
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😃
    ],
    // Question 2 (Conscientiousness)
    2: [
      "1: strongly disagree", // ১: একদম না 🙂
      "2: disagree", // ২: না 😌
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😟
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😣
    ],
    // Question 3 (Extraversion)
    3: [
      "1: strongly disagree", // ১: একদম না 😔
      "2: disagree", // ২: না 🙂
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😄
      "5: strongly agree", // ৫: খুবই হ্যাঁ 🎉
    ],
    // Question 4 (Agreeableness)
    4: [
      "1: strongly disagree", // ১: একদম না 😠
      "2: disagree", // ২: না 😒
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 🙂
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😌
    ],
    // Question 5 (Neuroticism)
    5: [
      "1: strongly disagree", // ১: একদম না 😎
      "2: disagree", // ২: না 🙂
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😫
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😩
    ],
    // Question 6 (Attachment Style 1)
    6: [
      "1: strongly disagree", // ১: একদম না 😌
      "2: disagree", // ২: না 🙂
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😟
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😰
    ],
    // Question 7 (Attachment Style 2)
    7: [
      "1: strongly disagree", // ১: একদম না 😣
      "2: disagree", // ২: না 😔
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 🙂
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😌
    ],
    // Question 8 (Attachment Style 3)
    8: [
      "1: strongly disagree", // ১: একদম না 😃
      "2: disagree", // ২: না 😊
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😓
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😅
    ],
    // Question 9 (Values and Life Goals 1)
    9: [
      "1: strongly disagree", // ১: একদম না 😒
      "2: disagree", // ২: না 🙂
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😊
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😍
    ],
    // Question 10 (Values and Life Goals 2)
    10: [
      "1: strongly disagree", // ১: একদম না 😌
      "2: disagree", // ২: না 🙂
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😟
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😣
    ],
    // Question 11 (Values and Life Goals 3)
    11: [
      "1: strongly disagree", // ১: একদম না 😌
      "2: disagree", // ২: না 🙂
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😊
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😃
    ],
    // Question 12 (Values and Life Goals 4)
    12: [
      "1: strongly disagree", // ১: একদম না 😌
      "2: disagree", // ২: না 🙂
      "3: neutral", // ৩: মাঝামাঝি 😐
      "4: agree", // ৪: হ্যাঁ 😟
      "5: strongly agree", // ৫: খুবই হ্যাঁ 😖
    ],
  };

  // Generate random answers for the 12 personality questions
  for (let i = 1; i <= 12; i++) {
    const options = optionMapping[i];
    const randomIndex = Math.floor(Math.random() * options.length);
    answers[`personality_${i}`] = options[randomIndex];
  }

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
    "Tasneem",
    "Zara",
    "Imran",
    "Nazia",
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
  ];

  answers["profile_1"] = `${
    firstNames[Math.floor(Math.random() * firstNames.length)]
  } ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  answers["profile_2"] = getRandomGender();

  // Birth year between 1975 and 2005
  answers["profile_3"] = `${1975 + Math.floor(Math.random() * 30)}`;
  answers["profile_4"] = getRandomCity().name;

  const occupations = [
    "student",
    "employee",
    "business owner",
    "freelancer",
    "unemployed",
  ];
  answers["profile_5"] =
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
  answers["profile_7"] =
    education[Math.floor(Math.random() * education.length)];

  const religions = [
    "islam",
    "hindu",
    "christian",
    "buddhist",
    "other",
    "none",
  ];
  answers["profile_8"] =
    religions[Math.floor(Math.random() * religions.length)];

  const maritalStatus = ["single", "divorced", "widowed"];
  answers["profile_9"] =
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

  answers["profile_12"] = selectedHobbies.join(", ");

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
  answers["preferences_1"] =
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

  answers["preferences_2"] = selectedPreferredOccupations.join(", ");

  const preferredEducation = education.slice();
  answers["preferences_4"] =
    preferredEducation[Math.floor(Math.random() * preferredEducation.length)];

  const cityPreferences = ["yes", "no", "any city"];
  answers["preferences_5"] =
    cityPreferences[Math.floor(Math.random() * cityPreferences.length)];

  return answers;
}

// Determine MBTI personality type based on some answers
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

// Create a single test user
async function createTestUser(index) {
  const passwordHash = await generatePasswordHash();
  const personalityQuizAnswers = generatePersonalityQuizAnswers();
  const personalityType = determinePersonalityType();
  const age = getRandomAge();
  const gender = getRandomGender();
  const orientation = getRandomOrientation();
  const relationshipGoals = getRandomRelationshipGoals();
  const interests = getRandomInterests();
  const city = getRandomCity();
  const timestamp = Date.now();

  return {
    name: `Demo User ${index}`,
    email: `demouser${index}_${timestamp}@example.com`,
    password: passwordHash,
    age: age,
    gender: gender,
    orientation: orientation,
    location: {
      type: "Point",
      coordinates: [0, 0], // Default coordinates
      city: city.bn_name,
      country: "Bangladesh",
    },
    additionalPhotos: [],
    interests: interests,
    relationshipGoals: relationshipGoals,
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
      personalityType: personalityType,
      traits: [],
      answers: personalityQuizAnswers,
    },
    verificationScore: 0,
    roles: ["user"],
    verifications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
    personalityType: personalityType,
    isActive: true,
    isTestUser: true,
    personalityQuizResults: [],
    lastActive: new Date(),
    lifestyle: {
      smoking: ["Yes", "No", "Sometimes"][Math.floor(Math.random() * 3)],
      drinking: ["Yes", "No", "Sometimes"][Math.floor(Math.random() * 3)],
      diet: ["Any", "Vegetarian", "Vegan", "Halal"][
        Math.floor(Math.random() * 4)
      ],
      religion: ["Any", "Islam", "Hindu", "Christian", "Buddhist"][
        Math.floor(Math.random() * 5)
      ],
    },
    profileImage: "", // No image for test users
  };
}

// Generate demo users
async function generateDemoUsers() {
  try {
    const db = await connectToMongoDB();

    // First delete all users except the one with email km.habibs@gmail.com
    await deleteUsers(db);

    // Now generate and insert 50 test users
    const users = [];
    const numUsers = 50;

    console.log(`Generating ${numUsers} test users...`);

    for (let i = 1; i <= numUsers; i++) {
      const user = await createTestUser(i);
      users.push(user);

      // Log progress
      if (i % 10 === 0) {
        console.log(`Generated ${i} users...`);
      }
    }

    // Insert all users at once
    const result = await db.collection("users").insertMany(users);
    console.log(`Successfully inserted ${result.insertedCount} test users.`);

    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
generateDemoUsers();

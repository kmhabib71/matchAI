// MongoDB Pipeline Test Script
// Run with: node testMongoDbPipeline.js
// Or to provide a MongoDB URI directly: MONGODB_URI="mongodb://..." node testMongoDbPipeline.js

const { MongoClient, ObjectId } = require("mongodb");

// ========== CONFIGURATION ==========
// Either set the URI here or provide it through the environment variable MONGODB_URI
const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://kmhabib:khurshida71@cluster0.qqlnw.mongodb.net/strangerchat?retryWrites=true&w=majority";
// If you need authentication, use: "mongodb://username:password@localhost:27017/your_database_name"
// For MongoDB Atlas: "mongodb+srv://username:password@cluster.mongodb.net/your_database_name"

// Collection name where users are stored
const USERS_COLLECTION = "users";
// ===================================

// Mock test user similar to how it would appear in the database
const testUser = {
  _id: new ObjectId(),
  name: "Test User",
  email: "test@example.com",
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
      personality_1: "3:neutral", // Openness
      personality_2: "3:neutral", // Conscientiousness
      personality_3: "3:neutral", // Extraversion
      personality_4: "3:neutral", // Agreeableness
      personality_5: "3:neutral", // Neuroticism
      personality_6: "3:neutral", // Anxious attachment
      personality_7: "3:neutral", // Secure attachment
      personality_9: "3:neutral", // Family values
      personality_10: "3:neutral", // Career values
      personality_11: "3:neutral", // Adventure values
      personality_12: "3:neutral", // Stability values

      // Preferences
      preferences_1: "25-35", // Age preference
      preferences_2: "Engineer, Doctor", // Profession preference
      preferences_4: "bachelor's", // Education preference
      preferences_5: "Yes, I prefer someone in my city", // City preference
    },
  },
};

// Previously matched users to exclude (mock IDs)
const excludedUserIds = [
  new ObjectId("111111111111111111111111"),
  new ObjectId("222222222222222222222222"),
];

// Helper function to build the MongoDB aggregation pipeline for matching
// This is taken from your route.ts file
function buildMatchingPipeline(currentUser, excludedUserIds) {
  // Extract all required data from current user
  const answers = currentUser.personalityQuiz?.answers || {};

  // Log user data used for filtering
  console.log("\n=== BUILDING MATCHING PIPELINE ===");

  // CRITICAL: These are the key fields used for hard filters
  const userGender = answers.profile_2 || currentUser.gender;
  const userReligion = answers.profile_8;
  const userMaritalStatus = answers.profile_9;

  console.log(`Current user gender: ${userGender}`);
  console.log(`Current user religion: ${userReligion}`);
  console.log(`Current user marital status: ${userMaritalStatus}`);

  // ================== BUILD HARD FILTERS ==================
  const matchCriteria = {
    // Basic requirement: Must have completed quiz
    "personalityQuiz.completed": true,

    // Exclude current user and previously viewed users
    _id: { $nin: excludedUserIds },
  };

  // 1. OPPOSITE GENDER (MANDATORY)
  if (userGender) {
    const oppositeGender = userGender === "male" ? "female" : "male";
    matchCriteria["personalityQuiz.answers.profile_2"] = oppositeGender;
    console.log(
      `HARD FILTER: Must be ${oppositeGender} (opposite of current user's ${userGender})`
    );
  } else {
    console.error("ERROR: User gender not available!");
    return [];
  }

  // 2. EXACT RELIGION MATCH (MANDATORY)
  if (userReligion) {
    matchCriteria["personalityQuiz.answers.profile_8"] = userReligion;
    console.log(`HARD FILTER: Religion must exactly match ${userReligion}`);
  }

  // 3. MARITAL STATUS COMPATIBILITY (MANDATORY)
  if (userMaritalStatus) {
    if (userMaritalStatus === "single") {
      // Singles match with singles only
      matchCriteria["personalityQuiz.answers.profile_9"] = "single";
      console.log(
        "HARD FILTER: Must be single (because current user is single)"
      );
    } else {
      // Non-singles match with other non-singles
      matchCriteria["personalityQuiz.answers.profile_9"] = { $ne: "single" };
      console.log(
        `HARD FILTER: Must be non-single (because current user is ${userMaritalStatus})`
      );
    }
  }

  // 4. AGE RANGE FILTER
  const agePreference = answers.preferences_1;
  if (agePreference && agePreference.includes("-")) {
    const [minAge, maxAge] = agePreference.split("-").map(Number);
    if (!isNaN(minAge) && !isNaN(maxAge)) {
      const currentYear = new Date().getFullYear();
      const minBirthYear = (currentYear - maxAge - 5).toString(); // Allow 5 years flexibility
      const maxBirthYear = (currentYear - minAge + 5).toString(); // Allow 5 years flexibility

      matchCriteria["personalityQuiz.answers.profile_3"] = {
        $gte: minBirthYear,
        $lte: maxBirthYear,
      };

      console.log(
        `FILTER: Birth year must be between ${minBirthYear} and ${maxBirthYear}`
      );
    }
  }

  console.log("FINAL MATCH CRITERIA:");
  console.log(JSON.stringify(matchCriteria, null, 2));

  // ================== BUILD SCORING PIPELINE ==================
  // Extract additional data needed for scoring
  const userHobbies = (answers.profile_12 || "")
    .split(",")
    .map((h) => h.trim().toLowerCase());

  const userCity = answers.profile_4;
  const prefersSameCity = (answers.preferences_5 || "")
    .toLowerCase()
    .includes("yes");

  const minEducation = answers.preferences_4?.toLowerCase();
  const educationLevels = [
    "ssc",
    "hsc",
    "diploma",
    "bachelor's",
    "master's",
    "phd",
  ];

  const professionPreferences = (answers.preferences_2 || "")
    .split(",")
    .map((p) => p.trim().toLowerCase());

  // Build the complete pipeline
  return [
    // Stage 1: Apply HARD FILTERS
    { $match: matchCriteria },

    // Stage 2: Add fields for scoring calculations
    {
      $addFields: {
        // Personality trait similarity scores
        personalityScores: {
          openness: {
            $abs: {
              $subtract: [
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$personalityQuiz.answers.personality_1",
                              "3:neutral",
                            ],
                          },
                          ":",
                        ],
                      },
                      0,
                    ],
                  },
                },
                parseInt(answers.personality_1?.split(":")[0] || 3),
              ],
            },
          },
          conscientiousness: {
            $abs: {
              $subtract: [
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$personalityQuiz.answers.personality_2",
                              "3:neutral",
                            ],
                          },
                          ":",
                        ],
                      },
                      0,
                    ],
                  },
                },
                parseInt(answers.personality_2?.split(":")[0] || 3),
              ],
            },
          },
          extraversion: {
            $abs: {
              $subtract: [
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$personalityQuiz.answers.personality_3",
                              "3:neutral",
                            ],
                          },
                          ":",
                        ],
                      },
                      0,
                    ],
                  },
                },
                parseInt(answers.personality_3?.split(":")[0] || 3),
              ],
            },
          },
          agreeableness: {
            $abs: {
              $subtract: [
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$personalityQuiz.answers.personality_4",
                              "3:neutral",
                            ],
                          },
                          ":",
                        ],
                      },
                      0,
                    ],
                  },
                },
                parseInt(answers.personality_4?.split(":")[0] || 3),
              ],
            },
          },
          neuroticism: {
            $abs: {
              $subtract: [
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$personalityQuiz.answers.personality_5",
                              "3:neutral",
                            ],
                          },
                          ":",
                        ],
                      },
                      0,
                    ],
                  },
                },
                parseInt(answers.personality_5?.split(":")[0] || 3),
              ],
            },
          },
        },

        // Attachment style scores
        attachmentScores: {
          secure: {
            $abs: {
              $subtract: [
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$personalityQuiz.answers.personality_7",
                              "3:neutral",
                            ],
                          },
                          ":",
                        ],
                      },
                      0,
                    ],
                  },
                },
                parseInt(answers.personality_7?.split(":")[0] || 3),
              ],
            },
          },
          anxious: {
            $abs: {
              $subtract: [
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$personalityQuiz.answers.personality_6",
                              "3:neutral",
                            ],
                          },
                          ":",
                        ],
                      },
                      0,
                    ],
                  },
                },
                parseInt(answers.personality_6?.split(":")[0] || 3),
              ],
            },
          },
        },

        // Hobbies matching using Jaccard similarity
        hobbiesScore: {
          $let: {
            vars: {
              candidateHobbies: {
                $map: {
                  input: {
                    $split: [
                      { $ifNull: ["$personalityQuiz.answers.profile_12", ""] },
                      ",",
                    ],
                  },
                  as: "hobby",
                  in: { $trim: { input: { $toLower: "$$hobby" } } },
                },
              },
              userHobbiesArray: userHobbies,
            },
            in: {
              $cond: {
                if: {
                  $and: [
                    { $gt: [{ $size: "$$userHobbiesArray" }, 0] },
                    { $gt: [{ $size: "$$candidateHobbies" }, 0] },
                  ],
                },
                then: {
                  $divide: [
                    {
                      $size: {
                        $setIntersection: [
                          "$$candidateHobbies",
                          "$$userHobbiesArray",
                        ],
                      },
                    },
                    {
                      $max: [
                        1,
                        {
                          $size: {
                            $setUnion: [
                              "$$candidateHobbies",
                              "$$userHobbiesArray",
                            ],
                          },
                        },
                      ],
                    },
                  ],
                },
                else: 0,
              },
            },
          },
        },

        // Education score
        educationScore: {
          $cond: {
            if: {
              $and: [
                { $ne: [minEducation, null] },
                { $ne: [minEducation, ""] },
                {
                  $in: [
                    {
                      $toLower: {
                        $ifNull: ["$personalityQuiz.answers.profile_7", ""],
                      },
                    },
                    educationLevels.slice(
                      educationLevels.indexOf(minEducation)
                    ),
                  ],
                },
              ],
            },
            then: 1,
            else: 0.5,
          },
        },

        // City score
        cityScore: {
          $cond: {
            if: {
              $or: [
                { $eq: [prefersSameCity, false] },
                { $eq: ["$personalityQuiz.answers.profile_4", userCity] },
              ],
            },
            then: 1,
            else: 0.7,
          },
        },

        // Profession score
        professionScore: {
          $cond: {
            if: {
              $or: professionPreferences.map((prof) => ({
                $regexMatch: {
                  input: {
                    $ifNull: ["$personalityQuiz.answers.profile_5", ""],
                  },
                  regex: prof,
                  options: "i",
                },
              })),
            },
            then: 1,
            else: 0.6,
          },
        },
      },
    },

    // Stage 3: Calculate aggregate scores
    {
      $addFields: {
        // Personality match score (40% weight)
        personalityMatchScore: {
          $subtract: [
            1,
            {
              $divide: [
                {
                  $add: [
                    "$personalityScores.openness",
                    "$personalityScores.conscientiousness",
                    "$personalityScores.extraversion",
                    "$personalityScores.agreeableness",
                    "$personalityScores.neuroticism",
                  ],
                },
                20, // Normalize to 0-1 range (5 traits × 4 max difference)
              ],
            },
          ],
        },

        // Attachment match score (20% weight)
        attachmentMatchScore: {
          $subtract: [
            1,
            {
              $divide: [
                {
                  $add: [
                    "$attachmentScores.secure",
                    "$attachmentScores.anxious",
                  ],
                },
                8, // Normalize to 0-1 range (2 traits × 4 max difference)
              ],
            },
          ],
        },

        // Full match bonus (10% if all criteria met)
        fullMatchBonus: {
          $cond: {
            if: {
              $and: [
                { $eq: ["$educationScore", 1] },
                { $eq: ["$cityScore", 1] },
                { $eq: ["$professionScore", 1] },
                { $gte: ["$personalityMatchScore", 0.9] },
                { $gte: ["$attachmentMatchScore", 0.9] },
                { $gte: ["$hobbiesScore", 0.8] },
              ],
            },
            then: 0.1,
            else: 0,
          },
        },
      },
    },

    // Stage 4: Calculate total score with correct weights
    {
      $project: {
        personalityQuiz: 1,
        email: 1,
        name: 1,
        gender: 1,
        preliminaryScore: {
          $add: [
            { $multiply: ["$personalityMatchScore", 0.4] }, // Personality: 40%
            { $multiply: ["$attachmentMatchScore", 0.2] }, // Attachment: 20%
            { $multiply: ["$hobbiesScore", 0.15] }, // Hobbies: 15%
            { $multiply: ["$educationScore", 0.1] }, // Education: 10%
            { $multiply: ["$cityScore", 0.075] }, // City: 7.5%
            { $multiply: ["$professionScore", 0.075] }, // Profession: 7.5%
            "$fullMatchBonus", // Bonus: 10% if all criteria met
          ],
        },
        matchDetails: {
          personalityScore: { $multiply: ["$personalityMatchScore", 100] },
          attachmentScore: { $multiply: ["$attachmentMatchScore", 100] },
          hobbiesScore: { $multiply: ["$hobbiesScore", 100] },
          educationScore: { $multiply: ["$educationScore", 100] },
          cityScore: { $multiply: ["$cityScore", 100] },
          professionScore: { $multiply: ["$professionScore", 100] },
          fullMatchBonus: { $multiply: ["$fullMatchBonus", 100] },
          // Add raw scores for verification
          rawPersonalityScores: "$personalityScores",
          rawAttachmentScores: "$attachmentScores",
        },
      },
    },

    // Stage 5: Sort by score (descending)
    { $sort: { preliminaryScore: -1 } },

    // Stage 6: Limit to top 20
    { $limit: 20 },
  ];
}

// Function to create a fallback pipeline when no matches are found
function buildFallbackPipeline(currentUser) {
  console.log("Building fallback pipeline...");

  // Extract personality traits for matching
  const answers = currentUser.personalityQuiz?.answers || {};
  const openness = parseInt(answers.personality_1?.split(":")[0] || 3);
  const extraversion = parseInt(answers.personality_3?.split(":")[0] || 3);

  return [
    {
      $match: {
        "personalityQuiz.completed": true,
        _id: { $ne: currentUser._id },
      },
    },
    // Apply same scoring system but without hard filters
    {
      $addFields: {
        // Simple score for fallback (personality-based)
        fallbackScore: {
          $subtract: [
            1,
            {
              $divide: [
                {
                  $add: [
                    // Basic openness difference
                    {
                      $abs: {
                        $subtract: [
                          openness,
                          {
                            $toInt: {
                              $arrayElemAt: [
                                {
                                  $split: [
                                    "$personalityQuiz.answers.personality_1",
                                    ":",
                                  ],
                                },
                                0,
                              ],
                            },
                          },
                        ],
                      },
                    },
                    // Basic extraversion difference
                    {
                      $abs: {
                        $subtract: [
                          extraversion,
                          {
                            $toInt: {
                              $arrayElemAt: [
                                {
                                  $split: [
                                    "$personalityQuiz.answers.personality_3",
                                    ":",
                                  ],
                                },
                                0,
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
                8, // Simple normalization
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        personalityQuiz: 1,
        email: 1,
        name: 1,
        gender: 1,
        preliminaryScore: "$fallbackScore",
        matchDetails: {
          personalityScore: { $multiply: ["$fallbackScore", 100] },
          note: "Fallback match with relaxed criteria",
        },
      },
    },
    { $sort: { preliminaryScore: -1 } },
    { $limit: 5 }, // Just get top 5 for fallback
  ];
}

// Function to verify if a match meets the hard filter requirements
function verifyHardFilters(currentUser, match) {
  const userAnswers = currentUser.personalityQuiz?.answers || {};
  const matchAnswers = match.personalityQuiz?.answers || {};

  // 1. Verify opposite gender
  const userGender = userAnswers.profile_2 || currentUser.gender;
  const matchGender = matchAnswers.profile_2 || match.gender;
  const oppositeGender = userGender === "male" ? "female" : "male";
  const genderMatch = matchGender === oppositeGender;

  // 2. Verify religion match
  const userReligion = userAnswers.profile_8;
  const matchReligion = matchAnswers.profile_8;
  const religionMatch = userReligion === matchReligion;

  // 3. Verify marital status compatibility
  const userMarital = userAnswers.profile_9;
  const matchMarital = matchAnswers.profile_9;
  const maritalMatch =
    (userMarital === "single" && matchMarital === "single") ||
    (userMarital !== "single" && matchMarital !== "single");

  return {
    meetsAllCriteria: genderMatch && religionMatch && maritalMatch,
    details: {
      genderMatch,
      religionMatch,
      maritalMatch,
    },
  };
}

// Function to analyze match scoring
function analyzeMatchScoring(currentUser, match) {
  console.log(
    `\n=== ANALYZING MATCH: ${match.name || "Unknown"} (${match._id}) ===`
  );

  // Extract score details
  const score = match.preliminaryScore;
  const details = match.matchDetails;

  console.log(`Overall Score: ${(score * 100).toFixed(2)}%`);

  // Verify hard filters
  const filterCheck = verifyHardFilters(currentUser, match);
  console.log(
    `Hard Filters: ${filterCheck.meetsAllCriteria ? "PASS ✓" : "FAIL ✗"}`
  );
  if (!filterCheck.meetsAllCriteria) {
    console.log(
      `- Gender: ${filterCheck.details.genderMatch ? "PASS ✓" : "FAIL ✗"}`
    );
    console.log(
      `- Religion: ${filterCheck.details.religionMatch ? "PASS ✓" : "FAIL ✗"}`
    );
    console.log(
      `- Marital: ${filterCheck.details.maritalMatch ? "PASS ✓" : "FAIL ✗"}`
    );
  }

  // Print score components
  console.log(`\nScore Components:`);
  console.log(
    `- Personality Score: ${details.personalityScore.toFixed(2)}% (Weight: 40%)`
  );
  console.log(
    `- Attachment Score: ${details.attachmentScore.toFixed(2)}% (Weight: 20%)`
  );
  console.log(
    `- Hobbies Score: ${details.hobbiesScore.toFixed(2)}% (Weight: 15%)`
  );
  console.log(
    `- Education Score: ${details.educationScore.toFixed(2)}% (Weight: 10%)`
  );
  console.log(`- City Score: ${details.cityScore.toFixed(2)}% (Weight: 7.5%)`);
  console.log(
    `- Profession Score: ${details.professionScore.toFixed(2)}% (Weight: 7.5%)`
  );

  // Check for bonus
  if (details.fullMatchBonus > 0) {
    console.log(`- Full Match Bonus: ${details.fullMatchBonus.toFixed(2)}%`);
  }

  // Log raw score components if available
  if (details.rawPersonalityScores) {
    console.log(`\nRaw Personality Differences:`);
    console.log(`- Openness: ${details.rawPersonalityScores.openness}`);
    console.log(
      `- Conscientiousness: ${details.rawPersonalityScores.conscientiousness}`
    );
    console.log(`- Extraversion: ${details.rawPersonalityScores.extraversion}`);
    console.log(
      `- Agreeableness: ${details.rawPersonalityScores.agreeableness}`
    );
    console.log(`- Neuroticism: ${details.rawPersonalityScores.neuroticism}`);
  }

  if (details.rawAttachmentScores) {
    console.log(`\nRaw Attachment Differences:`);
    console.log(`- Secure: ${details.rawAttachmentScores.secure}`);
    console.log(`- Anxious: ${details.rawAttachmentScores.anxious}`);
  }

  return filterCheck.meetsAllCriteria;
}

// Main execution function
async function testMongoDbPipeline() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db();
    const usersCollection = database.collection(USERS_COLLECTION);

    // Get the total count of users with completed quiz
    const totalUsers = await usersCollection.countDocuments({
      "personalityQuiz.completed": true,
    });

    console.log(`\nTotal users with completed quiz: ${totalUsers}`);

    // Build the pipeline with our test user
    const allUserIds = [testUser._id, ...excludedUserIds];
    const pipeline = buildMatchingPipeline(testUser, allUserIds);

    // Execute the pipeline
    console.log("\nExecuting matching pipeline...");
    const matches = await usersCollection.aggregate(pipeline).toArray();

    console.log(`\nFound ${matches.length} matches for user ${testUser.name}`);

    if (matches.length === 0) {
      console.log("\nNo matches found, using fallback pipeline");
      const fallbackPipeline = buildFallbackPipeline(testUser);
      const fallbackMatches = await usersCollection
        .aggregate(fallbackPipeline)
        .toArray();

      console.log(`Found ${fallbackMatches.length} fallback matches`);

      if (fallbackMatches.length > 0) {
        console.log("\n=== FALLBACK MATCHES ===");
        fallbackMatches.forEach((match, index) => {
          console.log(
            `\n#${index + 1} - ${match.name || "Unknown"} (Score: ${(
              match.preliminaryScore * 100
            ).toFixed(2)}%)`
          );
          console.log(
            `Gender: ${
              match.personalityQuiz?.answers?.profile_2 ||
              match.gender ||
              "Unknown"
            }`
          );
          console.log(`Email: ${match.email || "Unknown"}`);
          if (match.matchDetails?.note) {
            console.log(`Note: ${match.matchDetails.note}`);
          }
        });
      }
    } else {
      // Analyze match results
      console.log("\n=== MATCH QUALITY VERIFICATION ===");

      // Verify each match meets hard filter requirements
      let hardFilterFailures = 0;

      matches.forEach((match, index) => {
        console.log(`\n----- MATCH #${index + 1} -----`);
        console.log(`Name: ${match.name || "Unknown"}`);
        console.log(`Email: ${match.email || "Unknown"}`);
        console.log(
          `Gender: ${
            match.personalityQuiz?.answers?.profile_2 ||
            match.gender ||
            "Unknown"
          }`
        );
        console.log(
          `Religion: ${match.personalityQuiz?.answers?.profile_8 || "Unknown"}`
        );
        console.log(
          `Marital Status: ${
            match.personalityQuiz?.answers?.profile_9 || "Unknown"
          }`
        );

        // Detailed analysis
        const passesFilters = analyzeMatchScoring(testUser, match);
        if (!passesFilters) {
          hardFilterFailures++;
        }
      });

      // Final summary
      console.log("\n=== SUMMARY ===");
      console.log(`Total matches: ${matches.length}`);
      console.log(`Matches failing hard filters: ${hardFilterFailures}`);
      console.log(
        `Success rate: ${(
          ((matches.length - hardFilterFailures) / matches.length) *
          100
        ).toFixed(2)}%`
      );

      // Score distribution
      const scores = matches.map((m) => m.preliminaryScore);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      console.log(`\nScore distribution:`);
      console.log(`- Average: ${(avgScore * 100).toFixed(2)}%`);
      console.log(`- Maximum: ${(maxScore * 100).toFixed(2)}%`);
      console.log(`- Minimum: ${(minScore * 100).toFixed(2)}%`);

      // Check if matches are properly sorted
      let sortingIssues = 0;
      for (let i = 1; i < matches.length; i++) {
        if (matches[i - 1].preliminaryScore < matches[i].preliminaryScore) {
          sortingIssues++;
        }
      }

      console.log(`\nSort order issues: ${sortingIssues}`);
      if (sortingIssues === 0) {
        console.log("✓ Matches are correctly sorted by score");
      } else {
        console.log(
          "✗ Matches are NOT correctly sorted by score - needs investigation"
        );
      }
    }
  } catch (error) {
    console.error("Error testing pipeline:", error);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run the test
console.log("===== TESTING MONGODB MATCHING PIPELINE =====");
testMongoDbPipeline().catch(console.error);

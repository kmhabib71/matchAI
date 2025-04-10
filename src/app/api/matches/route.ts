import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  calculateCompatibilityScore,
  findTop5Soulmates,
  getPersonalityTraits,
} from "@/lib/ai/matchingAlgorithm";
import { analyzeTopMatches } from "@/lib/ai/openai";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

// Helper function to get user from token
async function getUserFromToken(req: NextRequest) {
  const token =
    req.cookies.get("authToken")?.value ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    // Use the same secret key as the one used for token generation
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

    // Try to verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      email?: string;
    };
    console.log("decodedd is: ", decoded);
    // Check if we have a valid user ID
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      console.log("No user ID found in token");
      return null;
    }

    // Find the user in the database
    await dbConnect();
    const user = await User.findById(userId);
    console.log("userr is: ", user);
    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return null;
    }
    console.log("user is: ", user);
    return user;
  } catch (error) {
    console.error("Token verification error:", error);
    // Don't throw, just return null to indicate authentication failed
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for authentication
    const session = await getServerSession(authOptions);

    // Get current user
    let currentUser = null;
    if (!session?.user) {
      currentUser = await getUserFromToken(request);

      if (!currentUser) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    } else {
      // Connect to database
      await dbConnect();

      // Get User model
      currentUser = await User.findOne({ email: session.user.email });

      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Check if quiz is completed for authenticated users
    if (session && currentUser && !currentUser.personalityQuiz?.completed) {
      return NextResponse.json(
        { error: "Please complete the personality quiz" },
        { status: 403 }
      );
    }

    // Get the previously matched users from the user's previousMatches array
    const previouslyMatchedUserIds = (currentUser.previousMatches || []).map(
      (match: any) => match.userId?.toString() || ""
    );

    // Get viewed matches from query params (for non-authenticated users)
    const searchParams = request.nextUrl.searchParams;
    const viewedParam = searchParams.get("viewed");
    let viewedMatches: string[] = [];

    if (viewedParam) {
      try {
        viewedMatches = JSON.parse(viewedParam);
      } catch (e) {
        console.error("Invalid viewed matches parameter", e);
      }
    }

    // Add the current user's ID to the exclusion list
    const currentUserId = currentUser._id?.toString();
    const excludedUserIds = [
      ...(currentUserId ? [currentUserId] : []),
      ...previouslyMatchedUserIds,
      ...viewedMatches,
    ].filter((id) => id); // Filter out empty strings

    console.log("Current user ID for exclusion:", currentUserId);
    console.log("Total excluded IDs:", excludedUserIds.length);

    // Get query parameters
    const specificUserId = searchParams.get("userId");
    const refresh = searchParams.get("refresh") === "true";
    const listMode = searchParams.get("list") === "true";
    const fromQuiz = searchParams.get("fromQuiz") === "true";

    // Check if we should count this as a new match view
    const shouldCountView = refresh || fromQuiz || listMode;

    // If we're in list mode, return all potential matches using the 3-step algorithm
    if (listMode) {
      // Ensure database connection
      await dbConnect();

      // Log current user information to verify the source data
      console.log("\n=== CURRENT USER DATA ANALYSIS ===");
      console.log(`User ID: ${currentUser._id}`);
      console.log(`User Email: ${currentUser.email}`);
      console.log(`User Name: ${currentUser.name}`);
      console.log(`User Gender (object field): ${currentUser.gender}`);
      console.log(
        `User Gender from Quiz (profile_2): ${currentUser.personalityQuiz?.answers?.profile_2}`
      );
      console.log(
        `User Religion (profile_8): ${currentUser.personalityQuiz?.answers?.profile_8}`
      );
      console.log(
        `User Marital Status (profile_9): ${currentUser.personalityQuiz?.answers?.profile_9}`
      );

      // CRITICAL FIX: If key user data is missing, we need to skip those filters
      // If the user's quiz gender is undefined, use the user.gender field instead
      if (
        !currentUser.personalityQuiz?.answers?.profile_2 &&
        currentUser.gender
      ) {
        console.log(
          `FIXING: Adding missing quiz gender from user object: ${currentUser.gender}`
        );
        if (!currentUser.personalityQuiz) {
          currentUser.personalityQuiz = { answers: {}, completed: true };
        }
        if (!currentUser.personalityQuiz.answers) {
          currentUser.personalityQuiz.answers = {};
        }
        currentUser.personalityQuiz.answers.profile_2 = currentUser.gender;
      }

      // Now verify the gender is set
      const userGender =
        currentUser.personalityQuiz?.answers?.profile_2 || currentUser.gender;
      if (!userGender) {
        console.error(
          "ERROR: Cannot determine user gender. Both profile_2 and user.gender are undefined."
        );
        return NextResponse.json(
          { error: "User gender not specified. Please complete your profile." },
          { status: 400 }
        );
      }

      // For this demo, if religion is undefined, set it to a default value for testing
      if (!currentUser.personalityQuiz?.answers?.profile_8) {
        console.log(
          "FIXING: Adding default religion 'islam' for testing purposes"
        );
        // Ensure personalityQuiz exists
        if (!currentUser.personalityQuiz) {
          currentUser.personalityQuiz = { answers: {}, completed: true };
        }
        // Ensure answers object exists
        if (!currentUser.personalityQuiz.answers) {
          currentUser.personalityQuiz.answers = {};
        }
        currentUser.personalityQuiz.answers.profile_8 = "islam";
      }

      // For this demo, if marital status is undefined, set it to a default value for testing
      if (!currentUser.personalityQuiz?.answers?.profile_9) {
        console.log(
          "FIXING: Adding default marital status 'single' for testing purposes"
        );
        // Ensure personalityQuiz exists
        if (!currentUser.personalityQuiz) {
          currentUser.personalityQuiz = { answers: {}, completed: true };
        }
        // Ensure answers object exists
        if (!currentUser.personalityQuiz.answers) {
          currentUser.personalityQuiz.answers = {};
        }
        currentUser.personalityQuiz.answers.profile_9 = "single";
      }

      // STEP 1: MongoDB Query - Get top 20 candidates based on essential criteria
      const currentUserAnswers = currentUser.personalityQuiz?.answers || {};
      console.log("currentUserAnswers is: ", currentUserAnswers);
      // Build the MongoDB aggregation pipeline
      const aggregationPipeline = buildMatchingPipeline(
        currentUser,
        excludedUserIds
      );
      console.log("aggregationPipeline is: ", aggregationPipeline);
      // Execute the query to get top 20 candidates
      let candidateMatches = await User.aggregate(aggregationPipeline as any);
      console.log(
        "candidateMatches is: ",
        JSON.stringify(candidateMatches, null, 2)
      );
      console.log("candidateMatches length is: ", candidateMatches.length);

      // Add minimum match fallback after candidateMatches aggregation
      if (candidateMatches.length === 0) {
        console.log(
          "No matches found with hard filters. Using fallback query..."
        );

        // Extract personality traits for fallback matching
        const currentUserTraits = getPersonalityTraits(
          currentUser.personalityQuiz?.answers || {}
        );

        // Fallback to get at least one match by only requiring quiz completion
        candidateMatches = await User.aggregate([
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
                                currentUserTraits.openness,
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
                                currentUserTraits.extraversion,
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
        ]);

        console.log("Fallback found:", candidateMatches.length, "users");
      }

      // For debugging only, return the raw matches without further processing
      console.log("Returning", candidateMatches.length, "potential matches");

      // Log detailed information about each match to verify the data being used
      candidateMatches.forEach((match, index) => {
        console.log(`\n--- MATCH #${index + 1} DETAILS ---`);
        console.log(`User ID: ${match._id}`);
        console.log(`Name: ${match.name}`);
        console.log(`Email: ${match.email}`);

        // CRITICAL CHECK - Gender verification
        console.log(`Gender in user object: ${match.gender}`);
        const matchGender = match.personalityQuiz?.answers?.profile_2;
        console.log(`Gender in quiz answers: ${matchGender}`);

        // Compare with current user's gender to verify opposite matching
        const currentUserGender =
          currentUser.personalityQuiz?.answers?.profile_2 || currentUser.gender;
        console.log(`Current user gender: ${currentUserGender}`);

        // Verify correct gender matching
        const isOppositeGender =
          (currentUserGender === "male" && matchGender === "female") ||
          (currentUserGender === "female" && matchGender === "male");
        console.log(
          `✓ Opposite gender match: ${
            isOppositeGender ? "YES ✓" : "NO - ERROR! ✗"
          }`
        );

        // Verify religion match
        const currentUserReligion =
          currentUser.personalityQuiz?.answers?.profile_8;
        console.log(
          `Religion (current/match): ${currentUserReligion}/${match.personalityQuiz?.answers?.profile_8}`
        );
        const isReligionMatch =
          currentUserReligion === match.personalityQuiz?.answers?.profile_8;
        console.log(
          `✓ Same religion: ${isReligionMatch ? "YES ✓" : "NO - ERROR! ✗"}`
        );

        // Verify marital status compatibility
        const currentUserMarital =
          currentUser.personalityQuiz?.answers?.profile_9;
        console.log(
          `Marital status (current/match): ${currentUserMarital}/${match.personalityQuiz?.answers?.profile_9}`
        );
        const isMaritalMatch =
          (currentUserMarital === "single" &&
            match.personalityQuiz?.answers?.profile_9 === "single") ||
          (currentUserMarital !== "single" &&
            match.personalityQuiz?.answers?.profile_9 !== "single");
        console.log(
          `✓ Compatible marital status: ${
            isMaritalMatch ? "YES ✓" : "NO - ERROR! ✗"
          }`
        );

        // Log score details
        console.log("Match score:", match.preliminaryScore);
        if (match.matchDetails) {
          console.log(
            "Score details:",
            JSON.stringify(match.matchDetails, null, 2)
          );
        }

        console.log("----------------------\n");
      });

      return NextResponse.json({
        matches: candidateMatches,
        total: candidateMatches.length,
      });

      // STEP 2: Refine with TypeScript algorithm to get top 5
      // Extract necessary information and calculate detailed compatibility scores
      const top5Candidates = findTop5Soulmates(currentUser, candidateMatches);
      console.log("top5Candidates is: ", top5Candidates);
      // STEP 3: Use OpenAI to analyze and select top 3 matches with detailed reasons
      const candidatesWithFullData = await Promise.all(
        top5Candidates.map(async (score) => {
          const user = await User.findById(score.userId);
          return { user, score };
        })
      );
      console.log("candidatesWithFullData is: ", candidatesWithFullData);
      return NextResponse.json({
        matches: candidatesWithFullData,
        total: candidatesWithFullData.length,
      });
      const top3Matches = await analyzeTopMatches(
        currentUser,
        candidatesWithFullData.filter((item) => item.user) as any
      );

      // Return the matches
      return NextResponse.json({
        matches: top3Matches,
        total: top3Matches.length,
      });
    }

    // If specifying a single user match
    if (specificUserId) {
      await dbConnect();
      const specificUser = await User.findById(specificUserId);

      if (!specificUser) {
        return NextResponse.json(
          { error: "Specified user not found" },
          { status: 404 }
        );
      }

      // Calculate compatibility score
      const score = calculateCompatibilityScore(currentUser, specificUser);

      // Generate explanation for this specific match
      const matchResult = await analyzeTopMatches(currentUser, [
        { user: specificUser, score },
      ]);

      return NextResponse.json({
        match: matchResult[0],
      });
    }

    // If we reach here, no valid mode was specified
    return NextResponse.json(
      { error: "Invalid request - specify list=true or userId parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in match API:", error);
    return NextResponse.json(
      { error: "Server error processing matches" },
      { status: 500 }
    );
  }
}

// Helper function to build the MongoDB aggregation pipeline for matching
function buildMatchingPipeline(currentUser: any, excludedUserIds: string[]) {
  // Extract all required data from current user
  const answers = currentUser.personalityQuiz?.answers || {};

  // ================== EXTRACT USER DATA ==================
  // CRITICAL: These are the key fields used for hard filters
  const userGender = answers.profile_2 || currentUser.gender;
  const userReligion = answers.profile_8;
  const userMaritalStatus = answers.profile_9;

  console.log("\n=== BUILDING MATCHING PIPELINE ===");
  console.log(`Current user gender: ${userGender}`);
  console.log(`Current user religion: ${userReligion}`);
  console.log(`Current user marital status: ${userMaritalStatus}`);

  // Convert string IDs to ObjectIds for proper comparison
  const objectIds = excludedUserIds.map((id) => {
    try {
      if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
        return new ObjectId(id);
      }
      return id;
    } catch (e) {
      return id;
    }
  });

  // ================== BUILD HARD FILTERS ==================
  // These are MANDATORY and will be strictly enforced

  const matchCriteria: any = {
    // Basic requirement: Must have completed quiz
    "personalityQuiz.completed": true,

    // Exclude current user and previously viewed users
    _id: { $nin: objectIds },
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
    // No point continuing without gender
    return [];
  }

  // 2. EXACT RELIGION MATCH (MANDATORY)
  if (userReligion) {
    matchCriteria["personalityQuiz.answers.profile_8"] = userReligion;
    console.log(`HARD FILTER: Religion must exactly match ${userReligion}`);
  } else {
    console.warn(
      "WARNING: User religion not specified, this filter will be skipped"
    );
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
      // Non-singles (divorced/widowed) match with other non-singles
      matchCriteria["personalityQuiz.answers.profile_9"] = { $ne: "single" };
      console.log(
        `HARD FILTER: Must be non-single (because current user is ${userMaritalStatus})`
      );
    }
  } else {
    console.warn(
      "WARNING: User marital status not specified, this filter will be skipped"
    );
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
  // Now we'll build the pipeline for sorting and scoring matches

  // Extract additional data needed for scoring
  const userHobbies = (answers.profile_12 || "")
    .split(",")
    .map((h: string) => h.trim().toLowerCase());

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
    .map((p: string) => p.trim().toLowerCase());

  // Build the complete pipeline
  return [
    // Stage 1: Apply HARD FILTERS (gender, religion, marital status, age)
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
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$$ROOT.personalityQuiz.answers.personality_1",
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
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$$ROOT.personalityQuiz.answers.personality_2",
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
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$$ROOT.personalityQuiz.answers.personality_3",
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
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$$ROOT.personalityQuiz.answers.personality_4",
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
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$$ROOT.personalityQuiz.answers.personality_5",
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
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$$ROOT.personalityQuiz.answers.personality_7",
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
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: [
                          {
                            $ifNull: [
                              "$$ROOT.personalityQuiz.answers.personality_6",
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
              userHobbiesArray: userHobbies, // Pass the array directly as a variable
            },
            in: {
              $cond: {
                if: {
                  $and: [
                    { $gt: [{ $size: "$$userHobbiesArray" }, 0] }, // Now using the variable
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
                    }, // Use the variable
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
                    }, // Use the variable
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
              $or: professionPreferences.map((prof: string) => ({
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
            "$fullMatchBonus", // Bonus: 10%
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
        },
      },
    },

    // Stage 5: Sort by score (descending)
    { $sort: { preliminaryScore: -1 } },

    // Stage 6: Limit to top 20
    { $limit: 20 },
  ];
}

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
    const excludedUserIds = [
      currentUser._id.toString(),
      ...previouslyMatchedUserIds,
      ...viewedMatches,
    ].filter((id) => id); // Filter out empty strings

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

      // STEP 1: MongoDB Query - Get top 20 candidates based on essential criteria
      const currentUserAnswers = currentUser.personalityQuiz?.answers || {};

      // Build the MongoDB aggregation pipeline
      const aggregationPipeline = buildMatchingPipeline(
        currentUser,
        excludedUserIds
      );

      // Execute the query to get top 20 candidates
      let candidateMatches = await User.aggregate(aggregationPipeline);

      // Add minimum match fallback after candidateMatches aggregation
      if (candidateMatches.length === 0) {
        // Fallback to get at least one match if no matches meet the criteria
        candidateMatches = await User.aggregate([
          {
            $match: {
              "personalityQuiz.completed": true,
              _id: { $ne: currentUser._id },
            },
          },
          { $limit: 1 },
        ]);
      }

      // STEP 2: Refine with TypeScript algorithm to get top 5
      // Extract necessary information and calculate detailed compatibility scores
      const top5Candidates = findTop5Soulmates(currentUser, candidateMatches);

      // STEP 3: Use OpenAI to analyze and select top 3 matches with detailed reasons
      const candidatesWithFullData = await Promise.all(
        top5Candidates.map(async (score) => {
          const user = await User.findById(score.userId);
          return { user, score };
        })
      );

      const top3Matches = await analyzeTopMatches(
        currentUser,
        candidatesWithFullData.filter((item) => item.user) // Filter out any null users
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
  const currentUserAnswers = currentUser.personalityQuiz?.answers || {};

  // Extract key demographic preferences
  const userGender = currentUserAnswers.profile_2 || ""; // e.g., "male" or "female"
  const oppositeGender = userGender === "male" ? "female" : "male";
  const userReligion = currentUserAnswers.profile_8 || ""; // e.g., "islam"
  const userMaritalStatus = currentUserAnswers.profile_9 || ""; // e.g., "single"

  // Extract personality traits for scoring
  const userPersonalityTraits = {
    openness: parseInt(currentUserAnswers.personality_1?.split(":")[0] || "3"),
    conscientiousness: parseInt(
      currentUserAnswers.personality_2?.split(":")[0] || "3"
    ),
    extraversion: parseInt(
      currentUserAnswers.personality_3?.split(":")[0] || "3"
    ),
    agreeableness: parseInt(
      currentUserAnswers.personality_4?.split(":")[0] || "3"
    ),
    neuroticism: parseInt(
      currentUserAnswers.personality_5?.split(":")[0] || "3"
    ),
    secureAttachment: parseInt(
      currentUserAnswers.personality_7?.split(":")[0] || "3"
    ),
    anxiousAttachment: parseInt(
      currentUserAnswers.personality_6?.split(":")[0] || "3"
    ),
    values: {
      family: parseInt(currentUserAnswers.personality_9?.split(":")[0] || "3"),
      career: parseInt(currentUserAnswers.personality_10?.split(":")[0] || "3"),
      adventure: parseInt(
        currentUserAnswers.personality_11?.split(":")[0] || "3"
      ),
      stability: parseInt(
        currentUserAnswers.personality_12?.split(":")[0] || "3"
      ),
    },
  };

  // Extract hobbies for matching
  const userHobbies = (currentUserAnswers.profile_12 || "")
    .split(",")
    .map((h: string) => h.trim().toLowerCase());

  // Extract education preferences
  const minEducation = currentUserAnswers.preferences_4?.toLowerCase() || "";
  const educationLevels = [
    "ssc",
    "hsc",
    "diploma",
    "bachelor's",
    "master's",
    "phd",
  ];
  const educationIndex = educationLevels.indexOf(minEducation);
  const acceptableEducation =
    educationIndex >= 0
      ? educationLevels.slice(educationIndex)
      : educationLevels;

  // Extract age preferences with flexibility
  const agePreference = currentUserAnswers.preferences_1 || "";
  const ageMatch = agePreference.match(/(\d+)-(\d+)/);
  const minAge = ageMatch ? parseInt(ageMatch[1], 10) : 18;
  const maxAge = ageMatch ? parseInt(ageMatch[2], 10) : 100;
  const currentYear = new Date().getFullYear();
  const minBirthYear = (currentYear - maxAge - 5).toString(); // Allow 5 years flexibility
  const maxBirthYear = (currentYear - minAge + 5).toString(); // Allow 5 years flexibility

  // City preference with flexibility
  const cityPreference = currentUserAnswers.preferences_5 || "";
  const userCity = currentUserAnswers.profile_4 || ""; // Now in English
  const prefersSameCity =
    cityPreference.toLowerCase().includes("same") ||
    cityPreference.toLowerCase().includes("হ্যাঁ");

  // Profession preferences
  const professionPreferences = (currentUserAnswers.preferences_2 || "")
    .split(",")
    .map((p: string) => p.trim().toLowerCase());

  // Build the pipeline
  return [
    // Stage 1: Match essential criteria
    {
      $match: {
        // Exclude current user and previously matched/viewed users
        _id: { $nin: excludedUserIds.map((id) => new RegExp(id, "i")) },

        // Must have completed personality quiz
        "personalityQuiz.completed": true,

        // Match gender (opposite gender)
        "personalityQuiz.answers.profile_2": oppositeGender,

        // Match religion (exact match required)
        "personalityQuiz.answers.profile_8": userReligion,

        // Match marital status appropriately
        ...(userMaritalStatus === "single"
          ? { "personalityQuiz.answers.profile_9": "single" }
          : { "personalityQuiz.answers.profile_9": { $ne: "single" } }),

        // Match birth year for age range (with flexibility)
        "personalityQuiz.answers.profile_3": {
          $gte: minBirthYear,
          $lte: maxBirthYear,
        },
      },
    },

    // Stage 2: Add fields for scoring
    {
      $addFields: {
        // Personality trait similarity scores
        personalityScores: {
          openness: {
            $abs: {
              $subtract: [
                userPersonalityTraits.openness,
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: ["$personalityQuiz.answers.personality_1", ":"],
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
                userPersonalityTraits.conscientiousness,
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: ["$personalityQuiz.answers.personality_2", ":"],
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
                userPersonalityTraits.extraversion,
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: ["$personalityQuiz.answers.personality_3", ":"],
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
                userPersonalityTraits.agreeableness,
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: ["$personalityQuiz.answers.personality_4", ":"],
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
                userPersonalityTraits.neuroticism,
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: ["$personalityQuiz.answers.personality_5", ":"],
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
                userPersonalityTraits.secureAttachment,
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: ["$personalityQuiz.answers.personality_7", ":"],
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
                userPersonalityTraits.anxiousAttachment,
                {
                  $toInt: {
                    $arrayElemAt: [
                      {
                        $split: ["$personalityQuiz.answers.personality_6", ":"],
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },

        // Hobbies matching score
        hobbiesScore: {
          $let: {
            vars: {
              candidateHobbies: {
                $map: {
                  input: {
                    $split: ["$personalityQuiz.answers.profile_12", ","],
                  },
                  as: "hobby",
                  in: { $trim: { input: { $toLower: "$$hobby" } } },
                },
              },
            },
            in: {
              $divide: [
                {
                  $size: {
                    $setIntersection: ["$$candidateHobbies", userHobbies],
                  },
                },
                {
                  $max: [
                    1,
                    {
                      $size: { $setUnion: ["$$candidateHobbies", userHobbies] },
                    },
                  ],
                },
              ],
            },
          },
        },

        // Education score - match if candidate meets minimum education requirement
        educationScore: {
          $cond: {
            if: {
              $in: ["$personalityQuiz.answers.profile_7", acceptableEducation],
            },
            then: 1,
            else: 0.5, // Reduced penalty for education mismatch
          },
        },

        // City score with personality override
        cityScore: {
          $cond: {
            if: {
              $and: [
                prefersSameCity,
                { $eq: ["$personalityQuiz.answers.profile_4", userCity] },
              ],
            },
            then: 1,
            else: {
              $cond: {
                if: {
                  $gt: [
                    {
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
                            20,
                          ],
                        },
                      ],
                    },
                    0.9, // 90% personality match threshold
                  ],
                },
                then: 1, // Full score if personality match > 90%
                else: 0.7, // Default score for different cities
              },
            },
          },
        },

        // Profession score - match if candidate's profession is in user's preferences
        professionScore: {
          $cond: {
            if: {
              $or: professionPreferences.map((prof: string) => ({
                $regexMatch: {
                  input: "$personalityQuiz.answers.profile_5",
                  regex: prof,
                  options: "i",
                },
              })),
            },
            then: 1,
            else: 0.6, // Reduced penalty for profession mismatch
          },
        },
      },
    },

    // Stage 3: Calculate preliminary score with personality emphasis
    {
      $addFields: {
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
                20, // Normalize to 0-1 range
              ],
            },
          ],
        },
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
                12, // Normalize to 0-1 range
              ],
            },
          ],
        },
        // Add full match bonus
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
            then: 0.1, // 10% bonus for full matches
            else: 0,
          },
        },
      },
    },

    // Stage 4: Project fields and calculate final preliminary score
    {
      $project: {
        personalityQuiz: 1,
        email: 1,
        name: 1,
        preliminaryScore: {
          $add: [
            { $multiply: ["$personalityMatchScore", 0.4] }, // Personality weight: 40%
            { $multiply: ["$attachmentMatchScore", 0.2] }, // Attachment weight: 20%
            { $multiply: ["$hobbiesScore", 0.15] }, // Hobbies weight: 15%
            { $multiply: ["$educationScore", 0.1] }, // Education weight: 10%
            { $multiply: ["$cityScore", 0.075] }, // City weight: 7.5%
            { $multiply: ["$professionScore", 0.075] }, // Profession weight: 7.5%
            "$fullMatchBonus", // Full match bonus: 10%
          ],
        },
      },
    },

    // Stage 5: Sort by preliminary score
    { $sort: { preliminaryScore: -1 } },

    // Stage 6: Limit to top 20 candidates
    { $limit: 20 },
  ];
}

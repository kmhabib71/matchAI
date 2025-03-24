import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  calculateCompatibilityScore,
  generateMatchExplanation,
  getPersonalityTraits,
} from "@/lib/ai/matchingAlgorithm";
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

    // Check if we have a valid user ID
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      console.log("No user ID found in token");
      return null;
    }

    // Find the user in the database
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return null;
    }

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
      ...new Set([
        ...previouslyMatchedUserIds,
        ...viewedMatches,
        currentUser._id?.toString() || "",
      ]),
    ];

    // Filter out empty strings
    const filteredExcludedIds = excludedUserIds.filter((id) => id);

    // Get query parameters
    const specificUserId = searchParams.get("userId");
    const refresh = searchParams.get("refresh") === "true";
    const listMode = searchParams.get("list") === "true";
    const fromQuiz = searchParams.get("fromQuiz") === "true";

    // Check if we should count this as a new match view
    const shouldCountView = refresh || fromQuiz || listMode;

    // If we're in list mode, return all potential matches
    if (listMode) {
      // Get a list of potential matches
      let matchQuery: any = { _id: { $nin: filteredExcludedIds } };
      const potentialMatches = await User.find(matchQuery).limit(20);

      if (!potentialMatches || potentialMatches.length === 0) {
        return NextResponse.json({
          matches: [],
          message: "No matches available",
        });
      }

      // Calculate compatibility scores
      const formattedMatches = potentialMatches.map((match) => {
        const score = calculateCompatibilityScore(currentUser, match);
        const explanation = generateMatchExplanation(
          score,
          match.personalityType || ""
        );

        // Extract personality traits
        const personalityTraits = match.personalityType
          ? getPersonalityTraits(match.personalityType)
          : ["thoughtful", "unique", "interesting"];

        // Find shared interests
        const sharedInterests = (currentUser.interests || []).filter(
          (interest) => (match.interests || []).includes(interest)
        );

        // Generate compatibility reasons
        const compatibilityReasons = [];
        if (sharedInterests.length > 0) {
          compatibilityReasons.push(
            `You share ${sharedInterests.length} interests`
          );
        }
        if (
          match.location?.city &&
          currentUser.location?.city &&
          match.location.city === currentUser.location.city
        ) {
          compatibilityReasons.push("You live in the same city");
        }
        if (match.personalityType && currentUser.personalityType) {
          compatibilityReasons.push("Your personality types are compatible");
        }

        return {
          _id: match._id,
          userId: match._id,
          name: match.name,
          age: match.age,
          gender: match.gender,
          orientation: match.orientation || "",
          location: match.location,
          bio: match.bio || "",
          profileImage: match.profileImage || "/avatars/default.jpg",
          personalityType: match.personalityType || "",
          interests: match.interests || [],
          relationshipGoals: match.relationshipGoals || [],
          compatibilityScore: score,
          explanation,
          matchDate: new Date().toISOString(),
          lastActive: "Recently",
          occupation: "",
          education: "",
          height: "",
          relationshipStatus: "Single",
          lookingFor: "",
          compatibilityReasons,
          sharedValues: sharedInterests,
          topTraits: personalityTraits.slice(0, 3),
        };
      });

      // Sort by compatibility score
      formattedMatches.sort(
        (a, b) => b.compatibilityScore - a.compatibilityScore
      );

      return NextResponse.json({ matches: formattedMatches });
    }

    // If a specific user is requested, return only that user
    if (specificUserId) {
      const specificUser = await User.findById(specificUserId);

      if (!specificUser) {
        return NextResponse.json(
          { error: "Requested user not found" },
          { status: 404 }
        );
      }

      // Calculate compatibility score
      const compatibilityScore = calculateCompatibilityScore(
        currentUser,
        specificUser
      );

      // Generate explanation
      const explanation = generateMatchExplanation(
        compatibilityScore,
        specificUser.personalityType || ""
      );

      // Extract personality traits
      const personalityTraits = specificUser.personalityType
        ? getPersonalityTraits(specificUser.personalityType)
        : ["thoughtful", "unique", "interesting"];

      // Find shared interests
      const sharedInterests = (currentUser.interests || []).filter((interest) =>
        (specificUser.interests || []).includes(interest)
      );

      // Generate compatibility reasons
      const compatibilityReasons = [];
      if (sharedInterests.length > 0) {
        compatibilityReasons.push(
          `You share ${sharedInterests.length} interests`
        );
      }
      if (
        specificUser.location?.city &&
        currentUser.location?.city &&
        specificUser.location.city === currentUser.location.city
      ) {
        compatibilityReasons.push("You live in the same city");
      }
      if (specificUser.personalityType && currentUser.personalityType) {
        compatibilityReasons.push("Your personality types are compatible");
      }

      // Create the match response
      const matchResponse = {
        match: {
          _id: specificUser._id,
          userId: specificUser._id,
          name: specificUser.name,
          age: specificUser.age,
          gender: specificUser.gender,
          orientation: specificUser.orientation || "",
          location: specificUser.location,
          bio: specificUser.bio || "",
          profileImage: specificUser.profileImage || "/avatars/default.jpg",
          personalityType: specificUser.personalityType || "",
          interests: specificUser.interests || [],
          relationshipGoals: specificUser.relationshipGoals || [],
          compatibilityScore,
          explanation,
          matchDate: new Date().toISOString(),
          lastActive: "Recently",
          occupation: "",
          education: "",
          height: "",
          relationshipStatus: "Single",
          lookingFor: "",
          compatibilityReasons,
          sharedValues: sharedInterests,
          topTraits: personalityTraits.slice(0, 3),
        },
      };

      // Add to previousMatches if authenticated, only requested with explicit refresh, and not already there
      if (session && currentUser && shouldCountView) {
        const specificUserId = specificUser._id?.toString() || "";

        if (
          specificUserId &&
          !previouslyMatchedUserIds.includes(specificUserId)
        ) {
          await User.findByIdAndUpdate(currentUser._id, {
            $push: {
              previousMatches: {
                userId: specificUser._id,
                compatibilityScore,
                explanation,
                viewedAt: new Date(),
              },
            },
            $inc: { "statistics.matchesViewed": 1 },
          });
        }
      }

      // Return the response
      return NextResponse.json(matchResponse);
    }

    // Find potentially matching users, excluding those already seen
    let matchQuery: any = {
      _id: { $nin: filteredExcludedIds },
    };

    // Find potentially matching users
    let potentialMatches = await User.find(matchQuery);

    if (!potentialMatches || potentialMatches.length === 0) {
      return NextResponse.json(
        {
          error: "No matches found",
          message:
            "No matches available at this time. Try adjusting your preferences or check back later.",
        },
        { status: 404 }
      );
    }

    // Calculate compatibility scores for each user
    const scoredMatches = potentialMatches.map((match) => {
      const score = calculateCompatibilityScore(currentUser, match);
      const explanation = generateMatchExplanation(
        score,
        match.personalityType || ""
      );

      // Extract personality traits
      const personalityTraits = match.personalityType
        ? getPersonalityTraits(match.personalityType)
        : ["thoughtful", "unique", "interesting"];

      // Find shared interests
      const sharedInterests = (currentUser.interests || []).filter((interest) =>
        (match.interests || []).includes(interest)
      );

      // Generate compatibility reasons
      const compatibilityReasons = [];
      if (sharedInterests.length > 0) {
        compatibilityReasons.push(
          `You share ${sharedInterests.length} interests`
        );
      }
      if (
        match.location?.city &&
        currentUser.location?.city &&
        match.location.city === currentUser.location.city
      ) {
        compatibilityReasons.push("You live in the same city");
      }
      if (match.personalityType && currentUser.personalityType) {
        compatibilityReasons.push("Your personality types are compatible");
      }

      return {
        score,
        explanation,
        personalityTraits,
        sharedInterests,
        compatibilityReasons,
        match,
      };
    });

    // Sort by compatibility score (highest first)
    scoredMatches.sort((a, b) => b.score - a.score);

    // Return the highest match by default
    const topMatch = scoredMatches[0];

    if (!topMatch) {
      return NextResponse.json({ error: "No matches found" }, { status: 404 });
    }

    // Create the match response
    const matchResponse = {
      match: {
        _id: topMatch.match._id,
        userId: topMatch.match._id,
        name: topMatch.match.name,
        age: topMatch.match.age,
        gender: topMatch.match.gender,
        orientation: topMatch.match.orientation || "",
        location: topMatch.match.location,
        bio: topMatch.match.bio || "",
        profileImage: topMatch.match.profileImage || "/avatars/default.jpg",
        personalityType: topMatch.match.personalityType || "",
        interests: topMatch.match.interests || [],
        relationshipGoals: topMatch.match.relationshipGoals || [],
        compatibilityScore: topMatch.score,
        explanation: topMatch.explanation,
        matchDate: new Date().toISOString(),
        lastActive: "Recently",
        occupation: "",
        education: "",
        height: "",
        relationshipStatus: "Single",
        lookingFor: "",
        compatibilityReasons: topMatch.compatibilityReasons,
        sharedValues: topMatch.sharedInterests,
        topTraits: topMatch.personalityTraits.slice(0, 3),
      },
    };

    // For authenticated users, store this match in their previousMatches array
    // Only if explicitly requested with refresh or fromQuiz parameters
    if (session && currentUser && shouldCountView) {
      const matchId = topMatch.match._id?.toString() || "";

      // Check if match already exists in previousMatches
      const matchExists = matchId && previouslyMatchedUserIds.includes(matchId);

      if (matchId && !matchExists) {
        // Add to previousMatches in database, but don't reset any existing ones
        await User.findByIdAndUpdate(currentUser._id, {
          $push: {
            previousMatches: {
              userId: topMatch.match._id,
              compatibilityScore: topMatch.score,
              explanation: topMatch.explanation,
              viewedAt: new Date(),
            },
          },
          $inc: { "statistics.matchesViewed": 1 },
        });
      }
    }

    return NextResponse.json(matchResponse);
  } catch (error) {
    console.error("Error in matches API:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

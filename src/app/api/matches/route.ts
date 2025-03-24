import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  calculateCompatibilityScore,
  generateMatchExplanation,
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

    // Get the previously matched users from the user's previousMatches array
    const previouslyMatchedUserIds = (currentUser.previousMatches || []).map(
      (match: any) => match.userId
    );

    // Add the current user's ID to the exclusion list
    const excludedUserIds = [...previouslyMatchedUserIds, currentUser._id];

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const specificUserId = searchParams.get("userId");
    const refresh = searchParams.get("refresh");
    const listMode = searchParams.get("list") === "true";

    // If we're in list mode, return all potential matches
    if (listMode) {
      // Get a list of potential matches
      let matchQuery: any = { _id: { $nin: excludedUserIds } };
      const potentialMatches = await User.find(matchQuery).limit(10); // Limit to 10 matches for performance

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

        return {
          _id: match._id,
          userId: match._id,
          name: match.name,
          age: match.age,
          gender: match.gender,
          location: match.location,
          bio: match.bio || "",
          profileImage: match.profileImage || "/avatars/default.jpg",
          personalityType: match.personalityType || "",
          interests: match.interests || [],
          relationshipGoals: match.relationshipGoals || [],
          compatibilityScore: score,
          explanation,
          matchDate: new Date().toISOString(),
          lastActive: "Just now",
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

      // Format the response
      return NextResponse.json({
        match: {
          _id: specificUser._id,
          userId: specificUser._id,
          name: specificUser.name,
          age: specificUser.age,
          gender: specificUser.gender,
          location: specificUser.location,
          bio: specificUser.bio || "",
          profileImage: specificUser.profileImage || "/avatars/default.jpg",
          personalityType: specificUser.personalityType || "",
          interests: specificUser.interests || [],
          relationshipGoals: specificUser.relationshipGoals || [],
          compatibilityScore,
          explanation,
        },
      });
    }

    // Get all potential matches from the database
    // Filter by gender/orientation if available
    let matchQuery: any = { _id: { $nin: excludedUserIds } };

    // If refresh is requested, we should exclude the current match as well
    if (refresh === "true" && currentUser.currentMatch?.userId) {
      matchQuery._id.$nin.push(currentUser.currentMatch.userId);
    }

    // Find potentially matching users
    const potentialMatches = await User.find(matchQuery);

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

      return {
        score,
        explanation,
        match: {
          _id: match._id,
          userId: match._id,
          name: match.name,
          age: match.age,
          gender: match.gender,
          location: match.location,
          bio: match.bio || "",
          profileImage: match.profileImage || "/avatars/default.jpg",
          personalityType: match.personalityType || "",
          interests: match.interests || [],
          relationshipGoals: match.relationshipGoals || [],
        },
      };
    });

    // Sort by compatibility score (highest first)
    scoredMatches.sort((a, b) => b.score - a.score);

    // Return the highest match by default
    const topMatch = scoredMatches[0];

    if (!topMatch) {
      return NextResponse.json({ error: "No matches found" }, { status: 404 });
    }

    // If we have a match, add it to the user's previousMatches array if not already there
    const matchExists = previouslyMatchedUserIds.includes(
      String(topMatch.match._id)
    );

    if (!matchExists) {
      await User.findByIdAndUpdate(currentUser._id, {
        $push: {
          previousMatches: {
            userId: topMatch.match._id,
            compatibilityScore: topMatch.score,
            explanation: topMatch.explanation,
            viewedAt: new Date(),
          },
        },
      });
    }

    return NextResponse.json({
      match: {
        ...topMatch.match,
        compatibilityScore: topMatch.score,
        explanation: topMatch.explanation,
        matchDate: new Date().toISOString(),
        lastActive: "Just now",
      },
    });
  } catch (error) {
    console.error("Error in matches API:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

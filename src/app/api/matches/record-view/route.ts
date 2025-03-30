import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  calculateCompatibilityScore,
  generateMatchExplanation,
} from "@/lib/ai/matchingAlgorithm";

export async function GET(request: NextRequest) {
  try {
    // Check for authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get match ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    // Check if this match is already in the user's previousMatches
    const previouslyMatchedUserIds = (currentUser.previousMatches || []).map(
      (match: any) => match.userId?.toString() || ""
    );

    // If match already exists in previousMatches, just return success
    if (previouslyMatchedUserIds.includes(matchId)) {
      return NextResponse.json({
        success: true,
        message: "Match already recorded",
      });
    }

    // Get the match user
    const matchUser = await User.findById(matchId);

    if (!matchUser) {
      return NextResponse.json(
        { error: "Match user not found" },
        { status: 404 }
      );
    }

    // Calculate compatibility score
    const compatibilityScore = calculateCompatibilityScore(
      currentUser,
      matchUser
    );

    // Generate explanation
    const explanation = generateMatchExplanation(
      compatibilityScore,
      matchUser.personalityType || ""
    );

    // Add to previousMatches in database
    await User.findByIdAndUpdate(currentUser._id, {
      $push: {
        previousMatches: {
          userId: matchUser._id,
          compatibilityScore,
          explanation,
          viewedAt: new Date(),
        },
      },
      $inc: { "statistics.matchesViewed": 1 },
    });

    return NextResponse.json({
      success: true,
      message: "Match view recorded successfully",
    });
  } catch (error) {
    console.error("Error recording match view:", error);
    return NextResponse.json(
      { error: "Failed to record match view" },
      { status: 500 }
    );
  }
}

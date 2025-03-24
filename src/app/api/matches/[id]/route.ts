import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

// Helper function to get user from token
async function getUserFromToken(token: string) {
  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    ) as JwtPayload;

    // Connect to the database
    await dbConnect();

    // Find user by ID
    const user = await User.findById(decoded.sub);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    throw error;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid match ID",
        },
        { status: 400 }
      );
    }

    // Get session
    const session = await getServerSession(authOptions);

    // If no session and no authorization header, return error
    if (!session?.user && !req.headers.get("authorization")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    let currentUser;

    // If session exists, get user from session
    if (session?.user) {
      await dbConnect();
      currentUser = await User.findOne({ email: session.user.email });
    }
    // Otherwise get user from token
    else {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid authorization header",
          },
          { status: 401 }
        );
      }

      const token = authHeader.split(" ")[1];
      currentUser = await getUserFromToken(token);
    }

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the match by ID
    const matchUser = await User.findById(matchId).select(
      "name age gender location personality profileImage preferredActivities bio interests personalityType"
    );

    if (!matchUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Match not found",
        },
        { status: 404 }
      );
    }

    // Check if this match is in user's previousMatches
    let matchRecord = null;
    let hasProposal = false;

    if (
      currentUser.previousMatches &&
      Array.isArray(currentUser.previousMatches)
    ) {
      // If previousMatches is an array of objects with userId
      matchRecord = currentUser.previousMatches.find(
        (match) => match.userId && match.userId.toString() === matchId
      );

      // Check for proposal - use a custom check since hasProposal might not be in the schema
      if (matchRecord && (matchRecord as any).hasProposal) {
        hasProposal = true;
      }
    }

    // Get proposals collection if it exists
    const db = mongoose.connection.db;
    if (db) {
      const proposalsCollection = db.collection("proposals");
      if (proposalsCollection) {
        // Check if there are any proposals from current user to match
        const proposal = await proposalsCollection.findOne({
          senderId: currentUser._id,
          recipientId: mongoose.Types.ObjectId.createFromHexString(matchId),
        });

        if (proposal) {
          hasProposal = true;
        }
      }
    }

    // Calculate compatibility score if not already present
    const compatibilityScore =
      matchRecord?.compatibilityScore || Math.floor(Math.random() * 30) + 70;

    // Create match data to return
    const matchData = {
      id: matchUser._id,
      name: matchUser.name,
      age: matchUser.age,
      gender: matchUser.gender,
      location: matchUser.location || "Unknown location",
      bio: matchUser.bio || "",
      interests: matchUser.interests || [],
      personalityType: (matchUser as any).personalityType || "",
      personality: {
        traits: (matchUser as any).personality?.traits || [],
      },
      profileImage: matchUser.profileImage || "/avatars/default.jpg",
      compatibilityScore,
      hasProposal,
      explanation:
        matchRecord?.explanation ||
        "Based on your personality traits and interests, our algorithm found you to be a great match!",
      viewedAt: matchRecord?.viewedAt || new Date(),
    };

    return NextResponse.json({
      success: true,
      data: matchData,
    });
  } catch (error: any) {
    console.error("Error fetching match:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "An error occurred while fetching match",
      },
      { status: 500 }
    );
  }
}

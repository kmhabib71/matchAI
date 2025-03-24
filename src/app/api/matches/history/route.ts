import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { IMatchRecord } from "@/models/User";

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

export async function GET(req: NextRequest) {
  try {
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

    let user;

    // If session exists, get user from session
    if (session?.user) {
      await dbConnect();
      user = await User.findOne({ email: session.user.email });
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
      user = await getUserFromToken(token);
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Get previousMatches from user
    let previousMatches = user.previousMatches || [];

    // If previousMatches is a reference ID array, populate it with user data
    if (previousMatches.length > 0 && typeof previousMatches[0] === "string") {
      // Connect to database and find all users in previousMatches
      const matchedUsers = await User.find({
        _id: { $in: previousMatches },
      }).select(
        "name age gender location personality profileImage preferredActivities bio"
      );

      // Transform to include compatibility scores (mock for now)
      previousMatches = matchedUsers.map((matchedUser) => {
        const userData = matchedUser.toObject();
        return {
          userId: userData._id,
          ...userData,
          id: userData._id,
          compatibilityScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-99 for demonstration
        };
      }) as IMatchRecord[];
    }

    return NextResponse.json({
      success: true,
      data: previousMatches,
    });
  } catch (error: any) {
    console.error("Error fetching match history:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "An error occurred while fetching match history",
      },
      { status: 500 }
    );
  }
}

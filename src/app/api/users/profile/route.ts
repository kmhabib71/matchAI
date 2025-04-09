import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Rather than using Mongoose's schema which might have projection issues with nested fields,
    // directly query the MongoDB collection to get the raw user document
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const usersCollection = db.collection("users");
    const rawUser = await usersCollection.findOne({
      email: session.user.email,
    });

    if (!rawUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate matches viewed from previousMatches array
    const matchesViewed = rawUser.previousMatches?.length || 0;

    // Create a new user object without sensitive fields
    const userObject: any = { ...rawUser };

    // Remove sensitive fields
    if (userObject.password) delete userObject.password;
    if (userObject.__v !== undefined) delete userObject.__v;

    // Convert MongoDB ObjectIds to strings for JSON serialization
    if (userObject._id) {
      userObject._id = userObject._id.toString();
    }

    // Add computed fields for backward compatibility
    userObject.statistics = {
      matchesViewed: matchesViewed,
      conversationsStarted: rawUser.interactions?.messagesSent || 0,
      profileCompleteness: rawUser.profileCompleted ? 100 : 0,
    };

    // Ensure personalityQuiz structure is complete
    if (userObject.personalityQuiz) {
      // Make sure answers is not undefined or null
      if (!userObject.personalityQuiz.answers) {
        userObject.personalityQuiz.answers = {};
      }

      // Make sure other fields exist
      if (!userObject.personalityQuiz.traits) {
        userObject.personalityQuiz.traits = [];
      }
    }

    // Ensure previousMatches is always an array
    if (!userObject.previousMatches) {
      userObject.previousMatches = [];
    }

    return NextResponse.json({
      user: userObject,
      success: true,
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

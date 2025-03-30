import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";

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

    // Find the user by their email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate matches viewed from previousMatches array
    const matchesViewed = user.previousMatches?.length || 0;

    // Convert the Mongoose document to a plain JavaScript object
    const userObject = user.toObject() as any;

    // Remove sensitive fields
    if (userObject.password) delete userObject.password;
    if (userObject.__v !== undefined) delete userObject.__v;

    // Add computed fields for backward compatibility
    userObject.statistics = {
      matchesViewed: matchesViewed,
      conversationsStarted: user.interactions?.messagesSent || 0,
      profileCompleteness: user.profileCompleted ? 100 : 0,
    };

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

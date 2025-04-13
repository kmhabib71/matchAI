import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
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

export async function POST(request: NextRequest) {
  try {
    // Get the current user either from session or token
    const session = await getServerSession(authOptions);

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

    // Get the userId from the request body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Match userId is required" },
        { status: 400 }
      );
    }

    // Update the previousMatches array to mark this userId as viewed
    if (!currentUser.previousMatches) {
      currentUser.previousMatches = [];
    }

    // Find the match with this userId in the previousMatches array
    const matchIndex = currentUser.previousMatches.findIndex(
      (match: any) => match.userId.toString() === userId
    );

    if (matchIndex !== -1) {
      // Match exists, mark it as viewed
      currentUser.previousMatches[matchIndex].isViewed = true;
      await currentUser.save();

      return NextResponse.json({ success: true });
    } else {
      // Match not found in previousMatches
      return NextResponse.json(
        { error: "Match not found in user's previousMatches" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error marking match as viewed:", error);
    return NextResponse.json(
      { error: "Server error marking match as viewed" },
      { status: 500 }
    );
  }
}

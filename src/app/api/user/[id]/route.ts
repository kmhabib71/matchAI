import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
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

// Mock user data for demo purposes
const mockUser = {
  _id: "demo-user-id",
  name: "Demo User",
  profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
  age: 30,
  gender: "Other",
  location: "New York, USA",
  personalityType: "ENFJ",
  lastActive: new Date().toISOString(),
};

// GET handler to fetch information about a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let currentUser = null;
    if (!session?.user) {
      currentUser = await getUserFromToken(req);

      if (!currentUser) {
        console.log("No valid session or token found");
        // Return demo user data with a demo flag
        return NextResponse.json({
          ...mockUser,
          demo: true,
        });
      }
    }

    const userId = params.id;

    // Connect to the database
    await dbConnect();

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId) && userId !== "demo-user-id") {
      console.log(`Invalid ObjectId: ${userId}`);
      // Return mock user data for demo purposes
      return NextResponse.json({
        ...mockUser,
        _id: userId,
        demo: true,
      });
    }

    // Find the user by ID
    const user = userId === "demo-user-id" ? null : await User.findById(userId);

    // Check if user exists
    if (!user) {
      // Return mock user data for demo purposes
      return NextResponse.json({
        ...mockUser,
        _id: userId,
        demo: true,
      });
    }

    // Return user information (excluding sensitive data)
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      age: user.age,
      gender: user.gender,
      location: user.location,
      personalityType: user.personalityType,
      lastActive: user.interactions?.lastActive || null,
      // Include additional fields as needed, but exclude sensitive information
    });
  } catch (error) {
    console.error("Error fetching user information:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 }
    );
  }
}

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

// Mock profile data for demo purposes
const mockProfile = {
  name: "Demo User",
  email: "demo@example.com",
  age: 30,
  gender: "Other",
  orientation: "Straight",
  location: "New York, USA",
  relationshipGoals: "Serious",
  personalityType: "ENFJ",
  preferences: {
    minAge: 25,
    maxAge: 40,
    distance: 50,
    lifestyle: {
      smoking: false,
      drinking: true,
      diet: "Any",
      religion: "Any",
    },
    dealBreakers: ["Smoking", "Dishonesty"],
  },
  profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper function to get user from token or session
async function getUser(req: NextRequest) {
  // First try with NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (user) return user;
  }

  // Then try with token
  return await getUserFromToken(req);
}

// GET handler to fetch user profile
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let user = null;
    if (!session?.user) {
      user = await getUserFromToken(req);

      if (!user) {
        console.log("No valid session or token found");
        // Return demo profile data with a demo flag
        return NextResponse.json({
          ...mockProfile,
          demo: true,
        });
      }
    }

    // Connect to the database
    await dbConnect();

    // Find the user by email or use the one from token
    if (!user && session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // Check if user exists
    if (!user) {
      return NextResponse.json({
        ...mockProfile,
        demo: true,
      });
    }

    // Return user profile data (excluding sensitive information)
    return NextResponse.json({
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      orientation: user.orientation,
      location: user.location,
      relationshipGoals: user.relationshipGoals,
      personalityType: user.personalityType,
      preferences: user.preferences,
      lifestyle: user.lifestyle || {
        smoking: "No",
        drinking: "No",
        diet: "Any",
        religion: "Any",
      },
      profileImage: user.profileImage,
      additionalPhotos: user.additionalPhotos,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// PUT handler to update user profile
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session or token
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }

    const data = await req.json();
    console.log("Received profile update data:", JSON.stringify(data, null, 2));

    // Validate the data
    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // Process location - convert string to proper location object with coordinates
    let locationUpdate = {};
    if (typeof data.location === "string" && data.location.trim() !== "") {
      // Keep the existing coordinates if available, or use default coordinates
      const existingCoordinates =
        user.location &&
        user.location.coordinates &&
        Array.isArray(user.location.coordinates) &&
        user.location.coordinates.length === 2
          ? user.location.coordinates
          : [0, 0];

      // Parse city and country from the location string
      const locationParts = data.location
        .split(",")
        .map((part: string) => part.trim());
      const city = locationParts[0] || "";
      const country = locationParts.length > 1 ? locationParts[1] : "";

      locationUpdate = {
        type: "Point",
        coordinates: existingCoordinates,
        city,
        country,
      };
    } else if (typeof data.location === "object" && data.location !== null) {
      if (
        !data.location.coordinates ||
        !Array.isArray(data.location.coordinates)
      ) {
        data.location.coordinates = user.location?.coordinates || [0, 0];
      }
      if (!data.location.type) {
        data.location.type = "Point";
      }
      locationUpdate = data.location;
    } else {
      locationUpdate = user.location;
    }

    // Process relationshipGoals - ensure it's a string
    if (Array.isArray(data.relationshipGoals)) {
      data.relationshipGoals = data.relationshipGoals[0] || "Casual";
    }

    // Process lifestyle preferences
    const lifestyle = {
      smoking: data.lifestyle?.smoking || "No",
      drinking: data.lifestyle?.drinking || "No",
      diet: data.lifestyle?.diet || "Any",
      religion: data.lifestyle?.religion || "Any",
    };

    console.log(
      "Processing lifestyle update:",
      JSON.stringify(lifestyle, null, 2)
    );

    const preferences = {
      minAge: data.preferences?.minAge || user.preferences?.minAge || 18,
      maxAge: data.preferences?.maxAge || user.preferences?.maxAge || 100,
      distance: data.preferences?.distance || user.preferences?.distance || 50,
      dealBreakers: Array.isArray(data.preferences?.dealBreakers)
        ? data.preferences.dealBreakers
        : user.preferences?.dealBreakers || [],
    };

    console.log(
      "Final preferences update:",
      JSON.stringify(preferences, null, 2)
    );

    // Update the user with structured preferences
    const updateData: {
      $set: Record<string, any>;
    } = {
      $set: {
        name: data.name,
        age: data.age,
        gender: data.gender,
        orientation: data.orientation,
        location: locationUpdate,
        relationshipGoals: data.relationshipGoals,
        personalityType: data.personalityType,
        "preferences.minAge": preferences.minAge,
        "preferences.maxAge": preferences.maxAge,
        "preferences.distance": preferences.distance,
        "preferences.dealBreakers": preferences.dealBreakers,
        lifestyle: lifestyle, // Update the entire lifestyle object
        profileImage: data.profileImage,
        profileCompleted:
          data.profileCompleted !== undefined
            ? data.profileCompleted
            : user.profileCompleted,
        updatedAt: new Date(),
      },
    };

    // Add personalityQuiz data if provided
    if (data.personalityQuiz) {
      if (data.personalityQuiz.completed) {
        updateData.$set["personalityQuiz.completed"] =
          data.personalityQuiz.completed;
      }

      if (data.personalityQuiz.completedAt) {
        updateData.$set["personalityQuiz.completedAt"] =
          data.personalityQuiz.completedAt;
      }

      if (data.personalityQuiz.personalityType) {
        updateData.$set["personalityQuiz.personalityType"] =
          data.personalityQuiz.personalityType;
      }

      if (data.personalityQuiz.traits) {
        updateData.$set["personalityQuiz.traits"] = data.personalityQuiz.traits;
      }

      // Handle answers as a map
      if (data.personalityQuiz.answers) {
        Object.entries(data.personalityQuiz.answers).forEach(([key, value]) => {
          updateData.$set[`personalityQuiz.answers.${key}`] = value;
        });
      }
    }

    console.log("Update operation:", JSON.stringify(updateData, null, 2));

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 404 }
      );
    }

    console.log(
      "Updated user:",
      JSON.stringify(
        {
          _id: updatedUser._id,
          name: updatedUser.name,
          lifestyle: updatedUser.lifestyle,
          preferences: updatedUser.preferences,
        },
        null,
        2
      )
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        orientation: updatedUser.orientation,
        location: updatedUser.location,
        relationshipGoals: updatedUser.relationshipGoals,
        personalityType: updatedUser.personalityType,
        preferences: updatedUser.preferences,
        lifestyle: updatedUser.lifestyle,
        profileImage: updatedUser.profileImage,
        additionalPhotos: updatedUser.additionalPhotos,
      },
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

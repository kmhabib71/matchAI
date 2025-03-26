import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { UserRole } from "@/models/User";

// Default coordinates to use if geocoding fails
const DEFAULT_COORDINATES = [0, 0]; // [longitude, latitude]

export async function PUT(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }

    console.log(`Processing profile update for ${session.user.email}`);

    // Connect to the database
    await dbConnect();

    // Get the user data from the request
    const userData = await req.json();
    console.log("Received user data:", userData);

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Process location string if provided
    if (userData.location && typeof userData.location === "string") {
      const locationParts = userData.location
        .split(",")
        .map((part: string) => part.trim());
      const city = locationParts[0] || "";
      const country = locationParts.length > 1 ? locationParts[1] : "";

      // Update location field
      userData.location = {
        type: "Point",
        coordinates: DEFAULT_COORDINATES, // Default coordinates
        city,
        country,
      };
    }

    // Check if we need to track OAuth provider info
    if (userData.oauthProvider && !user.oauthProvider) {
      user.oauthProvider = userData.oauthProvider;
      console.log(`Setting OAuth provider to: ${userData.oauthProvider}`);
    }

    // Update user fields
    if (userData.age) user.age = userData.age;
    if (userData.gender) user.gender = userData.gender;
    if (userData.orientation) user.orientation = userData.orientation;
    if (userData.location) user.location = userData.location;
    if (userData.relationshipGoals) {
      // Handle relationshipGoals as an array or string
      if (typeof userData.relationshipGoals === "string") {
        user.relationshipGoals = [userData.relationshipGoals];
      } else {
        user.relationshipGoals = userData.relationshipGoals;
      }
    }

    // Ensure user has the basic USER role
    if (!user.roles || user.roles.length === 0) {
      user.roles = [UserRole.USER];
    }

    // Update additional fields if provided
    if (userData.bio) user.bio = userData.bio;
    if (userData.interests) user.interests = userData.interests;
    if (userData.profileImage) user.profileImage = userData.profileImage;

    // Set profileCompleted flag
    if (userData.profileCompleted !== undefined) {
      user.profileCompleted = userData.profileCompleted;
    }

    // Set updatedAt timestamp
    user.updatedAt = new Date();

    // Save the updated user
    await user.save();
    console.log(`User profile updated for ${user.email}`);

    // Return the updated user without the password
    const userObj = user.toObject();
    const userResponseWithOptionalPassword = userObj as {
      password?: string;
    };
    delete userResponseWithOptionalPassword.password;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: userResponseWithOptionalPassword,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        error: error.message || "An error occurred while updating the profile",
      },
      { status: 500 }
    );
  }
}

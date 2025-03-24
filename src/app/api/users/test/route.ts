import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    // Check authentication - only admin users should be able to create test users
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();
    const data = await req.json();

    if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
      return NextResponse.json(
        { error: "No users provided or invalid format" },
        { status: 400 }
      );
    }

    // Reference to User model
    const { default: User } = await import("@/models/User");

    // Process each user
    const results = [];
    const errors = [];

    for (const userData of data.users) {
      try {
        // Hash the password using bcryptjs
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(userData.password, salt);

        // For test users, add test tag to make them easier to identify
        const testUserData = {
          ...userData,
          password: hashedPassword,
          isTestUser: true,
          createdAt: new Date(),
        };

        // Create the user
        const newUser = await User.create(testUserData);

        // For security, don't return the password
        const { password, ...userWithoutPassword } = newUser.toObject();
        results.push(userWithoutPassword);
      } catch (error: any) {
        console.error(`Error creating user ${userData.email}:`, error);
        errors.push({
          email: userData.email,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} test users with personality quiz data`,
      usersCreated: results.length,
      users: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in test users creation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create test users" },
      { status: 500 }
    );
  }
}

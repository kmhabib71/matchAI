import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the users data from the request
    const data = await req.json();
    const users = data.users;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "No users provided or invalid format" },
        { status: 400 }
      );
    }

    // Process each user
    const createdUsers = [];
    const errors = [];

    for (const user of users) {
      try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        // Create the user with the hashed password
        const newUser = await User.create({
          ...user,
          password: hashedPassword,
          // Make sure location is properly formatted
          location: user.location || {
            type: "Point",
            coordinates: [0, 0], // Default to [0,0] if not provided
            city: user.city || "",
            country: user.country || "",
          },
          // Set the roles to user
          roles: ["user"],
        });

        createdUsers.push({
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        });
      } catch (error: any) {
        console.error(`Error creating user ${user.email}:`, error);
        errors.push({
          email: user.email,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      usersCreated: createdUsers.length,
      users: createdUsers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in batch user creation:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

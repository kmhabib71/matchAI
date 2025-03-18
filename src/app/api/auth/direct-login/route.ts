import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// JWT secret key (should be in environment variables)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log(`Direct login attempt for: ${email}`);

    // Find user by email
    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`Password validation result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log("Invalid password");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      process.env.NEXTAUTH_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log("Direct login successful");

    // Return success response with user data and token
    const userResponse = { ...user } as any;
    delete userResponse.password;

    // Format the user data to match NextAuth session format
    const formattedUser = {
      id: userResponse._id.toString(),
      name: userResponse.name,
      email: userResponse.email,
      image: userResponse.profileImage || null,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: formattedUser,
        token,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `authToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${
            60 * 60 * 24 * 7
          }`, // 7 days
        },
      }
    );
  } catch (error) {
    console.error("Direct login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

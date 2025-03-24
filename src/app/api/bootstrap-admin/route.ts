import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { UserRole } from "@/models/User";

export async function POST(req: Request) {
  try {
    // Connect to database
    await dbConnect();

    // Get User model
    const { default: User } = await import("@/models/User");

    // For security, first check if there are already admins in the system
    const adminCount = await User.countDocuments({
      roles: UserRole.ADMIN,
    });

    // Get target user email from request body
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find target user
    const targetUser = await User.findOne({ email });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. Please register this email first." },
        { status: 404 }
      );
    }

    // If there are already admins, prevent bootstrap except in development
    if (adminCount > 0 && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "Admin users already exist. This bootstrap endpoint is disabled.",
          adminCount,
        },
        { status: 403 }
      );
    }

    // Add admin role if not already present
    if (!targetUser.roles.includes(UserRole.ADMIN)) {
      targetUser.roles.push(UserRole.ADMIN);
      await targetUser.save();
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} has been successfully promoted to admin.`,
      adminCount: adminCount + 1,
    });
  } catch (error: any) {
    console.error("Error bootstrapping admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create admin" },
      { status: 500 }
    );
  }
}

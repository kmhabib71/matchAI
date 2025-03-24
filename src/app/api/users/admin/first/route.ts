import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { UserRole } from "@/models/User";

export async function POST(req: Request) {
  try {
    // Check if current user is logged in (don't require admin status)
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Get User model
    const { default: User } = await import("@/models/User");

    // Count total admins - this endpoint should only work if there are no admins
    const adminCount = await User.countDocuments({
      roles: UserRole.ADMIN,
    });

    // Only allow creating the first admin if no admins exist
    // or if the current user is already an admin
    const currentUser = await User.findOne({ email: session.user.email });
    const isAdmin = currentUser?.roles?.includes(UserRole.ADMIN);

    if (adminCount > 0 && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Admin users already exist. Please ask an existing admin to promote you.",
        },
        { status: 403 }
      );
    }

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add admin role if not already present
    if (!targetUser.roles.includes(UserRole.ADMIN)) {
      targetUser.roles.push(UserRole.ADMIN);
      await targetUser.save();
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} has been promoted to admin`,
    });
  } catch (error: any) {
    console.error("Error creating first admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create first admin" },
      { status: 500 }
    );
  }
}

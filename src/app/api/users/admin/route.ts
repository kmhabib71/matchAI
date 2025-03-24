import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/models/User";

// Get all admin users
export async function GET(req: Request) {
  try {
    // Check if the current user is an admin
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get the User model
    const { default: User } = await import("@/models/User");

    // Check if the current user is an admin
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser || !currentUser.roles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Find all admin users
    const adminUsers = await User.find({
      roles: UserRole.ADMIN,
    }).select("-password");

    return NextResponse.json({ users: adminUsers });
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin users" },
      { status: 500 }
    );
  }
}

// Promote a user to admin
export async function POST(req: Request) {
  try {
    // Check if the current user is an admin
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get the User model
    const { default: User } = await import("@/models/User");

    // Check if the current user is an admin
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser || !currentUser.roles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Get the email of the user to promote
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find the user to promote
    const targetUser = await User.findOne({ email });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the user is already an admin
    if (targetUser.roles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { message: "User is already an admin" },
        { status: 200 }
      );
    }

    // Add admin role
    targetUser.roles.push(UserRole.ADMIN);
    await targetUser.save();

    return NextResponse.json({
      message: `User ${email} has been successfully promoted to admin`,
    });
  } catch (error: any) {
    console.error("Error promoting user to admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to promote user to admin" },
      { status: 500 }
    );
  }
}

// Remove admin privileges from a user
export async function DELETE(req: Request) {
  try {
    // Check if the current user is an admin
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get the User model
    const { default: User } = await import("@/models/User");

    // Check if the current user is an admin
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser || !currentUser.roles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Get the email of the user to demote
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find the user to demote
    const targetUser = await User.findOne({ email });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if we're trying to demote ourselves
    if (targetUser.email === session.user.email) {
      return NextResponse.json(
        { error: "You cannot remove your own admin privileges" },
        { status: 403 }
      );
    }

    // Remove admin role
    targetUser.roles = targetUser.roles.filter(
      (role) => role !== UserRole.ADMIN
    );
    await targetUser.save();

    return NextResponse.json({
      message: `Admin privileges have been removed from ${email}`,
    });
  } catch (error: any) {
    console.error("Error removing admin privileges:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove admin privileges" },
      { status: 500 }
    );
  }
}

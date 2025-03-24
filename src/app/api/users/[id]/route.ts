import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/models/User";
import bcryptjs from "bcryptjs";

// Get a specific user by id
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get User model
    const { default: User } = await import("@/models/User");

    // Check if user is admin or if they are requesting their own data
    const currentUser = await User.findOne({ email: session.user.email });
    const isAdmin = currentUser?.roles?.includes(UserRole.ADMIN);
    const isSelfRequest = currentUser?._id.toString() === params.id;

    if (!isAdmin && !isSelfRequest) {
      return NextResponse.json(
        { error: "Not authorized to access this user data" },
        { status: 403 }
      );
    }

    // Find the user by ID
    const user = await User.findById(params.id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// Update a user by id
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get User model
    const { default: User } = await import("@/models/User");

    // Check if user is admin or if they are updating their own data
    const currentUser = await User.findOne({ email: session.user.email });
    const isAdmin = currentUser?.roles?.includes(UserRole.ADMIN);
    const isSelfUpdate = currentUser?._id.toString() === params.id;

    if (!isAdmin && !isSelfUpdate) {
      return NextResponse.json(
        { error: "Not authorized to update this user" },
        { status: 403 }
      );
    }

    // Get the update data
    const updateData = await req.json();

    // Remove fields that should not be directly updated
    const { password, _id, email, roles, ...allowedUpdates } = updateData;

    // If it's not an admin, don't allow role updates
    if (!isAdmin) {
      delete allowedUpdates.roles;
    }

    // Handle password update separately if provided
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);
      allowedUpdates.password = hashedPassword;
    }

    // Find user and update
    const user = await User.findByIdAndUpdate(
      params.id,
      { $set: allowedUpdates },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user,
    });
  } catch (error: any) {
    console.error(`Error updating user ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete a user by id
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get User model
    const { default: User } = await import("@/models/User");

    // Only admins can delete users
    const currentUser = await User.findOne({ email: session.user.email });
    const isAdmin = currentUser?.roles?.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin privileges required to delete users" },
        { status: 403 }
      );
    }

    // Find user and delete
    const user = await User.findByIdAndDelete(params.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}

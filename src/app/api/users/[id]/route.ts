import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/models/User";
import bcryptjs from "bcryptjs";
import User from "@/models/User";

// Get a specific user by id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await dbConnect();

    // Get current user session for authorization checks
    const session = await getServerSession(authOptions);

    // Find the requested user
    const userId = params.id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert Mongoose document to plain object
    const userObj = user.toObject();

    // Remove sensitive fields
    delete userObj.password;
    delete userObj.email; // Only expose email to admins or the user themselves
    delete userObj.verifications;
    delete userObj.__v;

    // Check if this is the current user or an admin
    const isOwnProfile = session?.user?.id === userId;
    const isAdmin = session?.user?.roles?.includes("admin");

    // If not own profile or admin, remove additional sensitive fields
    if (!isOwnProfile && !isAdmin) {
      // Keep email hidden
      userObj.email = undefined;

      // Don't expose raw quiz answers except for profile display fields
      if (userObj.personalityQuiz && userObj.personalityQuiz.answers) {
        const displayAnswers = [
          "profile_1",
          "profile_2",
          "profile_3",
          "profile_4",
          "profile_5",
          "profile_7",
          "profile_8",
          "profile_9",
          "profile_12",
        ];

        const filteredAnswers: Record<string, string> = {};
        displayAnswers.forEach((key) => {
          if (userObj.personalityQuiz.answers[key]) {
            filteredAnswers[key] = userObj.personalityQuiz.answers[key];
          }
        });

        userObj.personalityQuiz.answers = filteredAnswers;
      }
    }

    return NextResponse.json(userObj);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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

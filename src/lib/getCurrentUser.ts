import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { UserRole } from "@/models/User";
import { Document } from "mongoose";

interface UserDocument extends Document {
  _id: any;
  email: string;
  roles: string[];
  [key: string]: any;
}

export async function getCurrentUser() {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    console.log("Session data:", JSON.stringify(session, null, 2));

    if (!session || !session.user?.email) {
      console.log("No session or email in session");
      return null;
    }

    // Connect to the database
    await dbConnect();

    // Import the User model (dynamic import to avoid issues with Next.js)
    const { default: User } = await import("@/models/User");

    // Find the user in the database
    const user = (await User.findOne({
      email: session.user.email,
    })) as UserDocument;

    if (!user) {
      console.log("User not found in database");
      return null;
    }

    console.log("User from DB:", {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    // Check if user is admin
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    console.log("Is admin check:", {
      UserRole: UserRole.ADMIN,
      userRoles: user.roles,
      isAdmin,
    });

    // Return user with admin flag
    const returnUser = {
      ...session.user,
      id: user._id.toString(),
      isAdmin,
      roles: user.roles,
    };

    console.log("Returning user:", returnUser);

    return returnUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

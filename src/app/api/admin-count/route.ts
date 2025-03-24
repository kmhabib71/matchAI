import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { UserRole } from "@/models/User";

export async function GET() {
  try {
    // Connect to database
    await dbConnect();

    // Get User model
    const { default: User } = await import("@/models/User");

    // Count admin users
    const count = await User.countDocuments({
      roles: UserRole.ADMIN,
    });

    // Return the count
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("Error checking admin count:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check admin count", count: null },
      { status: 500 }
    );
  }
}

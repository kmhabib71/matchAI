import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

// Define the missing interfaces to match the User model
interface IUserStatistics {
  matchesViewed?: number;
  messagesSent?: number;
  messagesReceived?: number;
}

interface IUserSubscription {
  type: string;
  expiresAt?: Date;
  status?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session || !session.user?.email) {
      return NextResponse.json({
        type: "free",
        subscriptionLevel: "free",
        matchesRemaining: 3,
        isPremium: false,
      });
    }

    // Connect to the database
    await dbConnect();

    // Find the user by their email
    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user's subscription data safely
    const userDataObj = user as any; // Use type assertion to avoid TS errors
    const subscriptionType = userDataObj.subscription?.type || "free";
    const isPremium = subscriptionType !== "free";

    // Calculate matches remaining based on subscription type
    let matchLimit = 3; // Default free limit

    if (subscriptionType === "premium_basic") {
      matchLimit = 10;
    } else if (subscriptionType === "premium_plus") {
      matchLimit = 999; // Effectively unlimited
    }

    // Get total matches viewed from user data
    const totalMatchesViewed = userDataObj.statistics?.matchesViewed || 0;
    const matchesRemaining = Math.max(0, matchLimit - totalMatchesViewed);

    return NextResponse.json({
      type: subscriptionType,
      subscriptionLevel: subscriptionType,
      isPremium,
      matchLimit,
      matchesRemaining,
      expiresAt: userDataObj.subscription?.expiresAt || null,
    });
  } catch (error: any) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

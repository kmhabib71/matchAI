import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import jwt from "jsonwebtoken";

// Helper function to get user from token
async function getUserFromToken(req: NextRequest) {
  const token =
    req.cookies.get("authToken")?.value ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    // Use the same secret key as the one used for token generation
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

    // Try to verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      email?: string;
    };

    // Check if we have a valid user ID
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      console.log("No user ID found in token");
      return null;
    }

    // Find the user in the database
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Token verification error:", error);
    // Don't throw, just return null to indicate authentication failed
    return null;
  }
}

// GET handler to check subscription usage
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let user = null;
    if (!session?.user) {
      user = await getUserFromToken(req);

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Connect to the database
    await dbConnect();

    // Find the user by email or use the one from token
    if (!user && session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the user's subscription
    const subscription = await Subscription.findOne({ userId: user._id });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Return the usage data
    return NextResponse.json({
      usage: {
        matches: {
          used: subscription.usedMatches || 0,
          total: subscription.matchesLimit || 3,
          remaining: Math.max(
            0,
            (subscription.matchesLimit || 3) - (subscription.usedMatches || 0)
          ),
        },
        proposals: {
          used: subscription.usedProposals || 0,
          total: subscription.proposalsLimit || 3,
          remaining: Math.max(
            0,
            (subscription.proposalsLimit || 3) -
              (subscription.usedProposals || 0)
          ),
        },
        contacts: {
          used: subscription.usedContacts || 0,
          total: subscription.contactsLimit || 3,
          remaining: Math.max(
            0,
            (subscription.contactsLimit || 3) - (subscription.usedContacts || 0)
          ),
        },
        chats: {
          used: subscription.usedChats || 0,
          total: subscription.chatsLimit || 3,
          remaining: Math.max(
            0,
            (subscription.chatsLimit || 3) - (subscription.usedChats || 0)
          ),
        },
      },
      status: subscription.status,
      planId: subscription.planId,
    });
  } catch (error) {
    console.error("Error fetching subscription usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription usage" },
      { status: 500 }
    );
  }
}

// POST handler to increment usage
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let user = null;
    if (!session?.user) {
      user = await getUserFromToken(req);

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Parse the request body
    const { usageType } = await req.json();

    if (!usageType) {
      return NextResponse.json(
        { error: "Usage type is required" },
        { status: 400 }
      );
    }

    // Validate usage type
    if (!["matches", "proposals", "contacts", "chats"].includes(usageType)) {
      return NextResponse.json(
        { error: "Invalid usage type" },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Find the user by email or use the one from token
    if (!user && session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the user's subscription
    const subscription = await Subscription.findOne({ userId: user._id });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Check if the user has reached their limit
    const usedField = `used${
      usageType.charAt(0).toUpperCase() + usageType.slice(1)
    }` as keyof typeof subscription;
    const limitField = `${usageType}Limit` as keyof typeof subscription;

    const used = (subscription[usedField] as number) || 0;
    const limit = (subscription[limitField] as number) || 3;

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `${usageType} limit reached`,
          limitReached: true,
          used,
          limit,
          subscriptionRequired: subscription.planId === "free",
        },
        { status: 403 }
      );
    }

    // Increment the usage
    subscription[usedField as keyof typeof subscription] = (used + 1) as never;
    await subscription.save();

    // Return the updated usage data
    return NextResponse.json({
      success: true,
      usageType,
      used: used + 1,
      limit,
      remaining: limit - (used + 1),
    });
  } catch (error) {
    console.error("Error updating subscription usage:", error);
    return NextResponse.json(
      { error: "Failed to update subscription usage" },
      { status: 500 }
    );
  }
}

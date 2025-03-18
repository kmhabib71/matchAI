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

// Mock subscription data for demo purposes
const mockSubscription = {
  _id: "demo-subscription-id",
  userId: "demo-user-id",
  planId: "free",
  status: "active",
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  createdAt: new Date(),
};

// GET handler to fetch user's subscription
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let user = null;
    if (!session?.user) {
      user = await getUserFromToken(req);

      if (!user) {
        console.log("No valid session or token found");
        // Return demo subscription data with a demo flag
        return NextResponse.json({
          subscription: mockSubscription,
          demo: true,
        });
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
      return NextResponse.json({
        subscription: mockSubscription,
        demo: true,
      });
    }

    // Find the user's subscription
    const subscription = await Subscription.findOne({ userId: user._id });

    // Return the subscription data
    return NextResponse.json({
      subscription: subscription
        ? {
            _id: subscription._id,
            userId: subscription.userId,
            planId: subscription.planId,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            createdAt: subscription.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST handler to create or update a subscription
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
          {
            error: "You must be signed in to access this endpoint",
            demo: true,
          },
          { status: 401 }
        );
      }
    }

    // Parse the request body
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Validate plan ID
    if (!["free", "monthly", "yearly"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();

    // Find the user by email or use the one from token
    if (!user && session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: "User not found", demo: true },
        { status: 404 }
      );
    }

    // Find the user's existing subscription
    let subscription = await Subscription.findOne({ userId: user._id });

    // Calculate subscription period
    const now = new Date();
    const currentPeriodStart = now;
    let currentPeriodEnd;

    if (planId === "monthly") {
      // Add 1 month
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (planId === "yearly") {
      // Add 1 year
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      // Free plan has no end date
      currentPeriodEnd = null;
    }

    if (subscription) {
      // Update existing subscription
      subscription.planId = planId;
      subscription.status = "active";
      subscription.currentPeriodStart = currentPeriodStart;
      subscription.currentPeriodEnd = currentPeriodEnd;
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new Subscription({
        userId: user._id,
        planId,
        status: "active",
        currentPeriodStart,
        currentPeriodEnd,
      });
      await subscription.save();
    }

    // In a real application, this would integrate with a payment processor
    // For now, we'll just return a success response

    // Return the updated subscription
    return NextResponse.json({
      message: "Subscription updated successfully",
      subscription: {
        _id: subscription._id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

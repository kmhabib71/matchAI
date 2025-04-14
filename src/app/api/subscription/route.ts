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

// Subscription plan details
const subscriptionPlans = {
  free: {
    name: "Free",
    price: 0,
    currency: "BDT",
    matchesLimit: 3,
    proposalsLimit: 3,
    contactsLimit: 3,
    chatsLimit: 3,
  },
  premium_basic: {
    name: "Premium Basic",
    price: 499,
    currency: "BDT",
    matchesLimit: 10,
    proposalsLimit: 10,
    contactsLimit: 10,
    chatsLimit: 10,
  },
  premium_plus: {
    name: "Premium Plus",
    price: 999,
    currency: "BDT",
    matchesLimit: 50,
    proposalsLimit: 50,
    contactsLimit: 50,
    chatsLimit: 50,
  },
};

// Mock subscription data for demo purposes
const mockSubscription = {
  _id: "demo-subscription-id",
  userId: "demo-user-id",
  planId: "free",
  status: "active",
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  createdAt: new Date(),
  matchesLimit: 3,
  proposalsLimit: 3,
  contactsLimit: 3,
  chatsLimit: 3,
  usedMatches: 0,
  usedProposals: 0,
  usedContacts: 0,
  usedChats: 0,
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

    // If no subscription exists, create a default free subscription
    if (!subscription) {
      const currentDate = new Date();
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const newSubscription = new Subscription({
        userId: user._id,
        planId: "free",
        status: "active",
        currentPeriodStart: currentDate,
        currentPeriodEnd: nextMonth,
        matchesLimit: 3,
        proposalsLimit: 3,
        contactsLimit: 3,
        chatsLimit: 3,
        usedMatches: 0,
        usedProposals: 0,
        usedContacts: 0,
        usedChats: 0,
      });

      await newSubscription.save();

      // Update the user's subscription level
      user.subscriptionLevel = "free";
      await user.save();

      return NextResponse.json({
        subscription: newSubscription,
        plans: subscriptionPlans,
      });
    }

    // Return the subscription data
    return NextResponse.json({
      subscription: subscription,
      plans: subscriptionPlans,
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
    const body = await req.json();
    const { planId, mobileNumber } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Validate plan ID
    if (!["free", "premium_basic", "premium_plus"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // For paid plans, mobile number is required
    if (planId !== "free" && !mobileNumber) {
      return NextResponse.json(
        { error: "Mobile number is required for paid plans" },
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
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // All plans are monthly

    // Set plan details based on selected plan
    const planDetails =
      subscriptionPlans[planId as keyof typeof subscriptionPlans];

    // For free plan, activate immediately
    // For paid plans, set status to pending until payment is confirmed
    const status = planId === "free" ? "active" : "pending";

    if (subscription) {
      // Update existing subscription
      subscription.planId = planId;
      subscription.status = status;
      subscription.currentPeriodStart = currentPeriodStart;
      subscription.currentPeriodEnd = currentPeriodEnd;
      subscription.matchesLimit = planDetails.matchesLimit;
      subscription.proposalsLimit = planDetails.proposalsLimit;
      subscription.contactsLimit = planDetails.contactsLimit;
      subscription.chatsLimit = planDetails.chatsLimit;

      // Reset usage if changing plans or if it's a new billing period
      if (
        subscription.planId !== planId ||
        (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now)
      ) {
        subscription.usedMatches = 0;
        subscription.usedProposals = 0;
        subscription.usedContacts = 0;
        subscription.usedChats = 0;
      }

      // Set payment details for paid plans
      if (planId !== "free") {
        subscription.amount = planDetails.price;
        subscription.currency = planDetails.currency;
        subscription.mobileNumber = mobileNumber;
        subscription.paymentMethod = "bKash";
      }

      await subscription.save();
    } else {
      // Create new subscription
      subscription = new Subscription({
        userId: user._id,
        planId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        matchesLimit: planDetails.matchesLimit,
        proposalsLimit: planDetails.proposalsLimit,
        contactsLimit: planDetails.contactsLimit,
        chatsLimit: planDetails.chatsLimit,
        usedMatches: 0,
        usedProposals: 0,
        usedContacts: 0,
        usedChats: 0,
      });

      // Set payment details for paid plans
      if (planId !== "free") {
        subscription.amount = planDetails.price;
        subscription.currency = planDetails.currency;
        subscription.mobileNumber = mobileNumber;
        subscription.paymentMethod = "bKash";
      }

      await subscription.save();
    }

    // Update user's subscription level
    user.subscriptionLevel = planId;
    await user.save();

    // Return the updated subscription
    return NextResponse.json({
      message:
        planId === "free"
          ? "Subscription updated successfully"
          : "Your account will be upgraded within 15 minutes",
      subscription: subscription,
      pendingPayment: planId !== "free",
      bKashNumber: "01XXXXXXXXX", // Replace with your actual bKash number
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

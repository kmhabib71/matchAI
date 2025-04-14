import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Attempt to get user from session or token
    const session = await getServerSession(authOptions);
    let user = null;

    // Try to get user from session
    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // If no user from session, try to get from token
    if (!user) {
      user = await getUserFromToken(req);
    }

    // If still no user, try to get from request body (for new registrations)
    if (!user) {
      try {
        const body = await req.json();
        if (body.email) {
          user = await User.findOne({ email: body.email });
        }
      } catch (error) {
        console.error("Error parsing request body:", error);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a subscription
    const existingSubscription = await Subscription.findOne({
      userId: user._id,
    });
    if (existingSubscription) {
      return NextResponse.json({
        message: "User already has a subscription",
        subscription: existingSubscription,
      });
    }

    // Calculate subscription period - free plan is valid for 1 month
    const currentDate = new Date();
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Create a new free subscription
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

    // Update user's subscription level if the user model has this field
    if (user.subscriptionLevel !== undefined) {
      user.subscriptionLevel = "free";
      await user.save();
    }

    return NextResponse.json({
      message: "Free subscription created successfully",
      subscription: newSubscription,
    });
  } catch (error: any) {
    console.error("Error creating free subscription:", error);
    return NextResponse.json(
      { error: "Failed to create free subscription" },
      { status: 500 }
    );
  }
}

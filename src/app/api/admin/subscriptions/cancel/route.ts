import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

// Check if user is admin
async function isAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return false;
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });

  return user && user.role === "admin";
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const admin = await isAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the subscription and update its status
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Update the subscription status to cancelled
    subscription.status = "cancelled";
    subscription.updatedAt = new Date();
    await subscription.save();

    // Update user's subscription status
    const user = await User.findById(subscription.userId);
    if (user) {
      user.hasActiveSubscription = false;
      user.subscriptionStatus = "cancelled";
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

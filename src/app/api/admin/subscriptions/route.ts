import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
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

export async function GET(req: NextRequest) {
  try {
    // Check admin authorization
    const admin = await isAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Fetch all subscriptions and populate with user data
    const subscriptions = await Subscription.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Transform the data to match the expected format in the frontend
    const formattedSubscriptions = subscriptions.map((subscription) => ({
      _id: subscription._id.toString(),
      userId: subscription.userId._id.toString(),
      planId: subscription.planId,
      status: subscription.status,
      amount: subscription.amount,
      currency: subscription.currency,
      mobileNumber: subscription.mobileNumber,
      paymentMethod: subscription.paymentMethod,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      user: {
        _id: subscription.userId._id.toString(),
        name: subscription.userId.name,
        email: subscription.userId.email,
      },
    }));

    return NextResponse.json({ subscriptions: formattedSubscriptions });
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

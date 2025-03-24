import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import Proposal from "@/models/Proposal";
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

export async function POST(request: NextRequest) {
  try {
    // Check for authentication
    const session = await getServerSession(authOptions);

    // Get current user
    let currentUser = null;
    if (!session?.user) {
      currentUser = await getUserFromToken(request);

      if (!currentUser) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    } else {
      // Connect to database
      await dbConnect();

      // Get User model
      currentUser = await User.findOne({ email: session.user.email });

      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Parse request body
    const body = await request.json();
    const { recipientId, message } = body;

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: "Recipient ID and message are required" },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient user not found" },
        { status: 404 }
      );
    }

    // Create a new proposal
    // In a real implementation, we would use a Proposal model
    // For demo purposes, we'll handle this simply

    // Check if the Proposal model exists, if not create it
    if (!global.Proposal) {
      try {
        global.Proposal = Proposal;
      } catch (error) {
        // If the model doesn't exist, create a simple schema
        const mongoose = (await import("mongoose")).default;
        const proposalSchema = new mongoose.Schema({
          sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          message: { type: String, required: true },
          status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
          },
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
        });

        global.Proposal =
          mongoose.models.Proposal ||
          mongoose.model("Proposal", proposalSchema);
      }
    }

    // Create the proposal
    const proposal = await global.Proposal.create({
      sender: currentUser._id,
      recipient: recipientId,
      message,
      status: "pending",
    });

    // Update the user's previousMatches to include the proposal
    await User.findByIdAndUpdate(
      currentUser._id,
      {
        $set: {
          "previousMatches.$[elem].hasProposal": true,
          "previousMatches.$[elem].proposalId": proposal._id,
        },
      },
      {
        arrayFilters: [{ "elem.userId": recipientId }],
        new: true,
      }
    );

    return NextResponse.json(
      {
        message: "Proposal sent successfully",
        proposal: {
          id: proposal._id,
          recipient: recipientId,
          status: proposal.status,
          createdAt: proposal.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in sending proposal:", error);
    return NextResponse.json(
      { error: "Failed to send proposal" },
      { status: 500 }
    );
  }
}

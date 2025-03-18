import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";
import mongoose from "mongoose";
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

// Mock data for demo purposes
const mockMessages = [
  {
    _id: "msg1",
    sender: "demo@example.com",
    recipient: "user@example.com",
    content:
      "Hi there! I noticed we have a high compatibility score. What are you looking for in a relationship?",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    read: true,
  },
  {
    _id: "msg2",
    sender: "user@example.com",
    recipient: "demo@example.com",
    content:
      "Hello! I'm looking for something serious. I enjoy hiking and traveling. What about you?",
    createdAt: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
    read: true,
  },
  {
    _id: "msg3",
    sender: "demo@example.com",
    recipient: "user@example.com",
    content:
      "That sounds great! I love hiking too. What's your favorite hiking spot?",
    createdAt: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
    read: true,
  },
  {
    _id: "msg4",
    sender: "user@example.com",
    recipient: "demo@example.com",
    content:
      "I really enjoy mountain trails. There's a beautiful one near my city with amazing views!",
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    read: true,
  },
  {
    _id: "msg5",
    sender: "demo@example.com",
    recipient: "user@example.com",
    content:
      "That sounds wonderful! Would you like to go hiking together sometime?",
    createdAt: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
    read: true,
  },
];

const mockChatPartner = {
  _id: "demo-user-id",
  name: "Demo User",
  profileImage: "https://randomuser.me/api/portraits/lego/1.jpg",
  lastActive: new Date().toISOString(),
};

// GET handler to fetch chat history with a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let currentUser = null;
    let currentUserEmail = null;

    if (session?.user?.email) {
      currentUserEmail = session.user.email;
    } else {
      currentUser = await getUserFromToken(req);

      if (currentUser) {
        currentUserEmail = currentUser.email;
      } else {
        console.log("No valid session or token found");
        // Return demo data with a demo flag
        return NextResponse.json({
          messages: mockMessages,
          chatPartner: {
            ...mockChatPartner,
            _id: params.id,
          },
          demo: true,
        });
      }
    }

    const chatPartnerId = params.id;

    // Connect to the database
    await dbConnect();

    // Check if chatPartnerId is a valid ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(chatPartnerId) &&
      chatPartnerId !== "demo-user-id"
    ) {
      console.log(`Invalid ObjectId: ${chatPartnerId}`);
      // Return mock data for demo purposes
      return NextResponse.json({
        messages: mockMessages,
        chatPartner: {
          ...mockChatPartner,
          _id: chatPartnerId,
        },
        demo: true,
      });
    }

    // Verify that the chat partner exists
    const chatPartner =
      chatPartnerId === "demo-user-id"
        ? null
        : await User.findOne({ _id: chatPartnerId });
    if (!chatPartner) {
      // Return mock data for demo purposes
      return NextResponse.json({
        messages: mockMessages,
        chatPartner: {
          ...mockChatPartner,
          _id: chatPartnerId,
        },
        demo: true,
      });
    }

    // Find all messages between the current user and the chat partner
    const messages = await Message.find({
      $or: [
        { sender: currentUserEmail, recipient: chatPartner.email },
        { sender: chatPartner.email, recipient: currentUserEmail },
      ],
    }).sort({ createdAt: 1 });

    // Mark unread messages as read
    await Message.updateMany(
      {
        sender: chatPartner.email,
        recipient: currentUserEmail,
        read: false,
      },
      { $set: { read: true } }
    );

    // Return the messages
    return NextResponse.json({
      messages,
      chatPartner: {
        _id: chatPartner._id,
        name: chatPartner.name,
        profileImage: chatPartner.profileImage,
        lastActive: chatPartner.interactions?.lastActive || null,
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

// POST handler to send a message to a specific user
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let currentUser = null;
    let currentUserEmail = null;

    if (session?.user?.email) {
      currentUserEmail = session.user.email;
    } else {
      currentUser = await getUserFromToken(req);

      if (currentUser) {
        currentUserEmail = currentUser.email;
      } else {
        return NextResponse.json(
          {
            error: "You must be signed in to access this endpoint",
            demo: true,
          },
          { status: 401 }
        );
      }
    }

    const chatPartnerId = params.id;

    // Parse the request body
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Check if chatPartnerId is a valid ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(chatPartnerId) &&
      chatPartnerId !== "demo-user-id"
    ) {
      // For demo purposes, pretend the message was sent
      return NextResponse.json({
        message: {
          _id: `msg-${Date.now()}`,
          sender: currentUserEmail,
          recipient: "demo@example.com",
          content: content.trim(),
          read: false,
          createdAt: new Date(),
        },
        demo: true,
      });
    }

    // Verify that the chat partner exists
    const chatPartner =
      chatPartnerId === "demo-user-id"
        ? null
        : await User.findOne({ _id: chatPartnerId });
    if (!chatPartner) {
      // For demo purposes, pretend the message was sent
      if (chatPartnerId.includes("demo")) {
        return NextResponse.json({
          message: {
            _id: `msg-${Date.now()}`,
            sender: currentUserEmail,
            recipient: "demo@example.com",
            content: content.trim(),
            read: false,
            createdAt: new Date(),
          },
          demo: true,
        });
      }

      return NextResponse.json(
        { error: "Chat partner not found" },
        { status: 404 }
      );
    }

    // Create a new message
    const message = new Message({
      sender: currentUserEmail,
      recipient: chatPartner.email,
      content: content.trim(),
      read: false,
      createdAt: new Date(),
    });

    // Save the message
    await message.save();

    // Return the created message
    return NextResponse.json({
      message: {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        read: message.read,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

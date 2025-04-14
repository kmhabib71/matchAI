import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { z } from "zod";

// Define validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.number().min(0, "You must be at least 18 years old"),
  gender: z.string(),
  orientation: z.string(),
  location: z.string(),
  relationshipGoals: z.enum(["Casual", "Serious", "Marriage"]),
});

// Default coordinates to use if geocoding fails
const DEFAULT_COORDINATES = [0, 0]; // [longitude, latitude]

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();

    // Validate request data
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      age,
      gender,
      orientation,
      location,
      relationshipGoals,
    } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Parse location string (assuming format like "City, Country")
    const locationParts = location
      .split(",")
      .map((part: string) => part.trim());
    const city = locationParts[0] || "";
    const country = locationParts.length > 1 ? locationParts[1] : "";

    // Create new user with properly formatted location
    const user = new User({
      name,
      email,
      password,
      age,
      gender,
      orientation,
      location: {
        type: "Point",
        coordinates: DEFAULT_COORDINATES, // Default coordinates
        city,
        country,
      },
      relationshipGoals,
      preferences: {
        minAge: 0,
        maxAge: 100,
        distance: 50,
        lifestyle: {
          smoking: false,
          drinking: false,
          diet: "Any",
          religion: "Any",
        },
        dealBreakers: [],
      },
      subscriptionLevel: "free", // Default subscription level
      profileCompleted: false,
    });

    // Save user to database
    await user.save();

    // Create a default subscription for the user
    const currentDate = new Date();
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscription = new Subscription({
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

    await subscription.save();

    // Return success response (exclude password)
    const userResponse = user.toObject();
    // Use type assertion to make TypeScript happy
    const userResponseWithOptionalPassword = userResponse as {
      password?: string;
    };
    delete userResponseWithOptionalPassword.password;

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: userResponseWithOptionalPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}

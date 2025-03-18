import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { batchAnalyzeCompatibility } from "@/lib/ai/openai";
import { generateMatchExplanation } from "@/lib/ai/matchingAlgorithm";
import { User as UserType } from "@/types";

// Define a simplified user interface for compatibility calculations
interface IUser {
  _id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  orientation: string;
  location: string;
  relationshipGoals: string;
  personalityType?: string;
  bio?: string;
  interests?: string[];
  lifestyle?: {
    smoking: string | boolean;
    drinking: string | boolean;
    diet: string;
    religion: string;
    exercise?: string;
    [key: string]: any;
  };
  preferences: {
    minAge: number;
    maxAge: number;
    distance: number;
    lifestyle: {
      smoking: string | boolean;
      drinking: string | boolean;
      diet: string;
      religion: string;
      [key: string]: any;
    };
    dealBreakers?: string[];
  };
}

// Helper function to calculate compatibility score (simplified version)
function calculateCompatibilityScore(
  user: IUser,
  potentialMatch: IUser
): number {
  let score = 0;
  const maxScore = 100;

  // Age preference match
  if (
    potentialMatch.age >= user.preferences.minAge &&
    potentialMatch.age <= user.preferences.maxAge
  ) {
    score += 20;
  }

  // Relationship goals match
  if (user.relationshipGoals === potentialMatch.relationshipGoals) {
    score += 30;
  } else if (
    (user.relationshipGoals === "Serious" &&
      potentialMatch.relationshipGoals === "Marriage") ||
    (user.relationshipGoals === "Marriage" &&
      potentialMatch.relationshipGoals === "Serious")
  ) {
    score += 15;
  }

  // Lifestyle preferences match
  const userLifestyle = user.preferences.lifestyle;
  const matchLifestyle = potentialMatch.preferences.lifestyle;

  if (userLifestyle.smoking === matchLifestyle.smoking) score += 10;
  if (userLifestyle.drinking === matchLifestyle.drinking) score += 10;
  if (
    userLifestyle.diet === matchLifestyle.diet ||
    userLifestyle.diet === "Any" ||
    matchLifestyle.diet === "Any"
  )
    score += 10;
  if (
    userLifestyle.religion === matchLifestyle.religion ||
    userLifestyle.religion === "Any" ||
    matchLifestyle.religion === "Any"
  )
    score += 20;

  // Ensure score is between 0 and 100
  return Math.min(Math.max(score, 0), maxScore);
}

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

// Mock data for demonstration purposes
const mockMatches = [
  {
    _id: "1",
    name: "Alex Johnson",
    age: 28,
    location: {
      city: "New York",
      country: "USA",
    },
    profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
    personalityType: "ENFJ",
    bio: "Passionate about travel, photography, and trying new cuisines. Looking for someone who shares my sense of adventure and appreciation for the little things in life.",
    interests: ["Photography", "Hiking", "Cooking", "Travel"],
    relationshipGoals: ["Long-term", "Marriage-minded"],
    lifestyle: {
      drinking: "Social drinker",
      smoking: "Non-smoker",
      exercise: "Regular",
      diet: "Flexitarian",
      pets: "Dog lover",
    },
  },
  {
    _id: "2",
    name: "Jordan Smith",
    age: 31,
    location: {
      city: "San Francisco",
      country: "USA",
    },
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    personalityType: "INTP",
    bio: "Software engineer by day, musician by night. I enjoy deep conversations about technology, philosophy, and the universe. Looking for someone who challenges me intellectually.",
    interests: ["Music", "Technology", "Philosophy", "Gaming"],
    relationshipGoals: ["Dating", "Long-term"],
    lifestyle: {
      drinking: "Rarely",
      smoking: "Non-smoker",
      exercise: "Sometimes",
      diet: "Omnivore",
      pets: "Cat person",
    },
  },
  {
    _id: "3",
    name: "Taylor Rivera",
    age: 26,
    location: {
      city: "Austin",
      country: "USA",
    },
    profileImage: "https://randomuser.me/api/portraits/women/63.jpg",
    personalityType: "ENFP",
    bio: "Creative soul with a passion for art and design. I believe in living authentically and finding joy in everyday moments. Looking for someone who appreciates creativity and spontaneity.",
    interests: ["Art", "Design", "Yoga", "Festivals"],
    relationshipGoals: ["Dating", "Friendship first"],
    lifestyle: {
      drinking: "Social drinker",
      smoking: "Non-smoker",
      exercise: "Yoga enthusiast",
      diet: "Vegetarian",
      pets: "Animal lover",
    },
  },
];

// Mock user subscription data
const mockUserSubscription = {
  planId: "free",
  matchesRemaining: 3,
  totalMatchesAllowed: 5,
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    // Check for direct login token if NextAuth session is not available
    let user = null;
    if (!session?.user) {
      user = await getUserFromToken(request);

      if (!user) {
        console.log("No valid session or token found");
        // Instead of returning 401, return a mock match for demo purposes
        const fallbackMatch = mockMatches[0];
        const fallbackScore = 70;
        const fallbackExplanation =
          "You have good compatibility with this match. " +
          "Our algorithm suggests you might share some common interests and values. " +
          "We recommend starting a conversation to explore your connection further.";

        return NextResponse.json({
          match: fallbackMatch,
          compatibilityScore: fallbackScore,
          explanation: fallbackExplanation,
          remainingMatches: mockUserSubscription.matchesRemaining,
          demo: true, // Flag to indicate this is demo data
        });
      }
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get("refresh") === "true";

    // In a real app, we would fetch from database
    // For demo, we'll use mock data and randomly select a match

    // Check if user has remaining matches (for free tier)
    if (
      mockUserSubscription.planId === "free" &&
      mockUserSubscription.matchesRemaining <= 0
    ) {
      return NextResponse.json(
        {
          error: "You've reached your monthly match limit",
          remainingMatches: 0,
        },
        { status: 403 }
      );
    }

    // Randomly select a match
    const randomIndex = Math.floor(Math.random() * mockMatches.length);
    const match = mockMatches[randomIndex];

    // Generate compatibility score (in a real app, this would be calculated)
    const compatibilityScore = Math.floor(Math.random() * 40) + 60; // 60-99

    // Generate AI explanation for the match
    let explanation = "";
    try {
      explanation = generateMatchExplanation(
        compatibilityScore,
        match.personalityType || ""
      );
    } catch (error) {
      console.error("Error generating match explanation:", error);
      // Fallback explanation if the function fails
      explanation =
        `You have a ${compatibilityScore}% compatibility with this match. ` +
        `This suggests you share some important values and interests. ` +
        `We recommend starting a conversation to explore your connection further.`;
    }

    // Decrement remaining matches for free tier users
    let remainingMatches = null;
    if (mockUserSubscription.planId === "free") {
      remainingMatches = refresh
        ? mockUserSubscription.matchesRemaining - 1
        : mockUserSubscription.matchesRemaining;
    }

    return NextResponse.json({
      match,
      compatibilityScore,
      explanation,
      remainingMatches,
    });
  } catch (error) {
    console.error("Error in getMatch API:", error);

    // Return a fallback match in case of error
    const fallbackMatch = mockMatches[0];
    const fallbackScore = 70;
    const fallbackExplanation =
      "You have good compatibility with this match. " +
      "Our algorithm suggests you might share some common interests and values. " +
      "We recommend starting a conversation to explore your connection further.";

    return NextResponse.json({
      match: fallbackMatch,
      compatibilityScore: fallbackScore,
      explanation: fallbackExplanation,
      remainingMatches:
        mockUserSubscription.planId === "free"
          ? mockUserSubscription.matchesRemaining
          : null,
      demo: true, // Flag to indicate this is demo data
    });
  }
}

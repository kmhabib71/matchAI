import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to save quiz data" },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Get the quiz data from the request
    const data = await req.json();
    const { answers, completedAt } = data;

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: "No quiz answers provided" },
        { status: 400 }
      );
    }

    // Find the user by their email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine personality traits based on answers (simplified example)
    const traits = [];

    // Simple trait determination based on a few key questions
    if (answers["1"] === "Introvert") {
      traits.push("Introspective", "Thoughtful");
    } else if (answers["1"] === "Extrovert") {
      traits.push("Outgoing", "Sociable");
    } else if (answers["1"] === "Ambivert") {
      traits.push("Balanced", "Adaptable");
    }

    if (answers["2"] === "Emotional") {
      traits.push("Empathetic", "Sensitive");
    } else if (answers["2"] === "Logical") {
      traits.push("Analytical", "Objective");
    } else if (answers["2"] === "Balanced") {
      traits.push("Practical", "Reasonable");
    }

    // Basic personality type (simplified MBTI-like)
    let personalityType = "";

    // E/I: Extrovert or Introvert
    personalityType += answers["1"] === "Extrovert" ? "E" : "I";

    // N/S: Intuitive or Sensing (based on question 10 about partner values)
    personalityType += ["Intelligence", "Humor"].includes(answers["10"])
      ? "N"
      : "S";

    // T/F: Thinking or Feeling
    personalityType += answers["2"] === "Logical" ? "T" : "F";

    // J/P: Judging or Perceiving (based on conflict handling)
    personalityType += ["Talk openly", "Need space"].includes(answers["3"])
      ? "J"
      : "P";

    // Update the user's profile with the quiz data
    user.personalityQuiz = {
      completed: true,
      answers,
      completedAt: new Date(completedAt) || new Date(),
      personalityType,
      traits,
    };

    // Also update user's main profile personality type
    user.personalityType = personalityType;

    // Save the updated user
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Quiz data saved successfully",
      personalityType,
      traits,
    });
  } catch (error: any) {
    console.error("Error saving quiz data:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

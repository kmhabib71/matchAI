import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  let userId = "";

  try {
    // Ensure params is awaited before using its properties
    const resolvedParams = await params;
    userId = resolvedParams.id;

    console.log("Received params:", resolvedParams); // Debug log

    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const usersCollection = db.collection("users");
    const rawUser = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!rawUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userProfile = {
      _id: rawUser._id.toString(),
      name: rawUser.name,
      profileImage: rawUser.profileImage,
      age: rawUser.age,
      gender: rawUser.gender,
      profession: rawUser.profession || rawUser.occupation,
      education: rawUser.education,
      location: rawUser.location,
      bio: rawUser.bio,
      interests: rawUser.interests || [],
      personalityType: rawUser.personalityType,
      personalityQuiz: rawUser.personalityQuiz
        ? {
            completed: rawUser.personalityQuiz.completed || false,
            type: rawUser.personalityQuiz.type,
            traits: rawUser.personalityQuiz.traits || [],
            answers: rawUser.personalityQuiz.answers || {},
          }
        : null,
      relationshipGoals: rawUser.relationshipGoals,
      lifestyle: rawUser.lifestyle,
      religion:
        rawUser.religion ||
        (rawUser.lifestyle ? rawUser.lifestyle.religion : null),
      relationshipStatus: rawUser.relationshipStatus,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    };

    return NextResponse.json({
      user: userProfile,
      success: true,
    });
  } catch (error: any) {
    console.error(`Error fetching user profile by ID ${userId}:`, error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

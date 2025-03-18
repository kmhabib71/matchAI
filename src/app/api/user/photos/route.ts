import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { uploadToS3, generateUniqueFileName, deleteFromS3 } from "@/lib/s3";
import { getUserFromToken } from "@/lib/utils";
import jwt from "jsonwebtoken";

// Maximum number of photos a user can have
const MAX_PHOTOS = 10;

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Helper function to get user from session or token
async function getUser(req: NextRequest) {
  // First try with NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (user) return user;
  }

  // Then try with token
  const token =
    req.cookies.get("authToken")?.value ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      email?: string;
    };

    const userId = decoded.userId || decoded.id;
    if (!userId) return null;

    await dbConnect();
    return await User.findById(userId);
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Helper function to parse form data
async function parseFormData(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const isProfilePhoto = formData.get("isProfilePhoto") === "true";

  if (!file) {
    throw new Error("No file provided");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the 5MB limit");
  }

  // Check file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  return { buffer, file, isProfilePhoto };
}

// GET handler to retrieve user photos
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session or token
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to access your photos", demo: true },
        { status: 401 }
      );
    }

    // Return demo data if requested
    const url = new URL(req.url);
    const demo = url.searchParams.get("demo") === "true";

    if (demo) {
      return NextResponse.json({
        profileImage: "https://example.com/demo-profile.jpg",
        additionalPhotos: [
          "https://example.com/demo-photo1.jpg",
          "https://example.com/demo-photo2.jpg",
        ],
        demo: true,
      });
    }

    return NextResponse.json({
      profileImage: user.profileImage || "",
      additionalPhotos: user.additionalPhotos || [],
    });
  } catch (error: any) {
    console.error("Error retrieving user photos:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve photos" },
      { status: 500 }
    );
  }
}

// POST handler to upload a new photo
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session or token
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to upload photos" },
        { status: 401 }
      );
    }

    // Parse form data
    const { buffer, file, isProfilePhoto } = await parseFormData(req);

    // Check if user has reached the maximum number of photos
    if (
      !isProfilePhoto &&
      user.additionalPhotos &&
      user.additionalPhotos.length >= MAX_PHOTOS - 1
    ) {
      return NextResponse.json(
        {
          error: `You can only upload up to ${
            MAX_PHOTOS - 1
          } additional photos`,
        },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileName = generateUniqueFileName(file.name);

    // Upload to S3
    const fileUrl = await uploadToS3(buffer, fileName, file.type);

    // Update user document
    if (isProfilePhoto) {
      // Delete old profile image if it exists
      if (user.profileImage) {
        try {
          await deleteFromS3(user.profileImage);
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }

      user.profileImage = fileUrl;
    } else {
      // Initialize additionalPhotos array if it doesn't exist
      if (!user.additionalPhotos) {
        user.additionalPhotos = [];
      }

      user.additionalPhotos.push(fileUrl);
    }

    await user.save();

    return NextResponse.json({
      message: "Photo uploaded successfully",
      url: fileUrl,
      isProfilePhoto,
    });
  } catch (error: any) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photo" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a photo
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session or token
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to delete photos" },
        { status: 401 }
      );
    }

    // Get the photo URL from the request
    const { photoUrl, isProfilePhoto } = await req.json();

    if (!photoUrl) {
      return NextResponse.json(
        { error: "No photo URL provided" },
        { status: 400 }
      );
    }

    // Delete from S3
    try {
      await deleteFromS3(photoUrl);
    } catch (error) {
      console.error("Error deleting photo from S3:", error);
    }

    // Update user document
    if (isProfilePhoto) {
      user.profileImage = "";
    } else {
      user.additionalPhotos = user.additionalPhotos.filter(
        (url: string) => url !== photoUrl
      );
    }

    await user.save();

    return NextResponse.json({
      message: "Photo deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete photo" },
      { status: 500 }
    );
  }
}

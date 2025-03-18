import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import {
  VerificationMethod,
  VerificationStatus,
  generateVerificationToken,
  generateVerificationHash,
  sendEmailVerification,
  sendSMSVerification,
  calculateVerificationScore,
} from "@/lib/verification/profileVerification";
import crypto from "crypto";

// GET handler to retrieve user's verification status
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate verification score
    const verificationScore = calculateVerificationScore(user);

    // Update user's verification score if it has changed
    if (user.verificationScore !== verificationScore) {
      user.verificationScore = verificationScore;
      await user.save();
    }

    // Return verification status
    return NextResponse.json({
      verifications: user.verifications || [],
      verificationScore,
    });
  } catch (error) {
    console.error("Verification status error:", error);
    return NextResponse.json(
      { error: "Failed to get verification status" },
      { status: 500 }
    );
  }
}

// POST handler to initiate a new verification
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { method, value } = body;

    if (!method || !Object.values(VerificationMethod).includes(method)) {
      return NextResponse.json(
        { error: "Invalid verification method" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize verifications array if it doesn't exist
    if (!user.verifications) {
      user.verifications = [];
    }

    // Handle different verification methods
    switch (method) {
      case VerificationMethod.EMAIL: {
        if (!value || typeof value !== "string") {
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          );
        }

        // Generate verification token
        const token = generateVerificationToken();
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = generateVerificationHash(token, salt);

        // Store verification record
        const existingIndex = user.verifications.findIndex(
          (v) => v.method === VerificationMethod.EMAIL
        );

        const verificationRecord = {
          method: VerificationMethod.EMAIL,
          status: VerificationStatus.PENDING,
          metadata: {
            email: value,
            hash,
            salt,
            attempts: 0,
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        if (existingIndex >= 0) {
          user.verifications[existingIndex] = verificationRecord;
        } else {
          user.verifications.push(verificationRecord);
        }

        await user.save();

        // Send verification email
        await sendEmailVerification(value, token);

        return NextResponse.json({
          message: "Verification email sent",
          method,
        });
      }

      case VerificationMethod.PHONE: {
        if (!value || typeof value !== "string") {
          return NextResponse.json(
            { error: "Phone number is required" },
            { status: 400 }
          );
        }

        // Generate verification token
        const token = generateVerificationToken();
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = generateVerificationHash(token, salt);

        // Store verification record
        const existingIndex = user.verifications.findIndex(
          (v) => v.method === VerificationMethod.PHONE
        );

        const verificationRecord = {
          method: VerificationMethod.PHONE,
          status: VerificationStatus.PENDING,
          metadata: {
            phone: value,
            hash,
            salt,
            attempts: 0,
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        if (existingIndex >= 0) {
          user.verifications[existingIndex] = verificationRecord;
        } else {
          user.verifications.push(verificationRecord);
        }

        await user.save();

        // Send verification SMS
        await sendSMSVerification(value, token);

        return NextResponse.json({
          message: "Verification SMS sent",
          method,
        });
      }

      case VerificationMethod.SOCIAL: {
        if (
          !value ||
          typeof value !== "object" ||
          !value.platform ||
          !value.profileUrl
        ) {
          return NextResponse.json(
            { error: "Platform and profile URL are required" },
            { status: 400 }
          );
        }

        // Store verification record
        const existingIndex = user.verifications.findIndex(
          (v) =>
            v.method === VerificationMethod.SOCIAL &&
            v.metadata?.platform === value.platform
        );

        const verificationRecord = {
          method: VerificationMethod.SOCIAL,
          status: VerificationStatus.PENDING,
          metadata: {
            platform: value.platform,
            profileUrl: value.profileUrl,
            submittedAt: new Date(),
          },
        };

        if (existingIndex >= 0) {
          user.verifications[existingIndex] = verificationRecord;
        } else {
          user.verifications.push(verificationRecord);
        }

        await user.save();

        return NextResponse.json({
          message: `${value.platform} verification request submitted for review`,
          method,
        });
      }

      case VerificationMethod.ID:
      case VerificationMethod.PHOTO: {
        if (!value || typeof value !== "string") {
          return NextResponse.json(
            { error: "Document or photo URL is required" },
            { status: 400 }
          );
        }

        // Store verification record
        const existingIndex = user.verifications.findIndex(
          (v) => v.method === method
        );

        const verificationRecord = {
          method,
          status: VerificationStatus.PENDING,
          metadata: {
            documentUrl: value,
            submittedAt: new Date(),
          },
        };

        if (existingIndex >= 0) {
          user.verifications[existingIndex] = verificationRecord;
        } else {
          user.verifications.push(verificationRecord);
        }

        await user.save();

        return NextResponse.json({
          message: `${method} verification request submitted for review`,
          method,
        });
      }

      default:
        return NextResponse.json(
          { error: "Unsupported verification method" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Verification request error:", error);
    return NextResponse.json(
      { error: "Failed to process verification request" },
      { status: 500 }
    );
  }
}

// PUT handler to verify a token (for email and phone verification)
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { method, token } = body;

    if (!method || !token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Method and token are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the verification record
    const verificationIndex = user.verifications?.findIndex(
      (v) => v.method === method && v.status === VerificationStatus.PENDING
    );

    if (verificationIndex === undefined || verificationIndex === -1) {
      return NextResponse.json(
        { error: "No pending verification found for this method" },
        { status: 404 }
      );
    }

    const verification = user.verifications[verificationIndex];

    // Check if verification has expired
    if (
      verification.expiresAt &&
      new Date(verification.expiresAt) < new Date()
    ) {
      return NextResponse.json(
        { error: "Verification has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify token
    const { hash, salt } = verification.metadata;

    if (!hash || !salt) {
      return NextResponse.json(
        { error: "Invalid verification data" },
        { status: 400 }
      );
    }

    // Compute hash from provided token
    const computedHash = crypto
      .createHmac("sha256", salt)
      .update(token)
      .digest("hex");

    // Check if hashes match
    if (computedHash !== hash) {
      // Increment attempts
      verification.metadata.attempts =
        (verification.metadata.attempts || 0) + 1;

      // If too many attempts, invalidate the verification
      if (verification.metadata.attempts >= 5) {
        verification.status = VerificationStatus.REJECTED;
        await user.save();

        return NextResponse.json(
          {
            error:
              "Too many failed attempts. Please request a new verification.",
          },
          { status: 400 }
        );
      }

      await user.save();

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Mark as verified
    verification.status = VerificationStatus.VERIFIED;
    verification.verifiedAt = new Date();

    // Update user's verification score
    user.verificationScore = calculateVerificationScore(user);

    await user.save();

    return NextResponse.json({
      message: "Verification successful",
      method,
      verificationScore: user.verificationScore,
    });
  } catch (error) {
    console.error("Verification confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 }
    );
  }
}

import { IUser } from "@/models/User";
import crypto from "crypto";

// Verification status types
export enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

// Verification method types
export enum VerificationMethod {
  EMAIL = "email",
  PHONE = "phone",
  ID = "id",
  SOCIAL = "social",
  PHOTO = "photo",
}

// Verification record interface
export interface VerificationRecord {
  method: VerificationMethod;
  status: VerificationStatus;
  verifiedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Generate a verification token for email or phone verification
 */
export function generateVerificationToken(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a verification hash for secure storage
 */
export function generateVerificationHash(token: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(token).digest("hex");
}

/**
 * Verify a token against a stored hash
 */
export function verifyToken(
  token: string,
  hash: string,
  salt: string
): boolean {
  const computedHash = generateVerificationHash(token, salt);
  return computedHash === hash;
}

/**
 * Send email verification code
 * In a real app, this would connect to an email service
 */
export async function sendEmailVerification(
  email: string,
  token: string
): Promise<boolean> {
  console.log(
    `[DEV ONLY] Sending verification email to ${email} with token: ${token}`
  );
  // In production, this would use a real email service like SendGrid, Mailchimp, etc.
  return true;
}

/**
 * Send SMS verification code
 * In a real app, this would connect to an SMS service
 */
export async function sendSMSVerification(
  phone: string,
  token: string
): Promise<boolean> {
  console.log(
    `[DEV ONLY] Sending verification SMS to ${phone} with token: ${token}`
  );
  // In production, this would use a real SMS service like Twilio, Nexmo, etc.
  return true;
}

/**
 * Verify a user's social media profile
 * In a real app, this would connect to social media APIs
 */
export async function verifySocialProfile(
  userId: string,
  platform: string,
  profileUrl: string
): Promise<{ verified: boolean; metadata?: any }> {
  // In production, this would verify the profile using the platform's API
  console.log(
    `[DEV ONLY] Verifying ${platform} profile for user ${userId}: ${profileUrl}`
  );

  // Simulate verification
  const verified = profileUrl.includes(platform.toLowerCase());

  return {
    verified,
    metadata: {
      platform,
      profileUrl,
      verificationMethod: "api",
    },
  };
}

/**
 * Verify a user's ID document
 * In a real app, this would connect to an ID verification service
 */
export async function verifyIDDocument(
  userId: string,
  documentType: string,
  documentImageUrl: string
): Promise<{ verified: boolean; metadata?: any }> {
  // In production, this would use a service like Jumio, Onfido, etc.
  console.log(`[DEV ONLY] Verifying ${documentType} for user ${userId}`);

  // Simulate verification
  const verified = true;

  return {
    verified,
    metadata: {
      documentType,
      verificationMethod: "manual",
      verificationDate: new Date(),
    },
  };
}

/**
 * Verify a user's photo using facial recognition
 * In a real app, this would connect to a facial recognition service
 */
export async function verifyUserPhoto(
  userId: string,
  photoUrl: string,
  idPhotoUrl: string
): Promise<{ verified: boolean; confidence?: number; metadata?: any }> {
  // In production, this would use a service like Amazon Rekognition, Face++, etc.
  console.log(`[DEV ONLY] Verifying photo for user ${userId}`);

  // Simulate verification with random confidence score between 75-100%
  const confidence = 75 + Math.random() * 25;
  const verified = confidence > 80;

  return {
    verified,
    confidence,
    metadata: {
      verificationMethod: "facial_recognition",
      verificationDate: new Date(),
    },
  };
}

/**
 * Calculate a user's verification score based on completed verifications
 * @param user The user object with verification records
 * @returns A score from 0-100 representing verification completeness
 */
export function calculateVerificationScore(user: IUser): number {
  if (!user.verifications || user.verifications.length === 0) {
    return 0;
  }

  // Define weights for different verification methods
  const weights = {
    [VerificationMethod.EMAIL]: 15,
    [VerificationMethod.PHONE]: 15,
    [VerificationMethod.SOCIAL]: 20,
    [VerificationMethod.ID]: 25,
    [VerificationMethod.PHOTO]: 25,
  };

  // Calculate score based on verified methods
  let score = 0;
  const verifiedMethods = user.verifications
    .filter((v) => v.status === VerificationStatus.VERIFIED)
    .map((v) => v.method);

  verifiedMethods.forEach((method) => {
    score += weights[method] || 0;
  });

  return Math.min(100, score);
}

/**
 * Get verification badge level based on verification score
 */
export function getVerificationBadge(score: number): string {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 50) return "silver";
  if (score >= 25) return "bronze";
  return "none";
}

/**
 * Check if a user meets the minimum verification requirements
 */
export function meetsMinimumVerification(user: IUser): boolean {
  if (!user.verifications) return false;

  // At minimum, users should have verified email
  const hasVerifiedEmail = user.verifications.some(
    (v) =>
      v.method === VerificationMethod.EMAIL &&
      v.status === VerificationStatus.VERIFIED
  );

  return hasVerifiedEmail;
}

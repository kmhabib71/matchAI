import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import {
  VerificationMethod,
  VerificationStatus,
} from "@/lib/verification/profileVerification";

// Interface for verification records
export interface IVerificationRecord {
  method: VerificationMethod;
  status: VerificationStatus;
  verifiedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// Interface for user interactions
export interface IUserInteractions {
  nextMatchClicks: number;
  messagesSent: number;
  messagesReceived: number;
  lastActive?: Date;
}

// Interface for match records
export interface IMatchRecord {
  userId: mongoose.Types.ObjectId;
  compatibilityScore?: number;
  explanation?: string;
  viewedAt?: Date;
}

// Interface for user preferences
export interface IUserPreferences {
  minAge: number;
  maxAge: number;
  distance: number;
  relationshipGoals: string[];
  dealBreakers: string[];
}

// Interface for user subscription
export interface IUserSubscription {
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

// User roles enum
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

// Interface for user document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  orientation: string;
  location: {
    type: string;
    coordinates: number[];
    city?: string;
    country?: string;
  };
  bio?: string;
  profileImage?: string;
  additionalPhotos?: string[];
  personalityType?: string;
  interests?: string[];
  relationshipGoals?: string[];
  lifestyle?: {
    drinking?: string;
    smoking?: string;
    exercise?: string;
    diet?: string;
    religion?: string;
    politics?: string;
    children?: string;
    pets?: string;
  };
  dealBreakers?: string[];
  preferences: IUserPreferences;
  currentMatch?: IMatchRecord;
  previousMatches?: IMatchRecord[];
  subscription?: IUserSubscription;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  interactions?: IUserInteractions;
  verifications?: IVerificationRecord[];
  verificationScore?: number;
  roles: UserRole[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    orientation: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
      city: { type: String },
      country: { type: String },
    },
    bio: { type: String },
    profileImage: { type: String },
    additionalPhotos: { type: [String] },
    personalityType: { type: String },
    interests: { type: [String] },
    relationshipGoals: { type: [String] },
    lifestyle: {
      drinking: { type: String },
      smoking: { type: String },
      exercise: { type: String },
      diet: { type: String },
      religion: { type: String },
      politics: { type: String },
      children: { type: String },
      pets: { type: String },
    },
    dealBreakers: { type: [String] },
    preferences: {
      minAge: { type: Number, default: 18 },
      maxAge: { type: Number, default: 99 },
      distance: { type: Number, default: 50 }, // in miles or km
      relationshipGoals: { type: [String] },
      dealBreakers: { type: [String] },
    },
    currentMatch: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      compatibilityScore: { type: Number },
      explanation: { type: String },
    },
    previousMatches: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        compatibilityScore: { type: Number },
        explanation: { type: String },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    subscription: {
      planId: { type: String, enum: ["free", "monthly", "yearly"] },
      status: { type: String, enum: ["active", "canceled", "expired"] },
      currentPeriodStart: { type: Date },
      currentPeriodEnd: { type: Date },
      createdAt: { type: Date },
    },
    profileCompleted: { type: Boolean, default: false },
    interactions: {
      nextMatchClicks: { type: Number, default: 0 },
      messagesSent: { type: Number, default: 0 },
      messagesReceived: { type: Number, default: 0 },
      lastActive: { type: Date },
    },
    verifications: [
      {
        method: {
          type: String,
          enum: Object.values(VerificationMethod),
          required: true,
        },
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        verifiedAt: { type: Date },
        expiresAt: { type: Date },
        metadata: { type: Schema.Types.Mixed },
      },
    ],
    verificationScore: { type: Number, default: 0 },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.USER],
    },
  },
  { timestamps: true }
);

// Only create indexes on the server side to prevent client-side errors
if (typeof window === "undefined") {
  // Create index for location-based queries
  UserSchema.index({ location: "2dsphere" });

  // Create index for email for faster lookups
  UserSchema.index({ email: 1 });
}

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return next();
  } catch (error: any) {
    return next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    if (!this.password) {
      console.log("User has no password stored");
      return false;
    }

    if (!candidatePassword) {
      console.log("No candidate password provided");
      return false;
    }

    console.log("Comparing password...");
    // Use a direct comparison to avoid any issues
    const isMatch = await bcrypt.compare(
      candidatePassword.toString(),
      this.password.toString()
    );
    console.log(`Password match result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error("Error comparing password:", error);
    return false;
  }
};

// Delete the model if it exists to prevent OverwriteModelError
const User =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;

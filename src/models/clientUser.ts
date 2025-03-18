// This is a client-side safe version of the User model
// It doesn't include any server-side specific functionality that would cause errors in the browser

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
  userId: string;
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
export interface IUser {
  _id: string;
  name: string;
  email: string;
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
}

// Client-side helper functions for user data
export const getUserDisplayName = (user: IUser): string => {
  return user.name || user.email.split("@")[0];
};

export const getUserAge = (user: IUser): number => {
  return user.age || 0;
};

export const getUserLocation = (user: IUser): string => {
  if (!user.location) return "";

  if (typeof user.location === "string") return user.location;

  if (user.location.city && user.location.country) {
    return `${user.location.city}, ${user.location.country}`;
  }

  return user.location.city || user.location.country || "";
};

export const isProfileComplete = (user: IUser): boolean => {
  return !!user.profileCompleted;
};

export default {
  getUserDisplayName,
  getUserAge,
  getUserLocation,
  isProfileComplete,
};

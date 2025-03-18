// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  age?: number;
  gender?: string;
  orientation?: string;
  personalityType?: string;
  bio?: string;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Location interface
export interface Location {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Lifestyle interface
export interface Lifestyle {
  drinking?: string;
  smoking?: string;
  diet?: string;
  exercise?: string;
  religion?: string;
  pets?: string;
  children?: string;
  [key: string]: string | undefined;
}

// Match interface
export interface Match {
  _id: string;
  name: string;
  age: number;
  location?: Location;
  profileImage?: string;
  personalityType?: string;
  bio?: string;
  interests?: string[];
  relationshipGoals?: string[];
  lifestyle?: Lifestyle;
  compatibilityScore?: number;
}

// Match explanation interface
export interface MatchExplanation {
  compatibilityScore: number;
  explanation: string;
  compatibilityFactors?: {
    personality?: number;
    interests?: number;
    goals?: number;
    lifestyle?: number;
  };
}

// Subscription interface
export interface Subscription {
  id: string;
  userId: string;
  planId: "free" | "monthly" | "yearly";
  status: "active" | "canceled" | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  matchesRemaining?: number;
  totalMatchesAllowed?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Report interface
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: Date;
  updatedAt?: Date;
}

// Verification interface
export interface Verification {
  id: string;
  userId: string;
  type: "identity" | "photo" | "background";
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  notes?: string;
}

// NextAuth extended types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      age?: number;
      gender?: string;
      orientation?: string;
      personalityType?: string;
      verified?: boolean;
    };
  }
}

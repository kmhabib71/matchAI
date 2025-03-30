// src/app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import dbConnect from "@/lib/db/mongodb";
import User from "@/models/User";
import { DefaultSession } from "next-auth";

// Define custom user properties
interface CustomUser {
  id: string;
  subscription?: string;
  age?: number;
  gender?: string;
  orientation?: string;
  personalityType?: string;
  verified?: boolean;
}

// Define custom session properties
interface CustomSession {
  user: CustomUser & DefaultSession["user"];
}
console.log("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          await dbConnect();

          console.log(`Attempting login for email: ${credentials.email}`);
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.log(`User not found with email: ${credentials.email}`);
            return null;
          }

          console.log("User found, comparing password...");
          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          console.log(`Password validation result: ${isPasswordValid}`);
          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }

          console.log("Login successful");
          return {
            id: user._id?.toString() || "",
            email: user.email,
            name: user.name,
            subscription: user.subscription?.status || "Free",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || undefined;
        token.name = user.name || undefined;
        token.subscription = user.subscription as string | undefined;
      }

      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Type assertion to avoid TypeScript errors
        const user = session.user as CustomUser & DefaultSession["user"];
        user.id = token.id;
        user.email = token.email as string;
        user.name = token.name as string;
        user.subscription = token.subscription;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        await dbConnect();

        const email = user.email;

        if (!email) {
          return false;
        }

        try {
          // Check if user exists
          const existingUser = await User.findOne({ email });

          if (!existingUser) {
            // Extract profile data safely
            const profileData = profile as Record<string, any>;

            // Create a new user with social login
            const newUser = new User({
              name: user.name || profileData?.name || "User",
              email,
              profileImage: user.image || profileData?.picture,
              // Set default values for required fields
              age: 18, // Default age
              gender: "Not specified", // Default gender - user will set this in profile
              orientation: "Not specified",
              location: {
                type: "Point",
                coordinates: [0, 0], // Default coordinates
                city: "Not specified",
                country: "Not specified",
              },
              relationshipGoals: ["Casual"],
              profileCompleted: false,
            });

            await newUser.save();
          }

          // Always return true to allow the sign-in
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false; // Deny sign-in if there's an error
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
  debug: process.env.NODE_ENV === "development",
};

// Add type definitions for NextAuth
declare module "next-auth" {
  interface User extends CustomUser {}

  interface Session extends CustomSession {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    name?: string;
    subscription?: string;
    provider?: string;
  }
}

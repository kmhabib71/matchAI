export const runtime = "nodejs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { dbConnect } from "./dbConnect";
import { UserRole } from "@/models/User";
import bcrypt from "bcryptjs";

// Enhanced debug logging
console.log("=== AUTH MODULE INITIALIZATION ===");
console.log("Node Environment:", process.env.NODE_ENV);
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("Environment Check:", {
  GOOGLE_ID_LOADED: Boolean(process.env.GOOGLE_CLIENT_ID),
  NEXTAUTH_SECRET_LOADED: Boolean(process.env.NEXTAUTH_SECRET),
});

// Hardcoded credentials as fallback if environment variables are not loaded
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

// Move environment variable access inside functions or provider configurations
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Connect to MongoDB
          await dbConnect();

          // Get User model
          const { default: User } = await import("@/models/User");

          // Find user
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          // Compare password
          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Check if user has admin role
          const isAdmin = user.roles.includes(UserRole.ADMIN);

          return {
            id: user._id?.toString() || "",
            name: user.name,
            email: user.email,
            image: user.profileImage,
            isAdmin,
            roles: user.roles,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      // Log callback URL construction for debugging
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    FacebookProvider({
      clientId: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/register",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle OAuth providers
      if (account?.provider === "google" || account?.provider === "facebook") {
        console.log(
          `OAuth sign in attempt for ${account.provider}:`,
          user.email
        );

        try {
          await dbConnect();

          // Get User model
          const { default: User } = await import("@/models/User");

          // Check if this email already exists in the database
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            console.log(
              `Creating new user from ${account.provider} login:`,
              user.email
            );

            // Create a new user record with data from OAuth
            const newUser = new User({
              name: user.name || profile?.name || "User",
              email: user.email,
              profileImage: user.image,
              // Set required fields with default values
              age: 18,
              gender: "Not specified",
              orientation: "Not specified",
              location: {
                type: "Point",
                coordinates: [0, 0], // Default coordinates
              },
              profileCompleted: false,
              roles: [UserRole.USER],
              oauthProvider: account.provider, // Store which provider was used
              createdAt: new Date(),
              updatedAt: new Date(),
              // Generate a secure random password for OAuth users (they'll never use it)
              password:
                Math.random().toString(36).slice(-10) +
                Math.random().toString(36).slice(-10),
            });

            // Save the new user to database
            await newUser.save();
            console.log(`New user created with ID: ${newUser._id}`);

            // Return URL with query param to indicate user needs to complete profile
            return true;
          }

          // For existing users, check if profile is completed
          if (!existingUser.profileCompleted) {
            console.log(
              `Existing user found but profile not completed, redirecting to profile completion:`,
              user.email
            );
            return true;
          }

          console.log(
            `Existing user found with completed profile for ${user.email}, proceeding with login`
          );
          return true;
        } catch (error) {
          console.error("Error in OAuth sign in:", error);
          return false; // Reject sign in on error
        }
      }

      return true; // Allow sign in for non-OAuth methods
    },

    async jwt({ token, user, account }) {
      // Log environment variables here if needed for debugging
      if (process.env.NODE_ENV === "development") {
        console.log(
          "JWT callback - GOOGLE_CLIENT_ID:",
          GOOGLE_CLIENT_ID.substring(0, 8) + "..."
        );
        console.log(
          "JWT callback - GOOGLE_CLIENT_SECRET:",
          GOOGLE_CLIENT_SECRET ? "[Set from hardcoded]" : "undefined"
        );
      }

      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin || false;
        token.roles = user.roles || [UserRole.USER];
        // Add OAuth provider information to token
        if (account?.provider) {
          token.provider = account.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Use type assertion to extend the session.user object
        const user = session.user as {
          id: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          isAdmin: boolean;
          roles: string[];
        };

        user.id = token.id as string;
        user.isAdmin = token.isAdmin as boolean;
        user.roles = token.roles as string[];
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your_nextauth_secret",
  debug: process.env.NODE_ENV === "development",
};

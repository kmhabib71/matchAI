import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { verify } from "jsonwebtoken";
// Only import User model on the server side
const isServer = typeof window === "undefined";
// Conditional import to prevent client-side errors
const User = isServer ? require("@/models/User").default : null;
import dbConnect from "@/lib/db/mongodb";

/**
 * Combines multiple class names and merges Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get user from token in cookies or authorization header
export async function getUserFromToken(req: NextRequest) {
  // Only run on the server side
  if (!isServer) {
    console.warn("getUserFromToken called on client side");
    return null;
  }

  try {
    // First try to get user from session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      await dbConnect();
      const user = await User.findOne({ email: session.user.email });
      if (user) return user;
    }

    // If no session, try to get from token
    let token = req.cookies.get("authToken")?.value;

    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    // Verify the token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("NEXTAUTH_SECRET is not defined");
      return null;
    }

    try {
      const decoded = verify(token, secret) as { id: string };

      // Connect to database
      await dbConnect();

      // Find user by ID
      const user = await User.findById(decoded.id);
      return user;
    } catch (error) {
      console.error("Error verifying token:", error);
      return null;
    }
  } catch (error) {
    console.error("Error in getUserFromToken:", error);
    return null;
  }
}

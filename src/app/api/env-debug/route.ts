export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Create an object with environment variable status (not values for security)
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
        ? "Set"
        : "Not set",
      FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID ? "Set" : "Not set",
      FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET
        ? "Set"
        : "Not set",
      ENV_COUNT: Object.keys(process.env).length,
      ENV_KEYS: Object.keys(process.env),
    };

    // Log to server console
    console.log("Environment debug endpoint called");
    console.log("Environment status:", envStatus);

    // Return sanitized response (no actual secrets)
    return NextResponse.json({
      success: true,
      envStatus: {
        ...envStatus,
        // Remove actual keys for security
        ENV_KEYS: Object.keys(process.env).filter(
          (key) =>
            !key.includes("SECRET") &&
            !key.includes("PASSWORD") &&
            !key.includes("KEY")
        ),
      },
    });
  } catch (error) {
    console.error("Error in env-debug route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check environment" },
      { status: 500 }
    );
  }
}

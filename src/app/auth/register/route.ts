import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect(
    new URL("/register", process.env.NEXTAUTH_URL || "http://localhost:3000")
  );
}

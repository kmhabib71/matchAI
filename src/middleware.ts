import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path.startsWith("/api/auth");

  // Define protected paths that require authentication
  const isProtectedPath =
    path === "/profile" ||
    path === "/dashboard" ||
    path === "/subscription" ||
    path === "/messages" ||
    path.startsWith("/chat/") ||
    path.startsWith("/matches/") ||
    path.startsWith("/settings/");

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check for direct login token in cookies
  const directLoginToken = request.cookies.get("authToken")?.value;

  // If the path requires authentication and there's no token, redirect to login
  if (isProtectedPath && !token && !directLoginToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the user is authenticated and trying to access login/register, redirect to dashboard
  // Only redirect if both NextAuth token and direct login token are present
  if (
    isPublicPath &&
    token && // Only check NextAuth token for redirects
    (path === "/login" || path === "/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/matches/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/chat/:path*",
    "/subscription",
    "/login",
    "/register",
  ],
};

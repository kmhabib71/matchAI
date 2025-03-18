"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check for both NextAuth session and direct login token
    const checkAuth = () => {
      const authToken = localStorage.getItem("authToken");
      const user = localStorage.getItem("user");
      setIsAuthenticated(!!(session || (authToken && user)));
    };

    checkAuth();
    // Listen for storage changes
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [session]);

  // Debug logging
  useEffect(() => {
    console.log("Auth Status:", status);
    console.log("Session:", session);
  }, [status, session]);

  const isHomePage = pathname === "/";
  const shouldShowBackground = !isHomePage || isScrolled;

  // Don't render anything while loading
  if (status === "loading") {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Sign out from NextAuth
      await signOut({
        redirect: false,
        callbackUrl: "/",
      });

      // Force a hard navigation to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        shouldShowBackground ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span
              className={`text-xl font-bold ${
                shouldShowBackground ? "text-gray-900" : "text-white"
              }`}
            >
              MatchMaking AI
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={`${
                    shouldShowBackground ? "text-gray-700" : "text-white"
                  } hover:text-purple-600 transition-colors`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/matches"
                  className={`${
                    shouldShowBackground ? "text-gray-700" : "text-white"
                  } hover:text-purple-600 transition-colors`}
                >
                  Matches
                </Link>
                <Link
                  href="/profile"
                  className={`${
                    shouldShowBackground ? "text-gray-700" : "text-white"
                  } hover:text-purple-600 transition-colors`}
                >
                  Profile
                </Link>
              </>
            )}

            {/* Auth Button */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

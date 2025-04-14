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
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Check if user is admin
  useEffect(() => {
    if (session?.user?.email) {
      // Fetch user role from API
      fetch(`/api/users/me`)
        .then((res) => res.json())
        .then((data) => {
          setIsAdmin(data?.roles?.includes("admin"));
        })
        .catch((err) => {
          console.error("Error checking admin status:", err);
        });
    }
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
            {/* Blog Link - visible to all */}
            <Link
              href="/blog"
              className={`${
                shouldShowBackground ? "text-gray-700" : "text-white"
              } hover:text-purple-600 transition-colors`}
            >
              Blog
            </Link>

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
                {isAdmin && (
                  <div className="relative group">
                    <button
                      className={`flex items-center ${
                        shouldShowBackground ? "text-gray-700" : "text-white"
                      } hover:text-purple-600 transition-colors`}
                    >
                      Admin
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <Link
                        href="/admin/users/admins"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100"
                      >
                        Manage Admins
                      </Link>
                      <Link
                        href="/admin/users/test"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100"
                      >
                        Test Users
                      </Link>
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100"
                      >
                        Manage Users
                      </Link>
                      <Link
                        href="/admin/blog"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100"
                      >
                        Manage Blog
                      </Link>
                    </div>
                  </div>
                )}
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

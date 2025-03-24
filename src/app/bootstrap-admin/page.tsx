"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BootstrapAdminPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(true);
  const router = useRouter();

  // Check if there are any admins in the system
  useEffect(() => {
    const checkAdmins = async () => {
      try {
        setIsCheckingAdmins(true);
        const response = await fetch("/api/admin-count");
        const data = await response.json();
        setAdminCount(data.count);
      } catch (error) {
        console.error("Error checking admin count:", error);
        setAdminCount(null);
      } finally {
        setIsCheckingAdmins(false);
      }
    };

    checkAdmins();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter an email address");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/bootstrap-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      setStatus("success");
      setMessage(data.message || "Admin created successfully");
      setAdminCount(data.adminCount || 1);

      // Redirect to admin page after success
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
    }
  };

  const getTitle = () => {
    if (isCheckingAdmins) return "Checking System Status...";
    if (adminCount === 0) return "Create First Admin";
    return "Bootstrap Admin Access";
  };

  const getDescription = () => {
    if (isCheckingAdmins)
      return "Please wait while we check if there are any admins in the system.";
    if (adminCount === 0)
      return "No admins found in the system. Create the first admin user.";
    return "This page allows you to bootstrap admin access when needed. Use with caution.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">{getTitle()}</h1>
        <p className="text-gray-600 mb-6">{getDescription()}</p>

        {isCheckingAdmins ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter registered user email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={status === "loading"}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                The user must already be registered in the system
              </p>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className={`w-full py-2 px-4 rounded-md ${
                status === "loading"
                  ? "bg-gray-400"
                  : adminCount === 0
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-purple-600 hover:bg-purple-700"
              } text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              {status === "loading"
                ? "Processing..."
                : adminCount === 0
                ? "Create First Admin"
                : "Grant Admin Access"}
            </button>

            {message && (
              <div
                className={`p-3 rounded-md ${
                  status === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-purple-600 hover:text-purple-800">
                Return to Home
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

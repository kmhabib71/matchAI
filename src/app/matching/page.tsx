"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MatchingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the matches page
    router.push("/matches");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-purple-700 mb-4">
          Redirecting to Your Matches
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Please wait while we take you to your matches...
        </p>
      </div>

      <div className="relative w-20 h-20 mb-8">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

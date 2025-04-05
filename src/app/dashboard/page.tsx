"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PersonalityQuiz from "@/components/PersonalityQuiz";

interface Match {
  _id: string;
  userId: string;
  name: string;
  age: number;
  location: {
    city?: string;
    country?: string;
    coordinates?: number[];
    type?: string;
  };
  profileImage: string;
  personalityType?: string;
  bio?: string;
  interests?: string[];
  gender: string;
  orientation: string;
  relationshipGoals?: string[];
  compatibilityScore: number;
  explanation?: string;
  matchDate: string;
  lastActive: string;
  hasUnreadMessages?: boolean;
  occupation?: string;
  education?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [previousMatches, setPreviousMatches] = useState<Match[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasPersonalityData, setHasPersonalityData] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check for personality quiz data
    const personalityData = localStorage.getItem("personality_answers");
    setHasPersonalityData(!!personalityData);

    // Fetch user profile to get previous matches
    const fetchPreviousMatches = async () => {
      try {
        setIsLoading(true);
        // Fetch user profile
        const userResponse = await fetch("/api/users/profile");

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await userResponse.json();

        // Check if the user has previous matches
        if (
          userData.user?.previousMatches &&
          userData.user.previousMatches.length > 0
        ) {
          // For each previous match, fetch the full match details
          const matchPromises = userData.user.previousMatches.map(
            async (match: any) => {
              // Get the userId from the match
              let userId;
              if (typeof match.userId === "object") {
                // Handle MongoDB ObjectId stored as { $oid: "..." }
                if (match.userId.$oid) {
                  userId = match.userId.$oid;
                }
                // Handle MongoDB ObjectId reference stored as { _id: "..." }
                else if (match.userId._id) {
                  userId =
                    typeof match.userId._id === "object" &&
                    match.userId._id.$oid
                      ? match.userId._id.$oid
                      : match.userId._id.toString();
                }
                // Handle other object formats
                else {
                  userId = match.userId.toString();
                }
              } else {
                // Direct string ID
                userId = match.userId;
              }

              // Fetch the full match details
              const matchResponse = await fetch(
                `/api/matches?userId=${userId}`
              );

              if (matchResponse.ok) {
                const matchData = await matchResponse.json();
                if (matchData.match) {
                  // Add compatibility score from the previous match
                  matchData.match.compatibilityScore = match.compatibilityScore;
                  matchData.match.explanation = match.explanation;
                  return matchData.match;
                }
              }
              return null;
            }
          );

          // Resolve all promises and filter out nulls
          const matches = (await Promise.all(matchPromises)).filter(Boolean);
          setPreviousMatches(matches);
        }
      } catch (error) {
        console.error("Error fetching previous matches:", error);
        setError("Failed to fetch your matches. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviousMatches();
  }, [status, router]);

  const closeQuiz = () => {
    setShowQuiz(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-purple-700 mb-2">
            Loading Your Dashboard
          </h2>
          <p className="text-gray-600">
            Fetching your matches and profile information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {showQuiz && <PersonalityQuiz isOpen={showQuiz} onClose={closeQuiz} />}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {session?.user?.name}! Here's an overview of your
          matches.
        </p>
      </div>

      {/* Previous Matches Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Your Previous Matches
          </h2>
          <Link
            href="/matches"
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
          >
            Find New Matches
            <svg
              className="w-5 h-5 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {previousMatches.length === 0 ? (
          <div className="bg-purple-50 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No Matches Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't viewed any matches yet. Take our personality quiz to
              find your perfect matches!
            </p>
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-3 rounded-full font-medium"
            >
              Take Personality Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previousMatches.map((match) => (
              <Link href={`/matches/${match._id}`} key={match._id}>
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full cursor-pointer">
                  <div className="relative h-64">
                    <Image
                      src={match.profileImage}
                      alt={`${match.name}'s profile`}
                      fill
                      className="object-cover"
                      unoptimized // Using placeholder images
                    />
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full h-14 w-14 flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <span className="text-lg">
                          {match.compatibilityScore}%
                        </span>
                        <div className="text-xs">Match</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {match.name}, {match.age}
                      </h3>
                      {match.hasUnreadMessages && (
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                          New
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">
                      {typeof match.location === "object"
                        ? `${match.location.city || ""}, ${
                            match.location.country || ""
                          }`
                        : match.location}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(match.interests || [])
                        .slice(0, 3)
                        .map((interest, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center text-sm">
                        <svg
                          className="w-4 h-4 mr-2 text-purple-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span className="text-purple-700">
                          {match.compatibilityScore}% Compatible
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Button at Bottom */}
      <div className="mt-12 text-center py-8 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          Want to Find More Matches?
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {hasPersonalityData
            ? "Take our personality quiz again to refine your matches!"
            : "Take our personality quiz to find your perfect matches based on compatibility!"}
        </p>
        <button
          onClick={() => setShowQuiz(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg inline-flex items-center transition-transform hover:scale-105"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          {hasPersonalityData
            ? "Retake Personality Quiz"
            : "Take Personality Quiz"}
        </button>
      </div>
    </div>
  );
}

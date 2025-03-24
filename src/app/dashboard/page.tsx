"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MatchCard from "@/components/MatchCard";
import MatchExplanation from "@/components/MatchExplanation";
import { Match, Location, Lifestyle } from "@/types";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [compatibilityScore, setCompatibilityScore] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [remainingMatches, setRemainingMatches] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [previousMatches, setPreviousMatches] = useState<any[]>([]);
  const [loadingPreviousMatches, setLoadingPreviousMatches] =
    useState<boolean>(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    fetchCurrentMatch();
    fetchPreviousMatches();
  }, [status, router, retryCount]);

  const fetchCurrentMatch = async () => {
    try {
      setLoading(true);
      setError("");

      // Add authorization header if using direct login
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/match/getMatch", { headers });

      if (!response.ok && response.status !== 401) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch match");
      }

      const data = await response.json();

      if (data.match) {
        setCurrentMatch(data.match);
        setCompatibilityScore(data.compatibilityScore || 0);
        setExplanation(data.explanation || "");
        setRemainingMatches(data.remainingMatches);

        // If this is demo data, show a message
        if (data.demo) {
          setError(
            "You're viewing demo data. Please complete your profile to see real matches."
          );
        }
      } else {
        setCurrentMatch(null);
        // Retry up to 3 times if no match is returned
        if (retryCount < 3) {
          setRetryCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      // Retry up to 3 times on error
      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextMatch = async () => {
    if (remainingMatches !== null && remainingMatches <= 0) {
      setError(
        "You've reached your monthly match limit. Upgrade to Premium for unlimited matches."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Add authorization header if using direct login
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/match/getMatch?refresh=true", {
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch next match");
      }

      if (data.match) {
        setCurrentMatch(data.match);
        setCompatibilityScore(data.compatibilityScore || 0);
        setExplanation(data.explanation || "");
        setRemainingMatches(data.remainingMatches);

        // If this is demo data, show a message
        if (data.demo) {
          setError(
            "You're viewing demo data. Please complete your profile to see real matches."
          );
        }
      } else {
        setCurrentMatch(null);
      }
    } catch (error) {
      console.error("Error fetching next match:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner only for the first 3 seconds
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Function to fetch previous matches
  const fetchPreviousMatches = async () => {
    try {
      setLoadingPreviousMatches(true);
      const response = await fetch("/api/matches/history");

      if (!response.ok) {
        throw new Error("Failed to fetch previous matches");
      }

      const data = await response.json();

      if (data.success && data.data) {
        setPreviousMatches(data.data);
      } else {
        // Fallback to localStorage if API fails
        const storedMatches = localStorage.getItem("previousMatches");
        if (storedMatches) {
          setPreviousMatches(JSON.parse(storedMatches));
        }
      }
    } catch (error) {
      console.error("Error fetching previous matches:", error);
      // Fallback to localStorage
      const storedMatches = localStorage.getItem("previousMatches");
      if (storedMatches) {
        setPreviousMatches(JSON.parse(storedMatches));
      }
    } finally {
      setLoadingPreviousMatches(false);
    }
  };

  // Function to view match details
  const viewMatchDetails = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  if ((status === "loading" || loading) && showSpinner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold dark:text-white">Your Matches</h1>
        <div className="flex space-x-4">
          <Link
            href="/profile"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/subscription"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Subscription
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {remainingMatches !== null && remainingMatches <= 3 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          You have {remainingMatches}{" "}
          {remainingMatches === 1 ? "match" : "matches"} remaining this month.
          <Link href="/subscription" className="underline ml-1">
            Upgrade to Premium
          </Link>{" "}
          for unlimited matches.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {currentMatch ? (
            <MatchCard
              match={{
                _id: currentMatch._id,
                name: currentMatch.name,
                age: currentMatch.age,
                location: currentMatch.location?.city
                  ? `${currentMatch.location.city}, ${
                      currentMatch.location.country || ""
                    }`
                  : "Unknown location",
                profileImage: currentMatch.profileImage,
                compatibilityScore: compatibilityScore,
                personalityType: currentMatch.personalityType,
              }}
              onNextMatch={handleNextMatch}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We couldn't find any matches for you at the moment. Try
                adjusting your preferences or check back later.
              </p>
              <button
                onClick={handleNextMatch}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Find Matches
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {currentMatch && explanation ? (
            <MatchExplanation
              explanation={explanation}
              compatibilityScore={compatibilityScore}
            />
          ) : null}

          {currentMatch && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Details
              </h3>

              <div className="space-y-4">
                {currentMatch.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Bio
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {currentMatch.bio}
                    </p>
                  </div>
                )}

                {currentMatch.interests &&
                  currentMatch.interests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Interests
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {currentMatch.interests.map(
                          (interest: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-200"
                            >
                              {interest}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {currentMatch.relationshipGoals &&
                  currentMatch.relationshipGoals.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Relationship Goals
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {currentMatch.relationshipGoals.map(
                          (goal: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200"
                            >
                              {goal}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {currentMatch.lifestyle && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Lifestyle
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {Object.entries(currentMatch.lifestyle)
                        .filter(([_, value]) => value)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key}:
                            </span>
                            <span className="ml-1 text-gray-800 dark:text-gray-200">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/chat/${currentMatch._id}`}
                  className="w-full block text-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Start Chatting
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Previous Matches Section */}
      <div className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-5">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
            Your Previous Matches
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-gray-500 dark:text-gray-400">
            Here are the people you've matched with previously. Click on a card
            to view more details.
          </p>
        </div>

        {loadingPreviousMatches ? (
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-64 animate-pulse"
              >
                <div className="h-32 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : previousMatches.length === 0 ? (
          <div className="mt-10 text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No previous matches
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You haven't matched with anyone yet. Start exploring matches to
              find your perfect connection.
            </p>
            <div className="mt-6">
              <Link
                href="/matches"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Find Matches
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {previousMatches.map((match) => (
              <div
                key={match.id || match._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                onClick={() => viewMatchDetails(match.id || match._id)}
              >
                <div className="h-40 relative">
                  <Image
                    src={match.profileImage || "/avatars/default.jpg"}
                    alt={`${match.name}'s profile`}
                    fill
                    className="object-cover"
                    unoptimized // Using placeholder images
                  />
                  {/* Compatibility badge */}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-bold rounded-full h-12 w-12 flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <span className="text-sm">
                        {match.compatibilityScore}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {match.name}, {match.age}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {typeof match.location === "object"
                      ? `${match.location.city || ""}, ${
                          match.location.country || ""
                        }`
                      : match.location || "Unknown location"}
                  </div>
                  {match.viewedAt && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Matched on {new Date(match.viewedAt).toLocaleDateString()}
                    </div>
                  )}
                  {match.hasProposal && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Proposal Sent
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  FaArrowLeft,
  FaEnvelope,
  FaRegClock,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import MatchCompatibilityInfo from "@/components/MatchCompatibilityInfo";

// Interface for match data
interface MatchData {
  id: string;
  name: string;
  age: number;
  gender: string;
  location:
    | string
    | {
        city?: string;
        country?: string;
        type?: string;
        coordinates?: number[];
      };
  bio?: string;
  interests?: string[];
  personalityType?: string;
  personality?: {
    traits?: string[];
  };
  profileImage?: string;
  compatibilityScore: number;
  hasProposal: boolean;
  explanation?: string;
  viewedAt?: Date;
}

// Match detail page component
export default function MatchDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [sendingProposal, setSendingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null);

  // Get match ID from URL parameters
  const matchId = params?.id as string;

  // Fetch match data when component mounts
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    fetchMatchDetails();
  }, [status, matchId, router]);

  // Function to fetch match details
  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch match from API
      const response = await fetch(`/api/matches/${matchId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch match details");
      }

      const data = await response.json();

      if (data.success && data.data) {
        setMatch(data.data);
      } else {
        // Try fallback to previously stored matches
        const storedMatches = localStorage.getItem("previousMatches");
        if (storedMatches) {
          const matches = JSON.parse(storedMatches);
          const foundMatch = matches.find(
            (m: any) => m.id === matchId || m._id === matchId
          );
          if (foundMatch) {
            setMatch(foundMatch);
          } else {
            throw new Error("Match not found");
          }
        } else {
          throw new Error("Match not found");
        }
      }
    } catch (error: any) {
      console.error("Error fetching match details:", error);
      setError(error.message || "Failed to load match details");
    } finally {
      setLoading(false);
    }
  };

  // Function to send a proposal
  const sendProposal = async () => {
    try {
      setSendingProposal(true);
      setProposalError(null);
      setProposalSuccess(null);

      if (!proposalMessage.trim()) {
        setProposalError("Please write a message before sending");
        return;
      }

      const response = await fetch("/api/proposals/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: matchId,
          message: proposalMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send proposal");
      }

      setProposalSuccess("Your proposal has been sent! They will be notified.");

      // Update match data to reflect proposal sent
      if (match) {
        setMatch({
          ...match,
          hasProposal: true,
        });
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowProposalModal(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error sending proposal:", error);
      setProposalError(error.message || "Failed to send proposal");
    } finally {
      setSendingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-purple-600 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Loading match details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Error Loading Match
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No Match Found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This match could not be found.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with back button */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Go back"
            >
              <FaArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Match Details
            </h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-r from-purple-600 to-pink-500">
            {match.profileImage && (
              <Image
                src={match.profileImage}
                alt={`${match.name}'s profile`}
                fill
                className="object-cover"
                unoptimized // Using placeholder images
              />
            )}

            {/* Compatibility Score */}
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 text-lg font-bold rounded-full h-16 w-16 flex items-center justify-center shadow-lg">
              <div className="text-center">
                <span>{match.compatibilityScore}%</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {match.name}, {match.age}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {typeof match.location === "object"
                    ? `${match.location.city || ""}, ${
                        match.location.country || ""
                      }`
                    : match.location || "Unknown location"}
                </p>

                {match.viewedAt && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <FaRegClock className="mr-1" />
                    Matched on {new Date(match.viewedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                {!match.hasProposal ? (
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <FaEnvelope className="mr-2" /> Send Proposal
                  </button>
                ) : (
                  <div className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600">
                    <FaCheck className="mr-2" /> Proposal Sent
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {match.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  About {match.name}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {match.bio}
                </p>
              </div>
            )}

            {/* Personality */}
            {match.personalityType && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Personality
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {match.personalityType}
                  </span>
                  {match.personality?.traits?.map(
                    (trait: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                      >
                        {trait}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Interests */}
            {match.interests && match.interests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Interests
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {match.interests.map((interest: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compatibility Info Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Compatibility Analysis
          </h2>
          <MatchCompatibilityInfo
            compatibilityScore={match.compatibilityScore}
            personalityType={match.personalityType}
            traits={match.personality?.traits}
            interests={match.interests}
            explanation={match.explanation}
          />
        </div>
      </div>

      {/* Proposal Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowProposalModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Close modal"
            >
              <FaTimes className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Send Proposal to {match.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Write a personal message to start a conversation
            </p>

            {proposalSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                {proposalSuccess}
              </div>
            )}

            {proposalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
                {proposalError}
              </div>
            )}

            <textarea
              value={proposalMessage}
              onChange={(e) => setProposalMessage(e.target.value)}
              placeholder={`Hello ${match.name}! I noticed we matched and I'd like to get to know you better...`}
              className="w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              disabled={sendingProposal || !!proposalSuccess}
            />

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowProposalModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                disabled={sendingProposal}
              >
                Cancel
              </button>

              <button
                onClick={sendProposal}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  sendingProposal ||
                  !proposalMessage.trim() ||
                  !!proposalSuccess
                }
              >
                {sendingProposal ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Sending...
                  </>
                ) : proposalSuccess ? (
                  <>
                    <FaCheck className="mr-2" /> Sent
                  </>
                ) : (
                  "Send Proposal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

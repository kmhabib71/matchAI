"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface MatchDetail {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  occupation: string;
  education: string;
  profileImages: string[];
  compatibilityScore: number;
  matchExplanation: string;
  matchDate: string;
  lastActive: string;
  conversationStarted: boolean;
}

export default function MatchDetail() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    const fetchMatchDetail = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data for the match detail
        const mockMatch: MatchDetail = {
          id: matchId,
          name: "Sarah Johnson",
          age: 28,
          location: "New York, USA",
          bio: "Passionate about art, travel, and good food. Looking for someone who shares my enthusiasm for exploring new places and trying new cuisines. I work as a graphic designer and spend my free time painting and visiting galleries.",
          interests: [
            "Art",
            "Travel",
            "Cooking",
            "Photography",
            "Hiking",
            "Reading",
          ],
          occupation: "Graphic Designer at Creative Studios",
          education: "BFA in Graphic Design, Rhode Island School of Design",
          profileImages: [
            "/avatars/avatar-1.jpg",
            "/avatars/avatar-1-2.jpg",
            "/avatars/avatar-1-3.jpg",
            "/avatars/avatar-1-4.jpg",
          ],
          compatibilityScore: 92,
          matchExplanation:
            "You both share a passion for art and creative pursuits. Your interest in photography complements Sarah's background in graphic design. You both enjoy outdoor activities like hiking and have similar travel preferences. Your communication styles and values also align well according to our AI analysis.",
          matchDate: "3 days ago",
          lastActive: "2 hours ago",
          conversationStarted: false,
        };

        setMatch(mockMatch);
      } catch (error) {
        console.error("Failed to fetch match details:", error);
        setError("Failed to load match details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (matchId) {
      fetchMatchDetail();
    }
  }, [matchId]);

  const handleNextImage = () => {
    if (match) {
      setActiveImageIndex((prevIndex) =>
        prevIndex === match.profileImages.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (match) {
      setActiveImageIndex((prevIndex) =>
        prevIndex === 0 ? match.profileImages.length - 1 : prevIndex - 1
      );
    }
  };

  const handleMessage = () => {
    // In a real app, this would navigate to the messaging interface
    router.push(`/messages/${matchId}`);
  };

  const handleUnmatch = () => {
    setShowUnmatchModal(true);
  };

  const confirmUnmatch = async () => {
    try {
      // In a real app, this would be an API call to unmatch
      await new Promise((resolve) => setTimeout(resolve, 500));
      setShowUnmatchModal(false);
      router.push("/matches");
    } catch (error) {
      console.error("Failed to unmatch:", error);
    }
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const submitReport = async () => {
    try {
      // In a real app, this would be an API call to submit a report
      await new Promise((resolve) => setTimeout(resolve, 500));
      setShowReportModal(false);
      // Show success message or redirect
    } catch (error) {
      console.error("Failed to submit report:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error || "Match not found"}</p>
          <Link
            href="/matches"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 inline-block"
          >
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/matches"
          className="text-purple-600 hover:text-purple-800 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Matches
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Images Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="relative h-96 w-full">
              <Image
                src={match.profileImages[activeImageIndex]}
                alt={`${match.name}'s profile picture`}
                fill
                style={{ objectFit: "cover" }}
              />

              {match.profileImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
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
                  </button>
                </>
              )}

              <div className="absolute top-0 right-0 m-4">
                <div className="bg-purple-600 text-white text-lg font-bold px-3 py-1 rounded-full">
                  {match.compatibilityScore}% Match
                </div>
              </div>
            </div>

            {match.profileImages.length > 1 && (
              <div className="flex justify-center p-2 gap-2">
                {match.profileImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-2 w-2 rounded-full ${
                      index === activeImageIndex
                        ? "bg-purple-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {match.name}, {match.age}
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Active {match.lastActive}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {match.location}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {match.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={handleMessage}
                  className="flex-1 mr-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Message
                </button>
                <button
                  onClick={handleUnmatch}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Unmatch
                </button>
                <button
                  onClick={handleReport}
                  className="ml-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              About {match.name}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{match.bio}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Occupation
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {match.occupation}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Education
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {match.education}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Why We Matched You
            </h2>
            <div className="flex items-start mb-6">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600 dark:text-purple-300"
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
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {match.compatibilityScore}% Compatibility
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {match.matchExplanation}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Match Timeline
              </h3>
              <div className="flex items-center text-sm">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-1 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-600 dark:text-green-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Matched {match.matchDate}
                </p>
              </div>

              {match.conversationStarted ? (
                <div className="flex items-center text-sm mt-2">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-600 dark:text-blue-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Conversation started
                  </p>
                </div>
              ) : (
                <div className="flex items-center text-sm mt-2">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-500 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No messages yet - Start the conversation!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unmatch Modal */}
      {showUnmatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Unmatch with {match.name}?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This will remove {match.name} from your matches and delete your
              conversation history. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowUnmatchModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnmatch}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Unmatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Report {match.name}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Please let us know why you're reporting this profile. Your report
              will be kept anonymous.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for reporting
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a reason</option>
                <option value="fake_profile">Fake profile</option>
                <option value="inappropriate_content">
                  Inappropriate content
                </option>
                <option value="harassment">Harassment</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional details
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                rows={4}
                placeholder="Please provide any additional information about this report..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason}
                className={`px-4 py-2 rounded-md ${
                  reportReason
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                }`}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

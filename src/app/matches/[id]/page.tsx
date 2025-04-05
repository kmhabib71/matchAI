"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

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
  height?: string;
  relationshipStatus?: string;
  lookingFor?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  socialProfiles?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  compatibilityReasons?: string[];
  sharedValues?: string[];
  topTraits?: string[];
}

export default function MatchDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasPersonalityData, setHasPersonalityData] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<
    "phone" | "email" | "address" | "social"
  >("phone");

  // Add state for proposal functionality
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const [proposalError, setProposalError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check for personality quiz data
    const personalityData = localStorage.getItem("personality_answers");
    setHasPersonalityData(!!personalityData);

    const fetchMatchDetails = async () => {
      try {
        setIsLoading(true);

        // First get user subscription status
        const userResponse = await fetch("/api/users/profile");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const subscriptionLevel = userData.user?.subscriptionLevel || "free";
          setIsPremium(
            subscriptionLevel === "premium_plus" ||
              subscriptionLevel === "premium_basic"
          );
        }

        // Fetch the match by ID
        const matchResponse = await fetch(`/api/matches/${matchId}`);

        if (!matchResponse.ok) {
          throw new Error("Failed to fetch match details");
        }

        const matchData = await matchResponse.json();

        if (matchData.match) {
          setMatch(matchData.match);

          // Record this match view in the database
          try {
            const recordViewResponse = await fetch(
              `/api/matches/record-view?matchId=${matchId}`
            );

            if (recordViewResponse.ok) {
              console.log("Match view recorded in database");
            } else {
              console.error(
                "Failed to record match view:",
                await recordViewResponse.text()
              );
            }
          } catch (error) {
            console.error("Error recording match view:", error);
          }
        } else {
          throw new Error("Match not found");
        }
      } catch (error) {
        console.error("Error fetching match details:", error);
        setError("Failed to fetch match details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchDetails();
  }, [status, router, matchId]);

  const toggleDetailedProfile = () => {
    setShowDetailedProfile(!showDetailedProfile);
  };

  const viewContactInfo = (type: "phone" | "email" | "address" | "social") => {
    setContactType(type);
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
  };

  const upgradeAccount = () => {
    router.push("/subscription");
  };

  const startChat = (matchId: string) => {
    if (!isPremium) {
      setContactType("phone");
      setShowContactModal(true);
      return;
    }
    router.push(`/chat/${matchId}`);
  };

  const viewProfile = (matchId: string) => {
    router.push(`/profile/${matchId}`);
  };

  // Helper function to extract personality traits from MBTI type
  const extractPersonalityTraits = (personalityType?: string): string[] => {
    if (!personalityType) return ["Friendly", "Thoughtful", "Caring", "Kind"];

    const traits: Record<string, string[]> = {
      INTJ: ["Analytical", "Strategic", "Independent", "Decisive"],
      INTP: ["Logical", "Innovative", "Curious", "Objective"],
      ENTJ: ["Decisive", "Efficient", "Goal-oriented", "Direct"],
      ENTP: ["Inventive", "Enthusiastic", "Adaptable", "Quick-thinking"],
      INFJ: ["Insightful", "Principled", "Idealistic", "Compassionate"],
      INFP: ["Creative", "Empathetic", "Authentic", "Idealistic"],
      ENFJ: ["Charismatic", "Inspiring", "Supportive", "Empathetic"],
      ENFP: ["Passionate", "Imaginative", "People-oriented", "Enthusiastic"],
      ISTJ: ["Practical", "Reliable", "Systematic", "Organized"],
      ISFJ: ["Nurturing", "Detail-oriented", "Loyal", "Traditional"],
      ESTJ: ["Organized", "Traditional", "Direct", "Practical"],
      ESFJ: ["Warm", "Conscientious", "Cooperative", "Supportive"],
      ISTP: ["Versatile", "Pragmatic", "Independent", "Analytical"],
      ISFP: ["Artistic", "Sensitive", "Harmonious", "Spontaneous"],
      ESTP: ["Energetic", "Practical", "Spontaneous", "Adaptable"],
      ESFP: ["Enthusiastic", "Friendly", "Fun-loving", "Spontaneous"],
    };

    return (
      traits[personalityType] || ["Friendly", "Thoughtful", "Caring", "Kind"]
    );
  };

  const sendProposal = async () => {
    if (!proposalMessage.trim()) {
      setProposalError("Please enter a message with your proposal");
      return;
    }

    try {
      setIsSendingProposal(true);
      setProposalError("");

      if (!match) {
        throw new Error("No match selected");
      }

      // Call API to send proposal
      const response = await fetch("/api/proposals/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: match._id,
          message: proposalMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send proposal");
      }

      // Show success message
      setProposalSuccess(true);

      // Clear message
      setProposalMessage("");

      // Auto-close modal after 3 seconds
      setTimeout(() => {
        setShowProposalModal(false);
        setProposalSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Failed to send proposal:", error);
      setProposalError(
        error.message || "Failed to send proposal. Please try again."
      );
    } finally {
      setIsSendingProposal(false);
    }
  };

  // Proposal Modal Component
  const ProposalModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
          <button
            onClick={() => setShowProposalModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="text-center mb-6">
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
                  strokeWidth="2"
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              Send a Proposal to {match?.name}
            </h3>

            <p className="text-gray-600 mt-2">
              Write a personal message to express your interest
            </p>
          </div>

          {proposalSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-green-700">
                  Proposal sent successfully! They'll be notified.
                </span>
              </div>
            </div>
          ) : (
            <>
              {proposalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-red-700">{proposalError}</span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label
                  htmlFor="proposal-message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Message
                </label>
                <textarea
                  id="proposal-message"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Hi, I really enjoyed reading your profile and I think we might have a lot in common. I'd love to get to know you better..."
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  Make your message personal and highlight what interested you
                  about their profile
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={sendProposal}
                  disabled={isSendingProposal}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-3 rounded-full font-medium transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSendingProposal ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Sending...
                    </span>
                  ) : (
                    "Send Proposal"
                  )}
                </button>
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Maybe Later
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Contact information subscription modal
  const ContactModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
          <button
            onClick={closeContactModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {contactType === "phone" && (
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              )}
              {contactType === "email" && (
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
              {contactType === "address" && (
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
              {contactType === "social" && (
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              {contactType === "phone" && "View Phone Number"}
              {contactType === "email" && "View Email Address"}
              {contactType === "address" && "View Full Address"}
              {contactType === "social" && "View Social Profiles"}
            </h3>

            <p className="text-gray-600 mt-2">
              Upgrade to Premium to access contact information and connect
              directly with {match?.name}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-start mb-2">
              <svg
                className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Unlimited access to contact details
              </span>
            </div>
            <div className="flex items-start mb-2">
              <svg
                className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Direct messaging with all matches
              </span>
            </div>
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">See who liked your profile</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={upgradeAccount}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-3 rounded-full font-medium transition-transform hover:scale-105"
            >
              Upgrade to Premium
            </button>
            <button
              onClick={closeContactModal}
              className="text-gray-600 hover:text-gray-800"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
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
            Loading Match Details
          </h2>
          <p className="text-gray-600">Getting everything ready for you...</p>
        </div>
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
            href="/dashboard"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {showContactModal && <ContactModal />}
      {showProposalModal && <ProposalModal />}

      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-purple-600 hover:text-purple-800 flex items-center"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Match image section */}
            <div className="md:w-1/2 relative h-96 md:h-auto">
              <Image
                src={match.profileImage}
                alt={`${match.name}'s profile`}
                fill
                className="object-cover"
                unoptimized // Using placeholder images
              />
              {/* Compatibility score badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-lg font-bold rounded-full h-16 w-16 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <span className="text-lg">{match.compatibilityScore}%</span>
                  <div className="text-xs">Match</div>
                </div>
              </div>
              {/* Personality match badge */}
              {hasPersonalityData && (
                <div className="absolute top-4 left-4">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                    Personal Match
                  </div>
                </div>
              )}
            </div>

            {/* Match details section */}
            <div className="md:w-1/2 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold">
                    {match.name}, {match.age}
                  </h2>
                  <p className="text-gray-600">
                    {typeof match.location === "object"
                      ? `${match.location.city || ""}, ${
                          match.location.country || ""
                        }`
                      : match.location}
                  </p>
                </div>
                {match.hasUnreadMessages && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs shadow-md">
                    New Message
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <div>
                    Matched {new Date(match.matchDate).toLocaleDateString()}
                  </div>
                  <div>Active {match.lastActive}</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 via-purple-100 to-pink-50 rounded-xl p-6 mb-6 shadow-md border border-purple-100">
                  <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Match Analysis
                  </h3>

                  {/* Compatibility score visualization */}
                  <div className="flex items-center mb-5">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex items-center">
                      <span className="mr-3 text-4xl">🌟</span>
                      <span>{match.compatibilityScore}% Compatible</span>
                    </div>
                  </div>

                  {/* Display algorithm explanation */}
                  <p className="text-gray-700 text-lg mb-5 font-medium">
                    {match.explanation ||
                      (match.compatibilityScore > 90
                        ? "You have exceptional compatibility with this match"
                        : match.compatibilityScore > 80
                        ? "You have great compatibility with this match"
                        : "You have good compatibility with this match")}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                      <p className="text-gray-700">
                        Their {match.personalityType || "unique"} personality
                        type suggests they are{" "}
                        {match.topTraits?.slice(0, 3).join(", ").toLowerCase()}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                      <p className="text-gray-700">
                        They tend to focus on{" "}
                        {match.personalityType?.includes("N")
                          ? "ideas, possibilities, and the future"
                          : "practical matters, details, and the present"}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                      <p className="text-gray-700">
                        They approach decisions with{" "}
                        {match.personalityType?.includes("T")
                          ? "logical analysis and objective reasoning"
                          : match.personalityType?.includes("F")
                          ? "empathy and consideration for how others will be affected"
                          : "a balance of logic and emotional awareness"}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                      <p className="text-gray-700">
                        Their{" "}
                        {match.personalityType?.includes("E")
                          ? "extroverted"
                          : "introverted"}{" "}
                        nature means they{" "}
                        {match.personalityType?.includes("E")
                          ? "gain energy from social interactions and engagement with others"
                          : "recharge through quiet reflection and alone time"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100 mb-5">
                    <p className="text-gray-700 mb-2">
                      You have {hasPersonalityData ? "several" : "some"}{" "}
                      complementary traits that could create a balanced
                      relationship
                    </p>

                    <p className="text-gray-700">
                      While you may have different approaches in some areas,
                      these differences could help you grow together
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white shadow-md">
                    <p className="font-semibold text-center">
                      We recommend starting a conversation to explore your
                      connection further.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio section */}
              <h3 className="text-lg font-semibold mb-3">Bio</h3>
              <div className="mb-6">
                <p className="text-gray-700">{match.bio}</p>
              </div>

              {/* Basic info section */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Basic Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Occupation:</span>
                    <span className="text-gray-700">
                      {match.occupation || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Education:</span>
                    <span className="text-gray-700">
                      {match.education || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Height:</span>
                    <span className="text-gray-700">
                      {match.height || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Status:</span>
                    <span className="text-gray-700">
                      {match.relationshipStatus || "Single"}
                    </span>
                  </div>
                  <div className="flex items-center col-span-2">
                    <span className="text-gray-500 mr-2">Looking for:</span>
                    <span className="text-gray-700">
                      {match.lookingFor || "Relationship"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Premium feature highlight to motivate subscription */}
              {!isPremium && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg
                        className="h-5 w-5 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Upgrade to Connect
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Premium members are{" "}
                        <span className="font-semibold">5x more likely</span> to
                        find their perfect match. Unlock contact details and
                        start meaningful conversations!
                      </p>
                      <button
                        onClick={upgradeAccount}
                        className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-800"
                      >
                        Upgrade Now →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact buttons section */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => viewContactInfo("phone")}
                    className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Phone Number
                  </button>
                  <button
                    onClick={() => viewContactInfo("email")}
                    className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email Address
                  </button>
                  <button
                    onClick={() => viewContactInfo("address")}
                    className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Full Address
                  </button>
                  <button
                    onClick={() => viewContactInfo("social")}
                    className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    Social Profiles
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(match.interests || [])
                    .slice(0, 4)
                    .map((interest, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  {(match.interests || []).length === 0 && (
                    <>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        Travel
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        Music
                      </span>
                    </>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  Common interests based on profile
                </p>
              </div>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => viewProfile(match._id)}
                  className="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-full font-medium flex-1 flex justify-center items-center"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Full Profile
                </button>
                <button
                  onClick={() => startChat(match._id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium flex-1 flex justify-center items-center"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Start Chat
                </button>
              </div>

              {/* Proposal button */}
              <button
                onClick={() => setShowProposalModal(true)}
                className="w-full mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-full font-medium flex items-center justify-center"
              >
                <svg
                  className="h-5 w-5 mr-2"
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
                Send Proposal
              </button>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <Link
                  href="/dashboard"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-full font-medium flex items-center justify-center"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

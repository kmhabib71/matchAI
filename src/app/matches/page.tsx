"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  personalityQuiz?: {
    answers?: {
      profile_1?: string;
      profile_2?: string;
      profile_3?: string;
      profile_4?: string;
      profile_5?: string;
      profile_6?: string;
      profile_7?: string;
      profile_8?: string;
      profile_9?: string;
      profile_10?: string;
      profile_11?: string;
      profile_12?: string;
      preferences_1?: string;
      preferences_2?: string;
      preferences_3?: string;
      preferences_4?: string;
      preferences_5?: string;
      mbti_1?: string;
      mbti_2?: string;
      mbti_3?: string;
      mbti_4?: string;
      mbti_5?: string;
      mbti_6?: string;
      mbti_7?: string;
      mbti_8?: string;
    };
    completed?: boolean;
    completedAt?: string;
    personalityType?: string;
    traits?: string[];
  };
  lifestyle?: {
    drinking?: string;
    smoking?: string;
    exercise?: string;
    diet?: string;
    religion?: string;
    politics?: string;
    children?: string;
    pets?: string;
  };
}

export default function Matches() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Main match display scenarios:
  // 1. After quiz completion: User completes quiz and is shown a match based on their answers
  // 2. Next Match button: User clicks to see another match suggestion
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNextMatchLoading, setIsNextMatchLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPersonalityData, setHasPersonalityData] = useState(false);
  const [noMoreMatches, setNoMoreMatches] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Track premium status
  const [showPaywall, setShowPaywall] = useState(false); // Show paywall when free limit reached
  const [hasPreviousMatches, setHasPreviousMatches] = useState(false); // Track if user has previous matches
  const [showQuiz, setShowQuiz] = useState(false); // Control PersonalityQuiz visibility
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<
    "phone" | "email" | "address" | "social"
  >("phone");

  // No need for viewedMatches state anymore, as it's tracked in the database
  const [totalMatchesViewed, setTotalMatchesViewed] = useState(0);
  const [subscribedMatchLimit, setSubscribedMatchLimit] = useState(3);
  const [matchesRemaining, setMatchesRemaining] = useState(0);

  // Add state for proposal functionality
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const [proposalError, setProposalError] = useState("");

  const FREE_MATCH_LIMIT = 3; // Free users can see 3 matches

  // Updated to use database information instead of localStorage
  useEffect(() => {
    if (status === "loading") return;
    console.log("data is: ", session);
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Direct user profile check to get previousMatches
    const fetchUserProfile = async () => {
      if (session) {
        try {
          setIsLoading(true);
          const userResponse = await fetch("/api/users/profile");
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log("userData is: ", userData);
            // Check if user has previous matches in their profile
            if (
              userData.user?.previousMatches &&
              userData.user.previousMatches.length > 0
            ) {
              console.log(
                "User has previous matches in profile:",
                userData.user.previousMatches
              );
              setHasPreviousMatches(true);

              // Set correct matches remaining based on previous matches count
              const previousMatchesCount = userData.user.previousMatches.length;

              // Use database count directly instead of localStorage
              setTotalMatchesViewed(previousMatchesCount);

              // For free users, calculate remaining matches consistently
              const remaining = Math.max(
                0,
                FREE_MATCH_LIMIT - previousMatchesCount
              );
              setMatchesRemaining(remaining);
              console.log(
                "Setting matches remaining to:",
                remaining,
                "from previous matches count:",
                previousMatchesCount
              );

              // Get the most recent previous match
              const mostRecentMatch =
                userData.user.previousMatches[
                  userData.user.previousMatches.length - 1
                ];
              console.log("Most recent match from profile:", mostRecentMatch);

              if (mostRecentMatch && mostRecentMatch.userId) {
                // Handle various formats of MongoDB ObjectId that might come from the database
                let userId;
                if (typeof mostRecentMatch.userId === "object") {
                  // Handle MongoDB ObjectId stored as { $oid: "..." }
                  if (mostRecentMatch.userId.$oid) {
                    userId = mostRecentMatch.userId.$oid;
                  }
                  // Handle MongoDB ObjectId reference stored as { _id: "..." }
                  else if (mostRecentMatch.userId._id) {
                    userId =
                      typeof mostRecentMatch.userId._id === "object" &&
                      mostRecentMatch.userId._id.$oid
                        ? mostRecentMatch.userId._id.$oid
                        : mostRecentMatch.userId._id.toString();
                  }
                  // Handle other object formats
                  else {
                    userId = mostRecentMatch.userId.toString();
                  }
                } else {
                  // Direct string ID
                  userId = mostRecentMatch.userId;
                }

                console.log("Type of userId:", typeof userId);
                console.log("Extracted User ID:", userId);

                // Fetch the full match details with exact userId from previousMatches
                const requestUrl = `/api/matches?userId=${userId}`;
                console.log("Request URL:", requestUrl);

                // Make sure to use the exact userId from the previousMatches array
                const matchResponse = await fetch(requestUrl);

                if (matchResponse.ok) {
                  const matchData = await matchResponse.json();
                  console.log("Match data response:", matchData);

                  if (matchData.match) {
                    // We have a match, set it
                    console.log(
                      "Setting match from profile previousMatches:",
                      matchData.match
                    );

                    setMatches([matchData.match]);
                    setIsLoading(false);
                    return true; // Successfully fetched match
                  }
                } else {
                  console.error(
                    "Failed to fetch match details:",
                    await matchResponse.text()
                  );
                }
              }
            } else {
              console.log("User has no previous matches in profile");
              setHasPreviousMatches(false);

              // If no previous matches, user has their full match allotment
              setMatchesRemaining(FREE_MATCH_LIMIT);
              console.log(
                "Setting matches remaining to:",
                FREE_MATCH_LIMIT,
                "for new user"
              );
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      return false; // Failed to fetch match or no matches found
    };

    const initializeMatches = async () => {
      // First try to fetch the user profile directly to check for previous matches
      const hasUserProfileMatch = await fetchUserProfile();

      // If we already found matches from the profile, we're done
      if (hasUserProfileMatch) {
        return;
      }

      // Check for personality quiz data
      const personalityData = localStorage.getItem("quizAnswers");
      if (personalityData) {
        setHasPersonalityData(true);
      } else {
        setHasPersonalityData(false);
      }

      // For quiz-directed matches, we should always process new matches
      const fromQuiz = sessionStorage.getItem("from_quiz") === "true";

      // Initialize variables we'll use in the function
      let matchLimit = FREE_MATCH_LIMIT;
      let isPremiumUser = false;
      let totalMatches = 0;

      // Check subscription level and set appropriate limits
      const checkSubscription = async () => {
        // Get subscription level from API
        let subscriptionLevel = "free";
        let matchesViewedCount = 0;
        let previousMatchesCount = 0;

        try {
          if (session) {
            // If authenticated, get subscription and matches viewed from API
            const userResponse = await fetch("/api/users/profile");
            if (userResponse.ok) {
              const userData = await userResponse.json();

              // Get previous matches count for accurate calculation
              previousMatchesCount =
                userData.user?.previousMatches?.length || 0;

              // Get subscription level
              subscriptionLevel = userData.user?.subscriptionLevel || "free";

              // Use database count directly
              matchesViewedCount = previousMatchesCount;
            }
          } else {
            // If not authenticated, default to free tier
            subscriptionLevel = "free";
            matchesViewedCount = 0;
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
          // Default to free tier if API call fails
          matchesViewedCount = 0;
        }

        // Set total matches viewed state based on previous matches count
        setTotalMatchesViewed(matchesViewedCount);
        totalMatches = matchesViewedCount;

        // Set the subscription limit based on the level
        if (subscriptionLevel === "premium_plus") {
          matchLimit = 999; // Unlimited (effectively)
          isPremiumUser = true;
        } else if (subscriptionLevel === "premium_basic") {
          matchLimit = 10;
          isPremiumUser = true;
        } else {
          matchLimit = FREE_MATCH_LIMIT;
          isPremiumUser = false;
        }

        // Update state with subscription info
        setSubscribedMatchLimit(matchLimit);
        setIsPremium(isPremiumUser);

        // Calculate matches remaining - consistently for all users
        if (subscriptionLevel === "free") {
          setMatchesRemaining(Math.max(0, matchLimit - matchesViewedCount));
        } else {
          setMatchesRemaining(Math.max(0, matchLimit - matchesViewedCount));
        }

        // Show paywall if matches viewed exceeds subscription limit
        if (matchesViewedCount >= matchLimit && !isPremiumUser) {
          setShowPaywall(true);
          return true; // Return true if we should show paywall
        }

        return false; // Continue with match fetch
      };

      // Check if we should show the paywall
      const shouldShowPaywall = await checkSubscription();

      if (shouldShowPaywall) {
        setIsLoading(false);
        return;
      }

      // Fetch new matches without using localStorage viewed array
      try {
        // API call to get matches from database
        // The API should now track viewed matches server-side
        const response = await fetch(
          `/api/matches?list=true${fromQuiz ? "&fromQuiz=true" : ""}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch matches");
        }

        const data = await response.json();
        console.log("match data is: ", data);

        if (!data.matches || data.matches.length === 0) {
          // Only show quiz if we have no matches AND no personality data
          if (!personalityData) {
            setShowQuiz(true);
          } else {
            setNoMoreMatches(true);
          }
          setIsLoading(false);
          return;
        }

        // We'll trust the API to return matches the user hasn't seen
        const filteredMatches = data.matches;

        if (filteredMatches.length === 0) {
          // Only show quiz if we have no matches AND no personality data
          if (!personalityData) {
            setShowQuiz(true);
          } else {
            setNoMoreMatches(true);
          }
          setIsLoading(false);
          return;
        }

        // Sort by compatibility score
        filteredMatches.sort(
          (a: Match, b: Match) => b.compatibilityScore - a.compatibilityScore
        );
        console.log("filtered matches are: ", filteredMatches);

        // Get the top match
        const topMatch = filteredMatches[0];
        console.log("top match is: ", topMatch);
        // Update the current match
        setMatches([topMatch]);

        // Process view counting for quiz-directed matches
        if (fromQuiz) {
          // Remove from_quiz flag
          sessionStorage.removeItem("from_quiz");

          // Always record this match in the database for quiz-directed matches
          try {
            // Call the API endpoint to record the match view
            const recordViewResponse = await fetch(
              `/api/matches/record-view?matchId=${topMatch._id}`
            );

            if (recordViewResponse.ok) {
              console.log("Match recorded in database after quiz completion");

              // Get updated user profile to check total match count
              const updatedUserResponse = await fetch("/api/users/profile");
              if (updatedUserResponse.ok) {
                const updatedUserData = await updatedUserResponse.json();
                const newMatchesCount =
                  updatedUserData.user?.previousMatches?.length || 0;
                console.log("new matches count is: ", newMatchesCount);
                // Update total matches viewed count based on database
                setTotalMatchesViewed(newMatchesCount);

                // Update matches remaining consistently
                setMatchesRemaining(Math.max(0, matchLimit - newMatchesCount));

                // Show paywall if reached limit
                if (newMatchesCount > matchLimit && !isPremiumUser) {
                  setShowPaywall(true);
                }
              }
            } else {
              console.error(
                "Failed to record match view in database:",
                await recordViewResponse.text()
              );
            }
          } catch (error) {
            console.error("Error recording match view:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
        setError("Failed to fetch matches. Please try again.");
        // Only show quiz if there's an error AND no personality data
        if (!personalityData) {
          setShowQuiz(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeMatches();
  }, [status, router, session]); // Removed matchId from dependencies

  //...........................///////////////////

  const nextMatch = async () => {
    try {
      setIsLoading(true);
      setError("");

      // For authenticated users, refresh subscription and match count from server
      let matchLimit = subscribedMatchLimit;
      let isPremiumUser = isPremium;
      let previousMatchesCount = 0;

      if (session) {
        try {
          const userResponse = await fetch("/api/users/profile");
          if (userResponse.ok) {
            const userData = await userResponse.json();

            // Get accurate previous matches count
            previousMatchesCount = userData.user?.previousMatches?.length || 0;

            // Use database count directly
            setTotalMatchesViewed(previousMatchesCount);

            // Get updated subscription status
            const serverSubscription =
              userData.user?.subscriptionLevel || "free";
            if (serverSubscription === "premium_plus") {
              matchLimit = 999;
              isPremiumUser = true;
              setSubscribedMatchLimit(matchLimit);
              setIsPremium(true);
            } else if (serverSubscription === "premium_basic") {
              matchLimit = 10;
              isPremiumUser = true;
              setSubscribedMatchLimit(matchLimit);
              setIsPremium(true);
            } else {
              matchLimit = FREE_MATCH_LIMIT;
              isPremiumUser = false;
              setSubscribedMatchLimit(matchLimit);
              setIsPremium(false);
            }

            // Recalculate matches remaining based on previous matches consistently
            setMatchesRemaining(Math.max(0, matchLimit - previousMatchesCount));
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
          // Continue with stored values if refresh fails
        }
      }

      // Check if we've reached match limit for free users
      // Only show paywall after user has viewed all allowed matches and tries to see more
      if (!isPremiumUser && previousMatchesCount >= matchLimit) {
        setShowPaywall(true);
        setIsLoading(false);
        return;
      }

      // API call to fetch next match with refresh=true to ensure it's counted in the database
      const response = await fetch(`/api/matches?refresh=true`);

      // Handle 404 (no more matches)
      if (response.status === 404) {
        setNoMoreMatches(true);
        setIsLoading(false);
        return;
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch next match");
      }

      const data = await response.json();

      if (!data.match) {
        setNoMoreMatches(true);
        setIsLoading(false);
        return;
      }

      // Store the new match
      setMatches([data.match]);
      setShowDetailedProfile(false);

      // Get updated user profile to check total match count
      const updatedUserResponse = await fetch("/api/users/profile");
      if (updatedUserResponse.ok) {
        const updatedUserData = await updatedUserResponse.json();
        const newMatchesCount =
          updatedUserData.user?.previousMatches?.length || 0;

        // Update total matches viewed count based on database
        setTotalMatchesViewed(newMatchesCount);

        // Update matches remaining consistently
        setMatchesRemaining(Math.max(0, matchLimit - newMatchesCount));

        // Show paywall if reached limit
        if (newMatchesCount > matchLimit && !isPremiumUser) {
          setShowPaywall(true);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching next match:", error);
      setError("Failed to fetch next match. Please try again.");
      setIsLoading(false);
    }
  };

  const viewProfile = (matchId: string) => {
    router.push(`/profile/${matchId}`);
  };

  const startChat = (matchId: string) => {
    if (!isPremium) {
      setContactType("phone");
      setShowContactModal(true);
      return;
    }
    router.push(`/chat/${matchId}`);
  };

  const upgradeAccount = () => {
    router.push("/subscription");
  };

  const viewContactInfo = (type: "phone" | "email" | "address" | "social") => {
    setContactType(type);
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
  };

  const toggleDetailedProfile = () => {
    setShowDetailedProfile(!showDetailedProfile);
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

      // Get current match
      const currentMatch = matches[currentMatchIndex];
      if (!currentMatch) {
        throw new Error("No match selected");
      }

      // Call API to send proposal
      const response = await fetch("/api/proposals/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: currentMatch._id,
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
              Send a Proposal to {matches[currentMatchIndex]?.name}
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

  const closeQuiz = () => {
    setShowQuiz(false);
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
              directly with {matches[currentMatchIndex]?.name}
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
            Finding Your Matches
          </h2>
          <p className="text-gray-600">
            Our AI is analyzing compatibility factors...
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

  // Debug log for match state
  console.log(
    `Debug state - matches: ${matches.length}, hasPreviousMatches: ${hasPreviousMatches}, isLoading: ${isLoading}`
  );

  // Only show the empty state when:
  // 1. User has no current matches loaded
  // 2. We're not loading data
  if (matches.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>

          {hasPreviousMatches && matches.length === 0 && (
            <>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                No matches available
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                We couldn't find any matches for you at the moment. Try
                adjusting your preferences or check back later.
              </p>
              <Link
                href="/"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium inline-block"
              >
                Back to Home
              </Link>
            </>
          )}

          {!hasPreviousMatches && (
            <>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Find Your Perfect Match
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Take our personality quiz to find your perfect matches! Our
                AI-powered algorithm will analyze your answers to find
                compatible partners.
              </p>
              <p className="text-purple-600 mb-8 max-w-md mx-auto font-medium">
                Over 95% of our users find meaningful connections after taking
                the quiz!
              </p>
              <button
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg inline-flex items-center transition-transform hover:scale-105"
                onClick={() => setShowQuiz(true)}
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
                Start Personality Quiz
              </button>
              {showQuiz && (
                <PersonalityQuiz isOpen={showQuiz} onClose={closeQuiz} />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Show paywall if free user tries to access premium matches
  if (showPaywall) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden p-8 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Unlock More Matches
          </h2>
          <p className="text-xl text-gray-700 mb-2">
            You've reached your free match limit!
          </p>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Free users can view up to {FREE_MATCH_LIMIT} matches. Upgrade to
            Premium to unlock all matches and enjoy unlimited connections.
          </p>

          <div className="mb-8 max-w-xl mx-auto">
            <div className="h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>0 matches</span>
              <span>
                {totalMatchesViewed} / {FREE_MATCH_LIMIT} matches used
              </span>
              <span>Unlimited with Premium</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-purple-50 rounded-xl p-6 text-left shadow-sm border border-purple-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-purple-800">
                  Premium Basic
                </h3>
                <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  BDT 500
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                  <span>10 quality matches</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                  <span>Unlock contact information</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                  <span>Priority matching</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  localStorage.setItem("subscription_level", "premium_basic");
                  window.location.reload();
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
              >
                Get Premium Basic
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-left shadow-md border border-pink-100 relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                  Best Value
                </div>
              </div>
              <div className="flex justify-between items-start mb-4 pt-2">
                <h3 className="text-xl font-bold text-purple-800">
                  Premium Plus
                </h3>
                <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  BDT 1000
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                  <span>20 quality matches</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                  <span>Unlimited contact information</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                  <span>Top priority in matching algorithm</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                  <span>Advanced personality insights</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  localStorage.setItem("subscription_level", "premium_plus");
                  window.location.reload();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-3 rounded-lg font-medium"
              >
                Get Premium Plus
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-full font-bold text-xl"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get current match
  const currentMatch = matches[currentMatchIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      {showQuiz && <PersonalityQuiz isOpen={showQuiz} onClose={closeQuiz} />}
      {showContactModal && <ContactModal />}
      {showProposalModal && <ProposalModal />}
      {hasPersonalityData ? (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Personalized Match
          </h1>
          <p className="text-gray-600">
            Based on your personality quiz, we've found an exceptional match for
            you.
          </p>
          <div className="mt-4 bg-purple-50 p-4 rounded-lg inline-block">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-purple-600 mr-2"
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
              <span className="text-purple-700 font-medium">
                AI-powered match based on 20 compatibility factors
              </span>
            </div>
          </div>
        </div>
      ) : (
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Match</h1>
      )}

      {/* Subscription status tracker */}
      <div className="max-w-4xl mx-auto mb-6">
        <div
          className={`${
            matchesRemaining <= 1
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          } border rounded-lg px-4 py-3`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              <svg
                className={`h-5 w-5 ${
                  matchesRemaining <= 1 ? "text-red-600" : "text-yellow-600"
                } mr-2`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                className={`${
                  matchesRemaining <= 1 ? "text-red-800" : "text-yellow-800"
                } font-medium`}
              >
                {isPremium
                  ? `Premium subscription: ${matchesRemaining} of ${subscribedMatchLimit} matches remaining`
                  : `Free account: ${matchesRemaining} of ${FREE_MATCH_LIMIT} matches remaining`}
              </span>
            </div>
            {!isPremium && (
              <button
                onClick={upgradeAccount}
                className="text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 px-4 py-2 rounded-full text-sm font-medium"
              >
                Upgrade for More Matches
              </button>
            )}
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`${
                matchesRemaining <= 1
                  ? "bg-red-500"
                  : "bg-gradient-to-r from-yellow-400 to-yellow-500"
              } h-1.5 rounded-full`}
              style={{
                width: `${(totalMatchesViewed / subscribedMatchLimit) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Match display */}
      <div className="max-w-4xl mx-auto">
        {noMoreMatches ? (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-purple-600"
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
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No more matches available
            </h2>
            <p className="text-gray-600 mb-6">
              You've seen all available matches for now. Check back later for
              new matches!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Match image section */}
              <div className="md:w-1/2 relative h-96 md:h-auto">
                <Image
                  src={currentMatch.profileImage}
                  alt={`${currentMatch.name}'s profile`}
                  fill
                  className="object-cover"
                  unoptimized // Using placeholder images
                />
                {/* Compatibility score badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-lg font-bold rounded-full h-16 w-16 flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <span className="text-lg">
                      {currentMatch.compatibilityScore}%
                    </span>
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
                      {currentMatch.name}, {currentMatch.age}
                    </h2>
                    <p className="text-gray-600">
                      {typeof currentMatch.location === "object"
                        ? `${currentMatch.location.city || ""}, ${
                            currentMatch.location.country || ""
                          }`
                        : currentMatch.location}
                    </p>
                  </div>
                  {currentMatch.hasUnreadMessages && (
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs shadow-md">
                      New Message
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <div>
                      Matched{" "}
                      {new Date(currentMatch.matchDate).toLocaleDateString()}
                    </div>
                    <div>Active {currentMatch.lastActive}</div>
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
                        <span>
                          {currentMatch.compatibilityScore}% Compatible
                        </span>
                      </div>
                    </div>

                    {/* Display algorithm explanation */}
                    <p className="text-gray-700 text-lg mb-5 font-medium">
                      {typeof currentMatch.explanation === "object"
                        ? (currentMatch.explanation as any).explanation ||
                          "You have good compatibility with this match"
                        : currentMatch.explanation ||
                          (currentMatch.compatibilityScore > 90
                            ? "You have exceptional compatibility with this match"
                            : currentMatch.compatibilityScore > 80
                            ? "You have great compatibility with this match"
                            : "You have good compatibility with this match")}
                    </p>

                    {/* Display compatibility reasons */}
                    {typeof currentMatch.explanation === "object" &&
                    (currentMatch.explanation as any).reasons?.length > 0 ? (
                      <div className="mb-6">
                        <h4 className="font-semibold text-purple-800 mb-2">
                          Why You Match:
                        </h4>
                        <ul className="space-y-2">
                          {(currentMatch.explanation as any).reasons.map(
                            (reason: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <svg
                                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
                                <span className="text-gray-700">{reason}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    ) : (
                      currentMatch.compatibilityReasons &&
                      currentMatch.compatibilityReasons.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-purple-800 mb-2">
                            Why You Match:
                          </h4>
                          <ul className="space-y-2">
                            {currentMatch.compatibilityReasons.map(
                              (reason, index) => (
                                <li key={index} className="flex items-start">
                                  <svg
                                    className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
                                  <span className="text-gray-700">
                                    {reason}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )
                    )}

                    {/* Display shared values */}
                    {typeof currentMatch.explanation === "object" &&
                    (currentMatch.explanation as any).sharedValues?.length >
                      0 ? (
                      <div className="mb-6">
                        <h4 className="font-semibold text-purple-800 mb-2">
                          Shared Values:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(currentMatch.explanation as any).sharedValues.map(
                            (value: string, index: number) => (
                              <span
                                key={index}
                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                              >
                                {value}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      currentMatch.sharedValues &&
                      currentMatch.sharedValues.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-purple-800 mb-2">
                            Shared Values:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {currentMatch.sharedValues.map((value, index) => (
                              <span
                                key={index}
                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}

                    {/* Display top traits */}
                    <div className="space-y-3 mb-6">
                      {typeof currentMatch.explanation === "object" &&
                      (currentMatch.explanation as any).topTraits?.length >
                        0 ? (
                        (currentMatch.explanation as any).topTraits.map(
                          (trait: string, index: number) => (
                            <div
                              key={index}
                              className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow"
                            >
                              <p className="text-gray-700 capitalize">
                                {trait === "extroverted"
                                  ? "They are social and energetic, gaining energy from being around others"
                                  : trait === "introspective"
                                  ? "They are thoughtful and reflective, valuing deep personal connections"
                                  : trait === "practical"
                                  ? "They approach situations with a practical mindset and value real-world results"
                                  : trait === "creative"
                                  ? "They have a creative mind and enjoy exploring new possibilities"
                                  : trait === "independent"
                                  ? "They value personal space and independence in relationships"
                                  : trait === "sociable"
                                  ? "They enjoy social gatherings and connecting with others"
                                  : trait === "patient"
                                  ? "They believe relationships develop over time through shared experiences"
                                  : trait === "romantic"
                                  ? "They have a romantic outlook on relationships and connections"
                                  : trait === "grounded"
                                  ? "They are down-to-earth and focus on tangible realities"
                                  : `They are ${trait.toLowerCase()}`}
                              </p>
                            </div>
                          )
                        )
                      ) : currentMatch.topTraits &&
                        currentMatch.topTraits.length > 0 ? (
                        currentMatch.topTraits.map((trait, index) => (
                          <div
                            key={index}
                            className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow"
                          >
                            <p className="text-gray-700 capitalize">
                              {trait === "extroverted"
                                ? "They are social and energetic, gaining energy from being around others"
                                : trait === "introspective"
                                ? "They are thoughtful and reflective, valuing deep personal connections"
                                : trait === "practical"
                                ? "They approach situations with a practical mindset and value real-world results"
                                : trait === "creative"
                                ? "They have a creative mind and enjoy exploring new possibilities"
                                : trait === "independent"
                                ? "They value personal space and independence in relationships"
                                : trait === "sociable"
                                ? "They enjoy social gatherings and connecting with others"
                                : trait === "patient"
                                ? "They believe relationships develop over time through shared experiences"
                                : trait === "romantic"
                                ? "They have a romantic outlook on relationships and connections"
                                : trait === "grounded"
                                ? "They are down-to-earth and focus on tangible realities"
                                : `They are ${trait.toLowerCase()}`}
                            </p>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                            <p className="text-gray-700">
                              Their {currentMatch.personalityType || "unique"}{" "}
                              personality type suggests they are{" "}
                              {extractPersonalityTraits(
                                currentMatch.personalityType
                              )
                                ?.slice(0, 3)
                                .join(", ")
                                .toLowerCase()}
                            </p>
                          </div>

                          <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                            <p className="text-gray-700">
                              They tend to focus on{" "}
                              {currentMatch.personalityType?.includes("N")
                                ? "ideas, possibilities, and the future"
                                : "practical matters, details, and the present"}
                            </p>
                          </div>

                          <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                            <p className="text-gray-700">
                              They approach decisions with{" "}
                              {currentMatch.personalityType?.includes("T")
                                ? "logical analysis and objective reasoning"
                                : currentMatch.personalityType?.includes("F")
                                ? "empathy and consideration for how others will be affected"
                                : "a balance of logic and emotional awareness"}
                            </p>
                          </div>

                          <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                            <p className="text-gray-700">
                              Their{" "}
                              {currentMatch.personalityType?.includes("E")
                                ? "extroverted"
                                : "introverted"}{" "}
                              nature means they{" "}
                              {currentMatch.personalityType?.includes("E")
                                ? "gain energy from social interactions and engagement with others"
                                : "recharge through quiet reflection and alone time"}
                            </p>
                          </div>
                        </>
                      )}
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

                    <div className="mt-6 pt-4 border-t border-purple-200">
                      <div className="flex items-center text-sm">
                        <div className="bg-purple-100 rounded-full p-2 mr-3">
                          <svg
                            className="h-5 w-5 text-purple-600"
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
                        <span className="text-purple-700 font-medium">
                          AI-Powered Match: Our algorithm analyzes personality
                          traits, interests, relationship goals, and lifestyle
                          preferences to find your most compatible matches.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio section */}
                <h3 className="text-lg font-semibold mb-3">Bio</h3>
                <div className="mb-6">
                  <p className="text-gray-700">{currentMatch.bio}</p>
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
                        {currentMatch.occupation || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Education:</span>
                      <span className="text-gray-700">
                        {currentMatch.education || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Height:</span>
                      <span className="text-gray-700">
                        {currentMatch.height || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Status:</span>
                      <span className="text-gray-700">
                        {currentMatch.relationshipStatus || "Single"}
                      </span>
                    </div>
                    <div className="flex items-center col-span-2">
                      <span className="text-gray-500 mr-2">Looking for:</span>
                      <span className="text-gray-700">
                        {currentMatch.lookingFor || "Relationship"}
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
                          <span className="font-semibold">5x more likely</span>{" "}
                          to find their perfect match. Unlock contact details
                          and start meaningful conversations!
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
                    {(currentMatch.interests || [])
                      .slice(0, 4)
                      .map((interest, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    {/* If we have quiz interests but no profile interests */}
                    {(currentMatch.interests || []).length === 0 &&
                      currentMatch.personalityQuiz?.answers?.profile_12 && (
                        <>
                          {currentMatch.personalityQuiz.answers.profile_12
                            .split(",")
                            .slice(0, 4)
                            .map((interest, index) => (
                              <span
                                key={index}
                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                              >
                                {interest.trim()}
                              </span>
                            ))}
                        </>
                      )}
                    {/* Fallback if no interests found */}
                    {(currentMatch.interests || []).length === 0 &&
                      !currentMatch.personalityQuiz?.answers?.profile_12 && (
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
                    onClick={() => viewProfile(currentMatch._id)}
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
                    onClick={() => startChat(currentMatch._id)}
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

                <button
                  type="button"
                  onClick={nextMatch}
                  disabled={isNextMatchLoading}
                  className={`w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-4 rounded-full font-bold text-xl transition-all ${
                    isNextMatchLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:scale-105"
                  }`}
                >
                  {isNextMatchLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Finding Next Match...
                    </span>
                  ) : (
                    "Next Match"
                  )}
                </button>
                <div className="mt-4 text-center">
                  <p className="text-gray-500 text-sm">
                    {currentMatchIndex + 1} of{" "}
                    {!isPremium ? `${FREE_MATCH_LIMIT} (Free)` : matches.length}{" "}
                    potential matches
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

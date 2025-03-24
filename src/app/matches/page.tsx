"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function Matches() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id");
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNextMatchLoading, setIsNextMatchLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPersonalityData, setHasPersonalityData] = useState(false);
  const [noMoreMatches, setNoMoreMatches] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Track premium status
  const [showPaywall, setShowPaywall] = useState(false); // Show paywall when free limit reached

  // New state variables for profile details viewing
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<
    "phone" | "email" | "address" | "social"
  >("phone");
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);
  // Add state for viewed match history
  const [viewedMatches, setViewedMatches] = useState<string[]>([]);

  // Add global match count tracking
  const [totalMatchesViewed, setTotalMatchesViewed] = useState(0);
  const [subscribedMatchLimit, setSubscribedMatchLimit] = useState(3);
  const [matchesRemaining, setMatchesRemaining] = useState(3);

  // Add state for proposal functionality
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const [proposalError, setProposalError] = useState("");

  const FREE_MATCH_LIMIT = 3; // Free users can see 3 matches

  useEffect(() => {
    // Initialize viewed matches tracking from localStorage
    let storedViewedMatches = localStorage.getItem("viewed_matches");
    let viewedMatchesArray = storedViewedMatches
      ? JSON.parse(storedViewedMatches)
      : [];
    setViewedMatches(viewedMatchesArray);

    // Check for personality quiz data
    const personalityData = localStorage.getItem("personality_answers");
    if (!personalityData) {
      // If no quiz data found, redirect to home page to complete quiz
      router.push("/");
      return;
    } else {
      setHasPersonalityData(true);
    }

    // Initialize variables we'll use in the function
    let matchLimit = FREE_MATCH_LIMIT;
    let isPremiumUser = false;
    let totalMatches = 0;

    // Check subscription level and set appropriate limits
    const checkSubscriptionLevel = async () => {
      // Get subscription level from API or localStorage
      let subscriptionLevel = "free";
      let matchesViewedCount = 0;

      try {
        if (session) {
          // If authenticated, get subscription and matches viewed from API
          const userResponse = await fetch("/api/users/profile");
          if (userResponse.ok) {
            const userData = await userResponse.json();

            // Get subscription level
            subscriptionLevel = userData.user?.subscriptionLevel || "free";

            // Get matches viewed from database
            matchesViewedCount = userData.user?.statistics?.matchesViewed || 0;

            // Sync matchesViewed with localStorage if localStorage has more
            const storedTotalMatches = localStorage.getItem(
              "total_matches_viewed"
            );
            const localCount = storedTotalMatches
              ? parseInt(storedTotalMatches, 10)
              : 0;

            // Use the higher count to ensure consistency
            matchesViewedCount = Math.max(matchesViewedCount, localCount);

            // Update localStorage with the current count
            localStorage.setItem(
              "total_matches_viewed",
              matchesViewedCount.toString()
            );
          }
        } else {
          // If not authenticated, check localStorage
          subscriptionLevel =
            localStorage.getItem("subscription_level") || "free";

          // Get matches viewed from localStorage
          const storedTotalMatches = localStorage.getItem(
            "total_matches_viewed"
          );
          matchesViewedCount = storedTotalMatches
            ? parseInt(storedTotalMatches, 10)
            : 0;
        }
      } catch (error) {
        console.error("Error checking subscription:", error);

        // Fallback to localStorage if API call fails
        const storedTotalMatches = localStorage.getItem("total_matches_viewed");
        matchesViewedCount = storedTotalMatches
          ? parseInt(storedTotalMatches, 10)
          : 0;
      }

      // Set total matches viewed state
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

      // Calculate matches remaining
      setMatchesRemaining(Math.max(0, matchLimit - matchesViewedCount));

      // Show paywall if matches viewed exceeds subscription limit
      if (matchesViewedCount > matchLimit && !isPremiumUser) {
        setShowPaywall(true);
        return true; // Return true if we should show paywall
      }

      return false; // Continue with match fetch
    };

    // Function to fetch matches, only called if checkSubscriptionLevel returns false
    const fetchMatches = async (shouldShowPaywall: boolean) => {
      if (shouldShowPaywall) {
        return; // Don't fetch matches if we're showing the paywall
      }

      try {
        setIsLoading(true);
        setError("");

        // Check if we have a lastViewedMatch stored
        const lastViewedMatch = localStorage.getItem("last_viewed_match");

        // Check if we're coming directly from the quiz
        const fromQuiz = sessionStorage.getItem("from_quiz") === "true";

        // If we have a lastViewedMatch and we're not coming from quiz, show that instead of fetching a new one
        if (lastViewedMatch && !fromQuiz && !matchId) {
          try {
            const parsedMatch = JSON.parse(lastViewedMatch);
            setMatches([parsedMatch]);
            setIsLoading(false);
            return;
          } catch (e) {
            console.error("Error parsing last viewed match:", e);
            // Fall through to fetch a new match if parsing fails
          }
        }

        // Build query param with already viewed matches
        const viewedQueryParam =
          viewedMatchesArray.length > 0
            ? `&viewed=${encodeURIComponent(
                JSON.stringify(viewedMatchesArray)
              )}`
            : "";

        // Add fromQuiz parameter if coming from quiz
        const fromQuizParam = fromQuiz ? "&fromQuiz=true" : "";

        // API call to get matches from database, passing viewed matches to avoid duplicates
        const response = await fetch(
          `/api/matches?list=true${viewedQueryParam}${fromQuizParam}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch matches");
        }

        const data = await response.json();

        if (!data.matches || data.matches.length === 0) {
          setNoMoreMatches(true);
          setIsLoading(false);
          return;
        }

        // Filter out any matches that might already be in viewedMatches
        const filteredMatches = data.matches.filter(
          (match: Match) => !viewedMatchesArray.includes(match._id)
        );

        if (filteredMatches.length === 0) {
          setNoMoreMatches(true);
          setIsLoading(false);
          return;
        }

        // Sort by compatibility score
        filteredMatches.sort(
          (a: Match, b: Match) => b.compatibilityScore - a.compatibilityScore
        );

        // Get the top match
        const topMatch = filteredMatches[0];

        // Update the current match
        setMatches([topMatch]);

        // Save as last viewed match
        localStorage.setItem("last_viewed_match", JSON.stringify(topMatch));

        // Only count as viewed if coming from quiz or explicitly requesting a new match
        if (fromQuiz) {
          // Remove from_quiz flag to prevent double-counting on page refreshes
          sessionStorage.removeItem("from_quiz");

          // Check if we've already viewed this match
          if (!viewedMatchesArray.includes(topMatch._id)) {
            // Add to viewed matches list
            viewedMatchesArray.push(topMatch._id);
            localStorage.setItem(
              "viewed_matches",
              JSON.stringify(viewedMatchesArray)
            );
            setViewedMatches(viewedMatchesArray);

            // Update total matches viewed count in state and localStorage
            const newTotal = totalMatches + 1;
            setTotalMatchesViewed(newTotal);
            localStorage.setItem("total_matches_viewed", newTotal.toString());

            // Update matches remaining
            setMatchesRemaining(Math.max(0, matchLimit - newTotal));

            // Show paywall if reached limit
            if (newTotal > matchLimit && !isPremiumUser) {
              setShowPaywall(true);
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching matches:", error);
        setError("Failed to fetch matches. Please try again.");
        setIsLoading(false);
      }
    };

    // For specific match ID, load that match
    if (matchId) {
      const fetchSpecificMatch = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/matches?userId=${matchId}`);
          const data = await response.json();

          if (data.match) {
            setMatches([data.match]);
            setCurrentMatchIndex(0);

            // Save as last viewed match
            localStorage.setItem(
              "last_viewed_match",
              JSON.stringify(data.match)
            );

            // Don't count specific match views toward limit
            // but do track it as viewed to avoid showing it again
            if (!viewedMatchesArray.includes(data.match._id)) {
              viewedMatchesArray.push(data.match._id);
              localStorage.setItem(
                "viewed_matches",
                JSON.stringify(viewedMatchesArray)
              );
              setViewedMatches(viewedMatchesArray);
            }
          } else {
            setError("Match not found");
          }
        } catch (error) {
          console.error("Failed to fetch specific match:", error);
          setError("Failed to load the requested match");
        } finally {
          setIsLoading(false);
        }
      };

      fetchSpecificMatch();
    } else {
      // Check subscription first, then fetch matches if needed
      checkSubscriptionLevel().then(fetchMatches);
    }

    // Only include router and matchId in dependencies as they're external
  }, [router, matchId]);

  const nextMatch = async () => {
    try {
      setIsLoading(true);
      setError("");

      // For authenticated users, refresh subscription and match count from server
      let matchLimit = subscribedMatchLimit;
      let isPremiumUser = isPremium;
      let currentTotalViewed = totalMatchesViewed;

      if (session) {
        try {
          const userResponse = await fetch("/api/users/profile");
          if (userResponse.ok) {
            const userData = await userResponse.json();

            // Update matches viewed count from server
            const serverMatchCount =
              userData.user?.statistics?.matchesViewed || 0;
            const storedTotalMatches = localStorage.getItem(
              "total_matches_viewed"
            );
            const localCount = storedTotalMatches
              ? parseInt(storedTotalMatches, 10)
              : 0;

            // Use the higher count for consistency
            currentTotalViewed = Math.max(serverMatchCount, localCount);
            setTotalMatchesViewed(currentTotalViewed);
            localStorage.setItem(
              "total_matches_viewed",
              currentTotalViewed.toString()
            );

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

            // Recalculate matches remaining
            setMatchesRemaining(Math.max(0, matchLimit - currentTotalViewed));
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
          // Continue with stored values if refresh fails
        }
      }

      // Get viewed matches from localStorage
      let storedViewedMatches = localStorage.getItem("viewed_matches");
      let viewedMatchesArray = storedViewedMatches
        ? JSON.parse(storedViewedMatches)
        : [];

      // Add current match to viewed if it exists and isn't already there
      if (
        matches &&
        matches.length > 0 &&
        !viewedMatchesArray.includes(matches[0]._id)
      ) {
        viewedMatchesArray.push(matches[0]._id);
        localStorage.setItem(
          "viewed_matches",
          JSON.stringify(viewedMatchesArray)
        );
        setViewedMatches(viewedMatchesArray);
      }

      // Check if we've reached match limit for free users
      // Only show paywall after user has viewed all allowed matches and tries to see more
      if (currentTotalViewed >= matchLimit && !isPremiumUser) {
        setShowPaywall(true);
        setIsLoading(false);
        return;
      }

      // Build query string with viewed matches
      const viewedQueryParam =
        viewedMatchesArray.length > 0
          ? `&viewed=${encodeURIComponent(JSON.stringify(viewedMatchesArray))}`
          : "";

      // API call to fetch next match with refresh=true to ensure it's counted in the database
      const response = await fetch(
        `/api/matches?refresh=true${viewedQueryParam}`
      );

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

      // Save as last viewed match
      localStorage.setItem("last_viewed_match", JSON.stringify(data.match));

      // Track as viewed in localStorage if not already
      if (!viewedMatchesArray.includes(data.match._id)) {
        viewedMatchesArray.push(data.match._id);
        localStorage.setItem(
          "viewed_matches",
          JSON.stringify(viewedMatchesArray)
        );
        setViewedMatches(viewedMatchesArray);

        // Update total matches viewed count
        const newTotal = currentTotalViewed + 1;
        setTotalMatchesViewed(newTotal);
        localStorage.setItem("total_matches_viewed", newTotal.toString());

        // Update matches remaining
        setMatchesRemaining(Math.max(0, matchLimit - newTotal));

        // Show paywall if new count exceeds limit (will affect next click)
        // We've just shown the last match, so don't show paywall yet
        if (newTotal > matchLimit && !isPremiumUser) {
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

  if (matches.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            No matches yet
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            We couldn't find any matches for you at the moment. Try adjusting
            your preferences or check back later.
          </p>
          <Link
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium inline-block"
          >
            Back to Home
          </Link>
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
              directly with {currentMatch.name}
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

  return (
    <div className="container mx-auto px-4 py-8">
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
                      {currentMatch.explanation ||
                        (currentMatch.compatibilityScore > 90
                          ? "You have exceptional compatibility with this match"
                          : currentMatch.compatibilityScore > 80
                          ? "You have great compatibility with this match"
                          : "You have good compatibility with this match")}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                        <p className="text-gray-700">
                          Their {currentMatch.personalityType || "unique"}{" "}
                          personality type suggests they are{" "}
                          {currentMatch.topTraits
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
                    {(currentMatch.interests || []).length === 0 && (
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

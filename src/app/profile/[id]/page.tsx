"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

// Define the User interface based on MongoDB schema
interface User {
  _id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  location: {
    city: string;
    country: string;
  };
  profileImage: string;
  additionalPhotos: string[];
  interests: string[];
  relationshipGoals: string[];
  personalityQuiz?: {
    completed: boolean;
    completedAt: string;
    personalityType: string;
    answers: Record<string, string>;
  };
  personalityType?: string;
  lastActive?: string;
  previousMatches?: Array<{
    userId: string;
    score: number;
    reason: string;
    isViewed: boolean;
    matchDate: string;
  }>;
  lifestyle?: {
    smoking: string;
    drinking: string;
    diet: string;
    religion: string;
  };
}

const UserProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [compatibility, setCompatibility] = useState<{
    score: number;
    reasons: string[];
  }>({
    score: 0,
    reasons: [],
  });

  useEffect(() => {
    // Fetch user data from MongoDB
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/users/${userId}`);
        const userData = response.data;

        if (userData) {
          setUser(userData);

          // Set profile image or default
          setSelectedImage(
            userData.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                userData.name
              )}&background=8B5CF6&color=fff&size=150`
          );

          // Process compatibility data
          if (userData.previousMatches && userData.previousMatches.length > 0) {
            const latestMatch = userData.previousMatches[0];
            setCompatibility({
              score: Math.round(latestMatch.score),
              reasons: latestMatch.reason.split(". ").filter(Boolean),
            });
          }
      } else {
        // Handle user not found
          router.push("/matches");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/matches");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
    fetchUserData();
    }
  }, [userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-purple-600 rounded-full animate-pulse"></div>
            <div className="h-4 w-4 bg-purple-600 rounded-full animate-pulse delay-150"></div>
            <div className="h-4 w-4 bg-purple-600 rounded-full animate-pulse delay-300"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            Sorry, this user profile doesn't exist or has been removed.
          </p>
          <Link
            href="/matches"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium"
          >
            Return to Matches
          </Link>
        </div>
      </div>
    );
  }

  // Extract data from user's personalityQuiz answers
  const quizAnswers = user.personalityQuiz?.answers || {};

  // Format the user's birth year to calculate age
  const birthYear = quizAnswers.profile_3
    ? parseInt(quizAnswers.profile_3)
    : null;
  const currentAge = birthYear
    ? new Date().getFullYear() - birthYear
    : user.age;

  // Get profession/occupation from quiz answers
  const profession = quizAnswers.profile_5 || "Not specified";

  // Get education from quiz answers
  const education = quizAnswers.profile_7 || "Not specified";

  // Get looking for from relationship goals
  const lookingFor = user.relationshipGoals?.join(", ") || "Not specified";

  // Extract interests from quiz answers if available
  const hobbies = quizAnswers.profile_12
    ? quizAnswers.profile_12.split(",").map((h) => h.trim())
    : user.interests || [];

  // Add placeholders for gallery
  const galleryImages = [
    user.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=8B5CF6&color=fff&size=150`,
    ...(user.additionalPhotos || []),
  ];

  // If not enough images, add placeholders
  while (galleryImages.length < 4) {
    galleryImages.push(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=8B5CF6&color=fff&size=150`
    );
  }

  // Format last active date
  const formatLastActive = (lastActiveDate?: string) => {
    if (!lastActiveDate) return "Recently active";

    const lastActive = new Date(lastActiveDate);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Online now";
    if (diffMinutes < 60) return `Active ${diffMinutes} minutes ago`;
    if (diffMinutes < 1440)
      return `Active ${Math.floor(diffMinutes / 60)} hours ago`;
    return `Active ${Math.floor(diffMinutes / 1440)} days ago`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send a message to the backend
    alert(`Message sent to ${user.name}: "${messageText}"`);
    setMessageText("");
  };

  // Generate compatibility reasons if none exist
  const getCompatibilityReasons = () => {
    if (compatibility.reasons.length > 0) return compatibility.reasons;

    // Default reasons based on personality type
    return [
      `Similar personal values and lifestyle preferences`,
      `Compatible communication styles`,
      `Complementary personality traits`,
      `Shared interests in ${hobbies.slice(0, 2).join(" and ")}`,
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/matches"
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Matches
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <div className="absolute inset-0 z-0">
              <Image
                src={selectedImage}
                alt={`${user.name}'s profile`}
                fill
                style={{ objectFit: "cover" }}
                priority
                className="brightness-[0.85]"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white overflow-hidden relative">
                    <Image
                      src={
                        user.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=8B5CF6&color=fff&size=150`
                      }
                      alt={`${user.name}'s avatar`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {user.name}, {currentAge}
                  </h1>
                  <div className="flex items-center mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-sm">
                      {user.location.city}
                      {user.location.country
                        ? `, ${user.location.country}`
                        : ""}
                    </p>
                    <span className="mx-2">•</span>
                    <p className="text-sm text-capitalize">{user.gender}</p>
                  </div>
                  <p className="mt-1 text-sm opacity-80">
                    {formatLastActive(user.lastActive)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
            {/* Left Column - About Section */}
            <div className="md:col-span-2">
              {/* AI Compatibility Score */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">
                    AI Compatibility Score
                  </h3>
                </div>
                <div className="flex items-center mb-3">
                  <div className="w-full h-3 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                      style={{ width: `${compatibility.score}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold">
                    {compatibility.score}%
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="mb-2">Why you're compatible:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    {getCompatibilityReasons().map(
                      (reason: string, index: number) => (
                        <li key={index}>{reason}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* Personality Type */}
              {(user.personalityType ||
                user.personalityQuiz?.personalityType) && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3">Personality Type</h2>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-gray-900 font-medium">
                      {user.personalityType ||
                        user.personalityQuiz?.personalityType}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {getPersonalityDescription(
                        user.personalityType ||
                          user.personalityQuiz?.personalityType ||
                          ""
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* About Me */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">About Me</h2>
                <p className="text-gray-700">
                  {quizAnswers.profile_1
                    ? `Hi, I'm ${quizAnswers.profile_1}. I'm a ${
                        quizAnswers.profile_9 || "single"
                      } ${currentAge}-year-old ${user.gender} living in ${
                        user.location.city
                      }. I work as a ${profession} and enjoy ${hobbies
                        .slice(0, 3)
                        .join(", ")}.`
                    : `Hi, I'm ${user.name}. I'm ${currentAge} years old and looking for a meaningful connection.`}
                </p>
              </div>

              {/* Interests/Hobbies */}
              {hobbies.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Interests</h2>
                <div className="flex flex-wrap gap-2">
                    {hobbies.map((interest: string, index: number) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              )}

              {/* Lifestyle */}
              {user.lifestyle && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3">Lifestyle</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                      <span className="block text-gray-500 text-xs mb-1">
                        Religion
                      </span>
                      <span className="font-medium">
                        {quizAnswers.profile_8 ||
                          user.lifestyle.religion ||
                          "Not specified"}
                      </span>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                      <span className="block text-gray-500 text-xs mb-1">
                        Smoking
                      </span>
                      <span className="font-medium">
                        {user.lifestyle.smoking || "Not specified"}
                      </span>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                      <span className="block text-gray-500 text-xs mb-1">
                        Drinking
                      </span>
                      <span className="font-medium">
                        {user.lifestyle.drinking || "Not specified"}
                      </span>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                      <span className="block text-gray-500 text-xs mb-1">
                        Diet
                      </span>
                      <span className="font-medium">
                        {user.lifestyle.diet || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Professional & Education */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">
                  Professional & Education
                </h2>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-700 capitalize">{profession}</p>
                  </div>
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <p className="text-gray-700 uppercase">{education}</p>
                  </div>
                </div>
              </div>

              {/* Looking For */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Looking For</h2>
                <p className="text-gray-700">{lookingFor}</p>
              </div>

              {/* Gallery */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Gallery</h2>
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className={`relative h-32 sm:h-40 rounded-lg overflow-hidden cursor-pointer border-2 ${
                        selectedImage === imageUrl
                          ? "border-purple-600"
                          : "border-transparent"
                      }`}
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${user.name}'s gallery image ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact/Message */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
                <h3 className="text-xl font-bold mb-4">Contact {user.name}</h3>
                <div className="space-y-3 mb-6">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full font-medium flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
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
                    Chat Now
                  </button>

                  <button className="w-full border border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-3 rounded-full font-medium flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
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
                    Add to Favorites
                  </button>
                </div>

                {/* Quick Message Form */}
                <div>
                  <h4 className="font-medium mb-2">Send a Quick Message</h4>
                  <form onSubmit={handleSendMessage}>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Say hello to ${user.name}...`}
                      className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                      required
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-4 py-2 rounded-full font-medium"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get personality description
function getPersonalityDescription(personalityType: string): string {
  const descriptions: Record<string, string> = {
    ISTJ: "Quiet, serious, practical and orderly. Responsible and reliable with a strong sense of duty.",
    ISFJ: "Quiet, friendly, responsible and conscientious. Committed to meeting obligations and devoted to their relationships.",
    INFJ: "Quiet, mystical, idealistic and creative. Seeks meaning and connection, committed to their values.",
    INTJ: "Independent, analytical, logical and determined. Driven by their own ideas and purpose, has high standards.",
    ISTP: "Tolerant, flexible and practical problem-solvers. Enjoys exploring with their hands and analyzing how things work.",
    ISFP: "Quiet, friendly, sensitive and kind. Enjoys the present moment and values their personal space and freedom.",
    INFP: "Idealistic, loyal, curious and adaptable. Cares deeply about their values and helping others fulfill their potential.",
    INTP: "Analytical, detached, logical and curious. Theoretical and abstract, interested in ideas and logical analysis.",
    ESTP: "Energetic, action-oriented, pragmatic and outgoing. Enjoys material comforts and living in the moment.",
    ESFP: "Outgoing, friendly, accepting and spontaneous. Lovers of life, people, and material comforts.",
    ENFP: "Enthusiastic, creative, spontaneous and versatile. Sees life as full of possibilities and makes connections between events.",
    ENTP: "Quick, ingenious, stimulating and outspoken. Resourceful in solving new and challenging problems.",
    ESTJ: "Practical, realistic, decisive and structured. Values traditions and loyalty, organized and takes charge.",
    ESFJ: "Warmhearted, conscientious, cooperative and harmonious. Wants to be appreciated for who they are and what they do.",
    ENFJ: "Warm, empathetic, responsive and responsible. Highly attuned to the emotions and needs of others.",
    ENTJ: "Frank, decisive, strategic and logical. Natural leader who sees possibilities for improvement.",
  };

  return (
    descriptions[personalityType] ||
    "A unique individual with their own special traits and characteristics."
  );
}

export default UserProfilePage;

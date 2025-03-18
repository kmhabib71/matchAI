"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  profileImages: string[];
  joinDate: string;
  lastActive: string;
  verificationStatus: "verified" | "pending" | "unverified";
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface MatchDetail {
  id: string;
  user1: User;
  user2: User;
  compatibilityScore: number;
  matchExplanation: string;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  lastActivity: string;
  messages: Message[];
}

export default function MatchDetail() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
          user1: {
            id: "user1",
            name: "Sarah Johnson",
            age: 28,
            location: "New York, USA",
            bio: "Passionate about art, travel, and good food. Looking for someone who shares my enthusiasm for exploring new places and trying new cuisines.",
            interests: ["Art", "Travel", "Cooking", "Photography", "Hiking"],
            profileImages: [
              "/avatars/avatar-1.jpg",
              "/avatars/avatar-1-2.jpg",
              "/avatars/avatar-1-3.jpg",
            ],
            joinDate: "2023-01-15",
            lastActive: "2023-10-20T14:30:00Z",
            verificationStatus: "verified",
          },
          user2: {
            id: "user2",
            name: "Michael Chen",
            age: 31,
            location: "San Francisco, USA",
            bio: "Software engineer by day, amateur chef by night. I love hiking, photography, and exploring new technologies.",
            interests: [
              "Technology",
              "Hiking",
              "Photography",
              "Cooking",
              "Reading",
            ],
            profileImages: [
              "/avatars/avatar-2.jpg",
              "/avatars/avatar-2-2.jpg",
              "/avatars/avatar-2-3.jpg",
            ],
            joinDate: "2022-11-05",
            lastActive: "2023-10-19T18:45:00Z",
            verificationStatus: "verified",
          },
          compatibilityScore: 92,
          matchExplanation:
            "Both users share interests in hiking, photography, and cooking. Their communication styles and values align well according to our AI analysis. They both enjoy outdoor activities and have similar travel preferences.",
          status: "active",
          createdAt: "2023-10-15T09:20:00Z",
          lastActivity: "2023-10-20T14:30:00Z",
          messages: [
            {
              id: "msg1",
              senderId: "user1",
              content:
                "Hi Michael! I noticed we both enjoy hiking. What's your favorite trail?",
              timestamp: "2023-10-15T10:05:00Z",
              read: true,
            },
            {
              id: "msg2",
              senderId: "user2",
              content:
                "Hey Sarah! Nice to meet you. I love the trails in Yosemite National Park. Have you ever been there?",
              timestamp: "2023-10-15T10:20:00Z",
              read: true,
            },
            {
              id: "msg3",
              senderId: "user1",
              content:
                "I've been to Yosemite once, but I didn't get to explore many trails. It's definitely on my bucket list to go back! What other outdoor activities do you enjoy?",
              timestamp: "2023-10-15T11:15:00Z",
              read: true,
            },
            {
              id: "msg4",
              senderId: "user2",
              content:
                "Besides hiking, I enjoy kayaking and rock climbing. I also try to go camping at least once a month. How about you?",
              timestamp: "2023-10-16T09:30:00Z",
              read: true,
            },
            {
              id: "msg5",
              senderId: "user1",
              content:
                "I love kayaking too! I haven't tried rock climbing yet, but I'd like to. I enjoy photography while hiking - capturing landscapes and wildlife.",
              timestamp: "2023-10-16T14:45:00Z",
              read: true,
            },
            {
              id: "msg6",
              senderId: "user2",
              content:
                "Photography is another passion of mine! What camera do you use? I recently upgraded to a Sony Alpha.",
              timestamp: "2023-10-17T11:20:00Z",
              read: true,
            },
            {
              id: "msg7",
              senderId: "user1",
              content:
                "I use a Canon EOS, but I've heard great things about the Sony Alpha series. Would love to see some of your photos sometime!",
              timestamp: "2023-10-18T16:10:00Z",
              read: true,
            },
            {
              id: "msg8",
              senderId: "user2",
              content:
                "I'd be happy to share some! Maybe we could plan a photography hike sometime? There's a beautiful trail near Golden Gate Park with amazing views.",
              timestamp: "2023-10-19T18:45:00Z",
              read: true,
            },
            {
              id: "msg9",
              senderId: "user1",
              content:
                "That sounds wonderful! I'd love to explore that trail and compare photography techniques. When were you thinking?",
              timestamp: "2023-10-20T14:30:00Z",
              read: false,
            },
          ],
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

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const handleDeleteMatch = async () => {
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setShowDeleteModal(false);
      router.push("/admin/matches");
    } catch (error) {
      console.error("Failed to delete match:", error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "deleted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getVerificationBadgeClass = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "unverified":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
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
            href="/admin/matches"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 inline-block"
          >
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/admin/matches"
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
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Match
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Match Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">ID: {match.id}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span
              className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                match.status
              )}`}
            >
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <div className="relative h-16 w-16 mr-4">
                <Image
                  src={match.user1.profileImages[0]}
                  alt={match.user1.name}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-full"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {match.user1.name}, {match.user1.age}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {match.user1.location}
                </p>
                <span
                  className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerificationBadgeClass(
                    match.user1.verificationStatus
                  )}`}
                >
                  {match.user1.verificationStatus.charAt(0).toUpperCase() +
                    match.user1.verificationStatus.slice(1)}
                </span>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Bio
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {match.user1.bio}
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {match.user1.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Joined
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {formatDate(match.user1.joinDate)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Last Active
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {formatDateTime(match.user1.lastActive)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <div className="relative h-16 w-16 mr-4">
                <Image
                  src={match.user2.profileImages[0]}
                  alt={match.user2.name}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-full"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {match.user2.name}, {match.user2.age}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {match.user2.location}
                </p>
                <span
                  className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerificationBadgeClass(
                    match.user2.verificationStatus
                  )}`}
                >
                  {match.user2.verificationStatus.charAt(0).toUpperCase() +
                    match.user2.verificationStatus.slice(1)}
                </span>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Bio
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {match.user2.bio}
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {match.user2.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Joined
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {formatDate(match.user2.joinDate)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Last Active
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {formatDateTime(match.user2.lastActive)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Match Information
          </h2>

          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2 mr-3">
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {match.compatibilityScore}% Compatibility
                </h3>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 ml-11">
              {match.matchExplanation}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Match Created
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {formatDateTime(match.createdAt)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Last Activity
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {formatDateTime(match.lastActivity)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Common Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {match.user1.interests
                .filter((interest) => match.user2.interests.includes(interest))
                .map((interest, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300"
                  >
                    {interest}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Match Statistics
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Messages
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {match.messages.length}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Messages from {match.user1.name}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  match.messages.filter(
                    (msg) => msg.senderId === match.user1.id
                  ).length
                }
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Messages from {match.user2.name}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  match.messages.filter(
                    (msg) => msg.senderId === match.user2.id
                  ).length
                }
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Unread Messages
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {match.messages.filter((msg) => !msg.read).length}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Match Age
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.ceil(
                  (new Date().getTime() - new Date(match.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Message History
        </h2>

        {match.messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No messages exchanged yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {match.messages.map((message) => {
              const isUser1 = message.senderId === match.user1.id;
              const sender = isUser1 ? match.user1 : match.user2;

              return (
                <div key={message.id} className="flex items-start">
                  <div className="relative h-10 w-10 mr-3 flex-shrink-0">
                    <Image
                      src={sender.profileImages[0]}
                      alt={sender.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-gray-900 dark:text-white mr-2">
                        {sender.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(message.timestamp)}
                      </span>
                      {!message.read && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                          Unread
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-700 dark:text-gray-300">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete Match
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this match? This action cannot be
              undone and will remove the match from both users' accounts.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMatch}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

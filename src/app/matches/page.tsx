"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Match {
  id: string;
  userId: string;
  name: string;
  age: number;
  location: string;
  profileImage: string;
  compatibilityScore: number;
  lastActive: string;
  matchDate: string;
  hasUnreadMessages: boolean;
}

export default function Matches() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "recent" | "score" | "name" | "activity"
  >("recent");
  const [filterByUnread, setFilterByUnread] = useState(false);
  const [filterByScore, setFilterByScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockMatches: Match[] = [
          {
            id: "match1",
            userId: "user1",
            name: "Sarah Johnson",
            age: 28,
            location: "New York, USA",
            profileImage: "/avatars/avatar-1.jpg",
            compatibilityScore: 92,
            lastActive: "2 hours ago",
            matchDate: "3 days ago",
            hasUnreadMessages: true,
          },
          {
            id: "match2",
            userId: "user2",
            name: "Michael Chen",
            age: 31,
            location: "San Francisco, USA",
            profileImage: "/avatars/avatar-2.jpg",
            compatibilityScore: 88,
            lastActive: "5 hours ago",
            matchDate: "1 week ago",
            hasUnreadMessages: false,
          },
          {
            id: "match3",
            userId: "user3",
            name: "Jessica Williams",
            age: 26,
            location: "London, UK",
            profileImage: "/avatars/avatar-3.jpg",
            compatibilityScore: 95,
            lastActive: "Just now",
            matchDate: "2 days ago",
            hasUnreadMessages: true,
          },
          {
            id: "match4",
            userId: "user4",
            name: "David Kim",
            age: 33,
            location: "Toronto, Canada",
            profileImage: "/avatars/avatar-4.jpg",
            compatibilityScore: 85,
            lastActive: "1 day ago",
            matchDate: "2 weeks ago",
            hasUnreadMessages: false,
          },
          {
            id: "match5",
            userId: "user5",
            name: "Emily Rodriguez",
            age: 29,
            location: "Chicago, USA",
            profileImage: "/avatars/avatar-5.jpg",
            compatibilityScore: 90,
            lastActive: "3 days ago",
            matchDate: "5 days ago",
            hasUnreadMessages: false,
          },
        ];

        setMatches(mockMatches);
        setFilteredMatches(mockMatches);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setError("Failed to load matches. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...matches];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (match) =>
          match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply unread messages filter
    if (filterByUnread) {
      result = result.filter((match) => match.hasUnreadMessages);
    }

    // Apply compatibility score filter
    if (filterByScore !== null) {
      result = result.filter(
        (match) => match.compatibilityScore >= filterByScore
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.compatibilityScore - a.compatibilityScore;
        case "name":
          return a.name.localeCompare(b.name);
        case "activity":
          // This is simplified - in a real app, you'd compare actual timestamps
          return a.lastActive.localeCompare(b.lastActive);
        case "recent":
        default:
          // This is simplified - in a real app, you'd compare actual timestamps
          return a.matchDate.localeCompare(b.matchDate);
      }
    });

    setFilteredMatches(result);
  }, [matches, searchTerm, sortBy, filterByUnread, filterByScore]);

  const handleMatchClick = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Matches</h1>

      {/* Filters and sorting */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or location"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="recent">Sort by: Most Recent</option>
              <option value="score">Sort by: Highest Match</option>
              <option value="name">Sort by: Name</option>
              <option value="activity">Sort by: Last Active</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filterByScore === null ? "" : filterByScore}
              onChange={(e) =>
                setFilterByScore(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">All Match Scores</option>
              <option value="90">90% and above</option>
              <option value="80">80% and above</option>
              <option value="70">70% and above</option>
            </select>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                checked={filterByUnread}
                onChange={(e) => setFilterByUnread(e.target.checked)}
              />
              <span className="ml-2 text-gray-700">Unread messages only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Matches grid */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No matches found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or check back later for new matches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => handleMatchClick(match.id)}
            >
              <div className="relative h-64 w-full">
                <Image
                  src={match.profileImage}
                  alt={match.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
                <div className="absolute top-0 right-0 m-2">
                  <div className="bg-purple-600 text-white text-sm font-bold px-2 py-1 rounded-full">
                    {match.compatibilityScore}% Match
                  </div>
                </div>
                {match.hasUnreadMessages && (
                  <div className="absolute top-0 left-0 m-2">
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      New Message
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {match.name}, {match.age}
                </h3>
                <p className="text-gray-600 mb-2">{match.location}</p>
                <div className="flex justify-between items-center mt-4 text-sm">
                  <span className="text-gray-500">
                    Matched {match.matchDate}
                  </span>
                  <span className="text-gray-500">
                    Active {match.lastActive}
                  </span>
                </div>
                <div className="flex justify-between mt-4">
                  <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200">
                    Message
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

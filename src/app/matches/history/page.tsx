"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface HistoryMatch {
  id: string;
  userId: string;
  name: string;
  age: number;
  location: string;
  profileImage: string;
  compatibilityScore: number;
  matchDate: string;
  endDate: string | null;
  status: "active" | "expired" | "unmatched" | "blocked";
  reason?: string;
  lastMessageDate?: string;
  messageCount: number;
}

export default function MatchHistory() {
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<HistoryMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "score">("recent");

  useEffect(() => {
    const fetchMatchHistory = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockMatches: HistoryMatch[] = [
          {
            id: "match1",
            userId: "user1",
            name: "Sarah Johnson",
            age: 28,
            location: "New York, USA",
            profileImage: "/avatars/avatar-1.jpg",
            compatibilityScore: 92,
            matchDate: "2023-10-15",
            endDate: null,
            status: "active",
            lastMessageDate: "2023-10-20",
            messageCount: 45,
          },
          {
            id: "match2",
            userId: "user2",
            name: "Michael Chen",
            age: 31,
            location: "San Francisco, USA",
            profileImage: "/avatars/avatar-2.jpg",
            compatibilityScore: 88,
            matchDate: "2023-09-05",
            endDate: "2023-09-25",
            status: "unmatched",
            reason: "No longer interested",
            lastMessageDate: "2023-09-20",
            messageCount: 12,
          },
          {
            id: "match3",
            userId: "user3",
            name: "Jessica Williams",
            age: 26,
            location: "London, UK",
            profileImage: "/avatars/avatar-3.jpg",
            compatibilityScore: 95,
            matchDate: "2023-08-22",
            endDate: "2023-09-30",
            status: "expired",
            lastMessageDate: "2023-09-01",
            messageCount: 3,
          },
          {
            id: "match4",
            userId: "user4",
            name: "David Kim",
            age: 33,
            location: "Toronto, Canada",
            profileImage: "/avatars/avatar-4.jpg",
            compatibilityScore: 85,
            matchDate: "2023-07-10",
            endDate: "2023-08-05",
            status: "blocked",
            reason: "Inappropriate behavior",
            messageCount: 8,
          },
          {
            id: "match5",
            userId: "user5",
            name: "Emily Rodriguez",
            age: 29,
            location: "Chicago, USA",
            profileImage: "/avatars/avatar-5.jpg",
            compatibilityScore: 90,
            matchDate: "2023-06-18",
            endDate: "2023-07-30",
            status: "unmatched",
            reason: "Lost interest",
            lastMessageDate: "2023-07-25",
            messageCount: 32,
          },
        ];

        setMatches(mockMatches);
        setFilteredMatches(mockMatches);
      } catch (error) {
        console.error("Failed to fetch match history:", error);
        setError("Failed to load match history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchHistory();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...matches];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((match) => match.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (match) =>
          match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
          );
        case "score":
          return b.compatibilityScore - a.compatibilityScore;
        case "recent":
        default:
          return (
            new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
          );
      }
    });

    setFilteredMatches(result);
  }, [matches, statusFilter, searchTerm, sortBy]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return "Ongoing";

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Less than a day";
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month";
    if (diffMonths < 12) return `${diffMonths} months`;

    const diffYears = Math.floor(diffMonths / 12);
    if (diffYears === 1) return "1 year";
    return `${diffYears} years`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "expired":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "unmatched":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          Match History
        </h1>
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
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Current Matches
        </Link>
      </div>

      {/* Filters and sorting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or location"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="unmatched">Unmatched</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="recent">Sort by: Most Recent</option>
              <option value="oldest">Sort by: Oldest First</option>
              <option value="score">Sort by: Highest Match</option>
            </select>
          </div>
        </div>
      </div>

      {/* Match history list */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            No match history found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your filters or check back later.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Match
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Date Range
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Messages
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMatches.map((match) => (
                  <tr
                    key={match.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <Image
                            src={match.profileImage}
                            alt={match.name}
                            fill
                            style={{ objectFit: "cover" }}
                            className="rounded-full"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.name}, {match.age}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {match.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(match.matchDate)}
                      </div>
                      {match.endDate && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          to {formatDate(match.endDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {calculateDuration(match.matchDate, match.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          match.status
                        )}`}
                      >
                        {match.status.charAt(0).toUpperCase() +
                          match.status.slice(1)}
                      </span>
                      {match.reason && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {match.reason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {match.messageCount > 0 ? (
                        <div>
                          <div>{match.messageCount} messages</div>
                          {match.lastMessageDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Last: {formatDate(match.lastMessageDate)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                          No messages
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/matches/${match.id}`}
                        className="text-purple-600 hover:text-purple-900 dark:hover:text-purple-400 mr-4"
                      >
                        View
                      </Link>
                      {match.status === "active" && (
                        <Link
                          href={`/messages/${match.id}`}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                        >
                          Message
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Your match history is kept for 12 months. Older matches may no longer
          be visible.
        </p>
      </div>
    </div>
  );
}

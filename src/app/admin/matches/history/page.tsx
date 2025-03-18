"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MatchHistoryItem {
  id: string;
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  compatibilityScore: number;
  status: "active" | "inactive" | "deleted" | "expired";
  createdAt: string;
  lastActivity: string;
  messageCount: number;
  outcome: "ongoing" | "success" | "failed" | "unknown";
}

interface MatchHistoryStats {
  totalMatches: number;
  activeMatches: number;
  successRate: number;
  averageCompatibility: number;
  averageMessageCount: number;
  averageDuration: number; // in days
}

export default function MatchHistory() {
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [stats, setStats] = useState<MatchHistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [dateRange, setDateRange] = useState<string>("all");

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchMatchHistory = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate mock match history data
        const mockHistory: MatchHistoryItem[] = Array.from(
          { length: 50 },
          (_, i) => {
            const id = `match-${i + 1}`;
            const createdDate = new Date();
            createdDate.setDate(
              createdDate.getDate() - Math.floor(Math.random() * 90)
            ); // Random date within last 90 days

            const lastActivityDate = new Date(createdDate);
            lastActivityDate.setDate(
              lastActivityDate.getDate() + Math.floor(Math.random() * 30)
            ); // Random activity 0-30 days after creation

            const compatibilityScore = Math.floor(Math.random() * 40) + 60; // 60-99
            const messageCount = Math.floor(Math.random() * 100); // 0-99

            // Determine status and outcome based on random factors
            let status: "active" | "inactive" | "deleted" | "expired";
            let outcome: "ongoing" | "success" | "failed" | "unknown";

            const randomFactor = Math.random();
            if (randomFactor < 0.4) {
              status = "active";
              outcome = "ongoing";
            } else if (randomFactor < 0.6) {
              status = "inactive";
              outcome = messageCount > 20 ? "success" : "failed";
            } else if (randomFactor < 0.8) {
              status = "expired";
              outcome = messageCount > 5 ? "unknown" : "failed";
            } else {
              status = "deleted";
              outcome = "failed";
            }

            return {
              id,
              user1Id: `user-${i * 2 + 1}`,
              user1Name: `User ${i * 2 + 1}`,
              user2Id: `user-${i * 2 + 2}`,
              user2Name: `User ${i * 2 + 2}`,
              compatibilityScore,
              status,
              createdAt: createdDate.toISOString(),
              lastActivity: lastActivityDate.toISOString(),
              messageCount,
              outcome,
            };
          }
        );

        // Calculate stats
        const activeMatches = mockHistory.filter(
          (match) => match.status === "active"
        ).length;
        const successfulMatches = mockHistory.filter(
          (match) => match.outcome === "success"
        ).length;
        const totalCompatibility = mockHistory.reduce(
          (sum, match) => sum + match.compatibilityScore,
          0
        );
        const totalMessages = mockHistory.reduce(
          (sum, match) => sum + match.messageCount,
          0
        );
        const totalDuration = mockHistory.reduce((sum, match) => {
          const createdDate = new Date(match.createdAt);
          const lastActivityDate = new Date(match.lastActivity);
          const durationDays = Math.ceil(
            (lastActivityDate.getTime() - createdDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return sum + durationDays;
        }, 0);

        const mockStats: MatchHistoryStats = {
          totalMatches: mockHistory.length,
          activeMatches,
          successRate: (successfulMatches / mockHistory.length) * 100,
          averageCompatibility: totalCompatibility / mockHistory.length,
          averageMessageCount: totalMessages / mockHistory.length,
          averageDuration: totalDuration / mockHistory.length,
        };

        setMatchHistory(mockHistory);
        setStats(mockStats);
        setTotalPages(Math.ceil(mockHistory.length / itemsPerPage));
      } catch (error) {
        console.error("Failed to fetch match history:", error);
        setError("Failed to load match history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchHistory();
  }, []);

  // Filter and sort the match history
  const filteredAndSortedHistory = matchHistory
    .filter((match) => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          match.id.toLowerCase().includes(searchLower) ||
          match.user1Name.toLowerCase().includes(searchLower) ||
          match.user2Name.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter((match) => {
      // Apply status filter
      if (statusFilter !== "all") {
        return match.status === statusFilter;
      }
      return true;
    })
    .filter((match) => {
      // Apply outcome filter
      if (outcomeFilter !== "all") {
        return match.outcome === outcomeFilter;
      }
      return true;
    })
    .filter((match) => {
      // Apply date range filter
      if (dateRange !== "all") {
        const matchDate = new Date(match.createdAt);
        const now = new Date();

        switch (dateRange) {
          case "last_7_days":
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return matchDate >= sevenDaysAgo;
          case "last_30_days":
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return matchDate >= thirtyDaysAgo;
          case "last_90_days":
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(now.getDate() - 90);
            return matchDate >= ninetyDaysAgo;
          default:
            return true;
        }
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "date_asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "date_desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "compatibility_asc":
          return a.compatibilityScore - b.compatibilityScore;
        case "compatibility_desc":
          return b.compatibilityScore - a.compatibilityScore;
        case "messages_asc":
          return a.messageCount - b.messageCount;
        case "messages_desc":
          return b.messageCount - a.messageCount;
        default:
          return 0;
      }
    });

  // Calculate pagination
  const totalFilteredItems = filteredAndSortedHistory.length;
  const totalFilteredPages = Math.max(
    1,
    Math.ceil(totalFilteredItems / itemsPerPage)
  );

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalFilteredPages) {
      setCurrentPage(totalFilteredPages);
    }
  }, [currentPage, totalFilteredPages]);

  // Get current page items
  const currentItems = filteredAndSortedHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "deleted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getOutcomeBadgeClass = (outcome: string) => {
    switch (outcome) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "ongoing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "unknown":
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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
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
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Match History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and analyze past matches and their outcomes
          </p>
        </div>
        <Link
          href="/admin/matches"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 inline-block"
        >
          Back to Matches
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Match Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Matches
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalMatches}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Active Matches
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeMatches}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Success Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.successRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Avg. Compatibility
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageCompatibility.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Engagement Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Avg. Messages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageMessageCount.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Avg. Duration
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageDuration.toFixed(1)} days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="outcome"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Outcome
            </label>
            <select
              id="outcome"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Outcomes</option>
              <option value="ongoing">Ongoing</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dateRange"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Date Range
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="sortBy"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="compatibility_desc">
                Compatibility (High to Low)
              </option>
              <option value="compatibility_asc">
                Compatibility (Low to High)
              </option>
              <option value="messages_desc">Messages (High to Low)</option>
              <option value="messages_asc">Messages (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Match ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Users
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Compatibility
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Created
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
                  Outcome
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Messages
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {currentItems.length > 0 ? (
                currentItems.map((match) => (
                  <tr
                    key={match.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {match.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div>{match.user1Name}</div>
                      <div>{match.user2Name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {match.compatibilityScore}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(match.createdAt)}
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOutcomeBadgeClass(
                          match.outcome
                        )}`}
                      >
                        {match.outcome.charAt(0).toUpperCase() +
                          match.outcome.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {match.messageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/matches/${match.id}`}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No matches found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalFilteredPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing{" "}
            <span className="font-medium">
              {Math.min(
                totalFilteredItems,
                (currentPage - 1) * itemsPerPage + 1
              )}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(totalFilteredItems, currentPage * itemsPerPage)}
            </span>{" "}
            of <span className="font-medium">{totalFilteredItems}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalFilteredPages, prev + 1))
              }
              disabled={currentPage === totalFilteredPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalFilteredPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

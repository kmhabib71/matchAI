"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Mock data for charts
const generateMockData = () => {
  // User growth data - last 12 months
  const userGrowthData = Array.from({ length: 12 }, (_, i) => {
    const baseValue = 50 + i * 20;
    const randomVariation = Math.floor(Math.random() * 30) - 15;
    return baseValue + randomVariation;
  });

  // Match success rate data - last 12 months
  const matchSuccessData = Array.from({ length: 12 }, () => {
    return Math.floor(Math.random() * 30) + 60; // 60-90% success rate
  });

  // User activity by hour
  const userActivityByHour = Array.from({ length: 24 }, (_, i) => {
    // Lower activity during night hours, peak during evening
    let baseValue;
    if (i >= 0 && i < 6) {
      baseValue = 10; // Night (0-6am)
    } else if (i >= 6 && i < 12) {
      baseValue = 40; // Morning (6am-12pm)
    } else if (i >= 12 && i < 18) {
      baseValue = 60; // Afternoon (12pm-6pm)
    } else {
      baseValue = 80; // Evening (6pm-12am)
    }
    const randomVariation = Math.floor(Math.random() * 20) - 10;
    return Math.max(5, baseValue + randomVariation);
  });

  // Subscription plan distribution
  const subscriptionData = {
    free: 65,
    basic: 20,
    premium: 15,
  };

  // User retention data - 6 months
  const retentionData = Array.from({ length: 6 }, (_, i) => {
    return Math.max(30, 90 - i * 10 - Math.floor(Math.random() * 5));
  });

  return {
    userGrowthData,
    matchSuccessData,
    userActivityByHour,
    subscriptionData,
    retentionData,
  };
};

export default function AdminAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("month");

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate mock data
        const mockData = generateMockData();
        setAnalyticsData(mockData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentMonth = new Date().getMonth();
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = (currentMonth - i + 12) % 12;
    return months[monthIndex];
  }).reverse();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor platform performance and user engagement
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              timeRange === "week"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              timeRange === "month"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              timeRange === "year"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Year
          </button>
        </div>
        <button className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            User Growth
          </h2>
          <div className="h-64 relative">
            {/* Chart bars */}
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {analyticsData.userGrowthData.map(
                (value: number, index: number) => {
                  const height = `${(value / 100) * 80}%`;
                  return (
                    <div
                      key={index}
                      className="w-1/13 bg-purple-500 dark:bg-purple-600 rounded-t"
                      style={{ height }}
                    ></div>
                  );
                }
              )}
            </div>
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {last12Months.map((month, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {month}
                </div>
              ))}
            </div>
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 25, 50, 75, 100].map((value, index) => (
                <div
                  key={index}
                  className="w-full border-b border-gray-100 dark:border-gray-700 flex items-center"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 pr-2">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>
              Total Users:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                1,250
              </span>
            </div>
            <div>
              Growth Rate:{" "}
              <span className="font-medium text-green-600 dark:text-green-400">
                +12.5%
              </span>
            </div>
          </div>
        </div>

        {/* Match Success Rate Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Match Success Rate
          </h2>
          <div className="h-64 relative">
            {/* Line chart */}
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polyline
                points={analyticsData.matchSuccessData
                  .map((value: number, index: number) => {
                    const x =
                      (index / (analyticsData.matchSuccessData.length - 1)) *
                      100;
                    const y = 100 - value;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 25, 50, 75, 100].map((value, index) => (
                <div
                  key={index}
                  className="w-full border-b border-gray-100 dark:border-gray-700 flex items-center"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 pr-2">
                    {value}%
                  </span>
                </div>
              ))}
            </div>
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {last12Months.map((month, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {index % 2 === 0 ? month : ""}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>
              Average Success Rate:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(
                  analyticsData.matchSuccessData.reduce(
                    (acc: number, val: number) => acc + val,
                    0
                  ) / analyticsData.matchSuccessData.length
                )}
                %
              </span>
            </div>
            <div>
              Total Matches:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                3,421
              </span>
            </div>
          </div>
        </div>

        {/* User Activity by Hour */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            User Activity by Hour
          </h2>
          <div className="h-64 relative">
            {/* Chart bars */}
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {analyticsData.userActivityByHour.map(
                (value: number, index: number) => {
                  const height = `${(value / 100) * 80}%`;
                  return (
                    <div
                      key={index}
                      className="w-1/25 bg-blue-500 dark:bg-blue-600 rounded-t"
                      style={{ height }}
                    ></div>
                  );
                }
              )}
            </div>
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {Array.from({ length: 24 }, (_, i) => i).map((hour, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {index % 4 === 0 ? `${hour}:00` : ""}
                </div>
              ))}
            </div>
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 25, 50, 75, 100].map((value, index) => (
                <div
                  key={index}
                  className="w-full border-b border-gray-100 dark:border-gray-700 flex items-center"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 pr-2">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <div>
              Peak Activity:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {analyticsData.userActivityByHour.indexOf(
                  Math.max(...analyticsData.userActivityByHour)
                )}
                :00
              </span>
            </div>
            <div>
              Lowest Activity:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {analyticsData.userActivityByHour.indexOf(
                  Math.min(...analyticsData.userActivityByHour)
                )}
                :00
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Subscription Plan Distribution
          </h2>
          <div className="h-64 flex items-center justify-center">
            {/* Donut chart */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Free plan slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#9CA3AF"
                  strokeWidth="20"
                  strokeDasharray={`${
                    analyticsData.subscriptionData.free * 2.51
                  } 251`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />
                {/* Basic plan slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#8B5CF6"
                  strokeWidth="20"
                  strokeDasharray={`${
                    analyticsData.subscriptionData.basic * 2.51
                  } 251`}
                  strokeDashoffset={`${
                    -analyticsData.subscriptionData.free * 2.51
                  }`}
                  transform="rotate(-90 50 50)"
                />
                {/* Premium plan slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#4F46E5"
                  strokeWidth="20"
                  strokeDasharray={`${
                    analyticsData.subscriptionData.premium * 2.51
                  } 251`}
                  strokeDashoffset={`${
                    -(
                      analyticsData.subscriptionData.free +
                      analyticsData.subscriptionData.basic
                    ) * 2.51
                  }`}
                  transform="rotate(-90 50 50)"
                />
                {/* Inner circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="white"
                  className="dark:fill-gray-800"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-medium text-gray-900 dark:text-white">
                {analyticsData.subscriptionData.premium}%
                <span className="text-xs ml-1">Premium</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Free ({analyticsData.subscriptionData.free}%)
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 dark:bg-purple-600 rounded-full mr-2"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Basic ({analyticsData.subscriptionData.basic}%)
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Premium ({analyticsData.subscriptionData.premium}%)
              </span>
            </div>
          </div>
        </div>

        {/* User Retention */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            User Retention
          </h2>
          <div className="h-64 relative">
            {/* Chart bars */}
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {analyticsData.retentionData.map(
                (value: number, index: number) => {
                  const height = `${value}%`;
                  return (
                    <div
                      key={index}
                      className="w-1/7 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-green-500 dark:bg-green-600 rounded-t"
                        style={{ height }}
                      ></div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {index === 0
                          ? "1st"
                          : index === 1
                          ? "2nd"
                          : index === 2
                          ? "3rd"
                          : `${index + 1}th`}{" "}
                        month
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {value}%
                      </div>
                    </div>
                  );
                }
              )}
            </div>
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 25, 50, 75, 100].map((value, index) => (
                <div
                  key={index}
                  className="w-full border-b border-gray-100 dark:border-gray-700 flex items-center"
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 pr-2">
                    {value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>
              <span className="font-medium text-gray-900 dark:text-white">
                {analyticsData.retentionData[0]}%
              </span>{" "}
              of users remain active after the first month, with{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {analyticsData.retentionData[5]}%
              </span>{" "}
              still active after 6 months. Premium subscribers show a{" "}
              <span className="font-medium text-green-600 dark:text-green-400">
                15% higher
              </span>{" "}
              retention rate compared to free users.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
              User Engagement
            </h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Average session duration increased by 12% compared to last month
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Users who complete profile verification are 3x more likely to
                get matches
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-500 mr-2 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                20% of users abandon the app after receiving no matches in the
                first week
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
              Revenue & Conversion
            </h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Premium subscription conversion rate increased to 15% (up from
                12%)
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Monthly recurring revenue grew by 18% compared to previous
                quarter
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Free-to-paid conversion rate is lower for users under 25 years
                old
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/admin/reports/analytics"
          className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500"
        >
          View detailed reports →
        </Link>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ReportUserModal from "./ReportUserModal";

interface MatchCardProps {
  match: {
    _id: string;
    name: string;
    age: number;
    location: string;
    profileImage?: string;
    compatibilityScore: number;
    personalityType?: string;
  };
  onNextMatch?: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onNextMatch }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getCompatibilityColor = (score: number): string => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="relative h-80 w-full">
          {match.profileImage && !imageError ? (
            <Image
              src={match.profileImage}
              alt={match.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <svg
                className="w-24 h-24 text-gray-400 dark:text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {match.name}, {match.age}
                </h3>
                <p className="text-sm text-gray-200">{match.location}</p>
              </div>
              <div
                className={`text-lg font-bold ${getCompatibilityColor(
                  match.compatibilityScore
                )}`}
              >
                {match.compatibilityScore}%
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-2 flex items-center"
          >
            {showDetails ? "Hide details" : "Show details"}
            <svg
              className={`ml-1 w-4 h-4 transition-transform ${
                showDetails ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showDetails && (
            <div className="space-y-4 mt-2">
              {match.personalityType && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Personality Type
                  </h4>
                  <p className="text-gray-900 dark:text-gray-100">
                    {match.personalityType}
                  </p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Compatibility
                </h4>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                    <div
                      style={{
                        width: `${match.compatibilityScore.toFixed(2)}%`,
                      }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        match.compatibilityScore >= 80
                          ? "bg-green-500"
                          : match.compatibilityScore >= 60
                          ? "bg-blue-500"
                          : match.compatibilityScore >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex space-x-2">
            <Link
              href={`/chat/${match._id}`}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 text-center"
            >
              Start Chat
            </Link>
            {onNextMatch && (
              <button
                onClick={onNextMatch}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Next Match
              </button>
            )}
          </div>
        </div>
      </div>

      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={match._id}
        reportedUserName={match.name}
      />
    </>
  );
};

export default MatchCard;

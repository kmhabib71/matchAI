import React from "react";

interface MatchCompatibilityInfoProps {
  compatibilityScore: number;
  personalityType?: string;
  traits?: string[];
  interests?: string[];
  explanation?: string;
}

export default function MatchCompatibilityInfo({
  compatibilityScore,
  personalityType,
  traits,
  interests,
  explanation,
}: MatchCompatibilityInfoProps) {
  // Generate explanation text based on compatibility score
  const getCompatibilityExplanation = (score: number) => {
    if (score >= 90) {
      return "Exceptional match! Your personalities and interests align remarkably well.";
    } else if (score >= 80) {
      return "Great compatibility! You share many important values and interests.";
    } else if (score >= 70) {
      return "Good match with strong potential for meaningful connection.";
    } else {
      return "You have some common interests that could form the basis of a connection.";
    }
  };

  // Get compatibility level text
  const getCompatibilityLevel = (score: number) => {
    if (score >= 90) return "Exceptional";
    if (score >= 80) return "Great";
    if (score >= 70) return "Good";
    return "Fair";
  };

  // Get appropriate color gradient for score
  const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-purple-600 to-pink-500";
    if (score >= 80) return "from-purple-600 to-indigo-500";
    if (score >= 70) return "from-blue-500 to-indigo-600";
    return "from-blue-400 to-indigo-500";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div
            className={`flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r ${getScoreGradient(
              compatibilityScore
            )} flex items-center justify-center text-white font-bold text-lg shadow-md`}
          >
            {compatibilityScore}%
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {getCompatibilityLevel(compatibilityScore)} Compatibility
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Based on personality and interests
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            {explanation || getCompatibilityExplanation(compatibilityScore)}
          </p>
        </div>

        {personalityType && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personality Type
            </h4>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {personalityType}
            </div>
          </div>
        )}

        {traits && traits.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Traits
            </h4>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {interests && interests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shared Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

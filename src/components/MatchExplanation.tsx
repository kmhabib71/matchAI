"use client";

import React from "react";

interface MatchExplanationProps {
  explanation: string;
  compatibilityScore: number;
}

const MatchExplanation: React.FC<MatchExplanationProps> = ({
  explanation,
  compatibilityScore,
}) => {
  // Helper function to determine color based on compatibility score
  const getScoreColor = (score: number): string => {
    if (score >= 80)
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    if (score >= 60)
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    if (score >= 40)
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
  };

  // Helper function to get emoji based on compatibility score
  const getScoreEmoji = (score: number): string => {
    if (score >= 80) return "✨";
    if (score >= 60) return "🌟";
    if (score >= 40) return "🔍";
    return "🤔";
  };

  // Format the explanation text with paragraph breaks
  const formatExplanation = (text: string): React.ReactNode[] => {
    return text.split(". ").map((sentence, index, array) => {
      // Add the period back except for the last element if it doesn't end with a period
      const displaySentence =
        index < array.length - 1 || sentence.endsWith(".")
          ? sentence
          : sentence + ".";

      return (
        <p key={index} className="mb-2">
          {displaySentence}
        </p>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Match Analysis
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
            compatibilityScore
          )}`}
        >
          {getScoreEmoji(compatibilityScore)} {compatibilityScore}% Compatible
        </div>
      </div>

      <div className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-300">
        {formatExplanation(explanation)}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">AI-Powered Match:</span> Our algorithm
          analyzes personality traits, interests, relationship goals, and
          lifestyle preferences to find your most compatible matches.
        </div>
      </div>
    </div>
  );
};

export default MatchExplanation;

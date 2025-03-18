"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MatchingParameter {
  id: string;
  name: string;
  description: string;
  value: number;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  category: "compatibility" | "algorithm" | "preferences" | "limits";
}

interface MatchSettings {
  parameters: MatchingParameter[];
  lastUpdated: string;
  updatedBy: string;
}

export default function MatchSettings() {
  const [settings, setSettings] = useState<MatchSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<
    "compatibility" | "algorithm" | "preferences" | "limits"
  >("compatibility");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data for match settings
        const mockSettings: MatchSettings = {
          parameters: [
            // Compatibility parameters
            {
              id: "interest_weight",
              name: "Interest Match Weight",
              description:
                "How much weight to give to matching interests when calculating compatibility scores",
              value: 30,
              minValue: 0,
              maxValue: 100,
              defaultValue: 30,
              category: "compatibility",
            },
            {
              id: "location_weight",
              name: "Location Proximity Weight",
              description:
                "How much weight to give to geographic proximity when calculating compatibility scores",
              value: 15,
              minValue: 0,
              maxValue: 100,
              defaultValue: 15,
              category: "compatibility",
            },
            {
              id: "personality_weight",
              name: "Personality Match Weight",
              description:
                "How much weight to give to personality traits when calculating compatibility scores",
              value: 25,
              minValue: 0,
              maxValue: 100,
              defaultValue: 25,
              category: "compatibility",
            },
            {
              id: "values_weight",
              name: "Values Match Weight",
              description:
                "How much weight to give to personal values when calculating compatibility scores",
              value: 20,
              minValue: 0,
              maxValue: 100,
              defaultValue: 20,
              category: "compatibility",
            },
            {
              id: "goals_weight",
              name: "Relationship Goals Weight",
              description:
                "How much weight to give to relationship goals when calculating compatibility scores",
              value: 10,
              minValue: 0,
              maxValue: 100,
              defaultValue: 10,
              category: "compatibility",
            },

            // Algorithm parameters
            {
              id: "min_compatibility",
              name: "Minimum Compatibility Threshold",
              description:
                "Minimum compatibility score required to create a match",
              value: 60,
              minValue: 0,
              maxValue: 100,
              defaultValue: 60,
              category: "algorithm",
            },
            {
              id: "ai_confidence",
              name: "AI Confidence Threshold",
              description:
                "Minimum confidence level required from AI analysis to suggest a match",
              value: 75,
              minValue: 0,
              maxValue: 100,
              defaultValue: 75,
              category: "algorithm",
            },
            {
              id: "match_freshness",
              name: "Match Freshness Period (days)",
              description:
                "How long to consider a profile 'fresh' for matching purposes",
              value: 30,
              minValue: 1,
              maxValue: 90,
              defaultValue: 30,
              category: "algorithm",
            },
            {
              id: "activity_boost",
              name: "Activity Boost Factor",
              description:
                "How much to boost profiles with recent activity in match suggestions",
              value: 15,
              minValue: 0,
              maxValue: 50,
              defaultValue: 15,
              category: "algorithm",
            },

            // Preferences parameters
            {
              id: "age_range_flexibility",
              name: "Age Range Flexibility",
              description: "How strictly to enforce user age range preferences",
              value: 2,
              minValue: 0,
              maxValue: 10,
              defaultValue: 2,
              category: "preferences",
            },
            {
              id: "distance_flexibility",
              name: "Distance Flexibility (miles)",
              description:
                "How much to extend beyond user distance preferences",
              value: 10,
              minValue: 0,
              maxValue: 50,
              defaultValue: 10,
              category: "preferences",
            },
            {
              id: "preference_override",
              name: "Preference Override Threshold",
              description:
                "Compatibility score needed to override certain user preferences",
              value: 85,
              minValue: 0,
              maxValue: 100,
              defaultValue: 85,
              category: "preferences",
            },

            // Limits parameters
            {
              id: "daily_matches",
              name: "Daily Match Limit (Free Users)",
              description:
                "Maximum number of matches to show free users per day",
              value: 5,
              minValue: 1,
              maxValue: 20,
              defaultValue: 5,
              category: "limits",
            },
            {
              id: "premium_daily_matches",
              name: "Daily Match Limit (Premium Users)",
              description:
                "Maximum number of matches to show premium users per day",
              value: 15,
              minValue: 5,
              maxValue: 50,
              defaultValue: 15,
              category: "limits",
            },
            {
              id: "match_expiry",
              name: "Match Expiry Period (days)",
              description: "Number of days before an inactive match expires",
              value: 14,
              minValue: 1,
              maxValue: 30,
              defaultValue: 14,
              category: "limits",
            },
          ],
          lastUpdated: "2023-10-15T09:20:00Z",
          updatedBy: "Admin User",
        };

        setSettings(mockSettings);
      } catch (error) {
        console.error("Failed to fetch match settings:", error);
        setError("Failed to load match settings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleParameterChange = (id: string, newValue: number) => {
    if (!settings) return;

    setSettings({
      ...settings,
      parameters: settings.parameters.map((param) =>
        param.id === id ? { ...param, value: newValue } : param
      ),
    });
  };

  const handleResetToDefault = (id: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      parameters: settings.parameters.map((param) =>
        param.id === id ? { ...param, value: param.defaultValue } : param
      ),
    });
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      // In a real app, this would be an API call to save the settings
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess("Match settings saved successfully!");

      // Update the lastUpdated timestamp
      if (settings) {
        setSettings({
          ...settings,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to save match settings:", error);
      setError("Failed to save match settings. Please try again later.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllToDefault = () => {
    if (!settings) return;

    setSettings({
      ...settings,
      parameters: settings.parameters.map((param) => ({
        ...param,
        value: param.defaultValue,
      })),
    });
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !settings) {
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

  const filteredParameters =
    settings?.parameters.filter((param) => param.category === activeTab) || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Match Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure matching algorithm parameters and thresholds
          </p>
        </div>
        <Link
          href="/admin/matches"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 inline-block"
        >
          Back to Matches
        </Link>
      </div>

      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
          role="alert"
        >
          <span className="block sm:inline">{success}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess("")}
          >
            <svg
              className="fill-current h-6 w-6 text-green-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </button>
        </div>
      )}

      {error && settings && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError("")}
          >
            <svg
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("compatibility")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "compatibility"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Compatibility Weights
            </button>
            <button
              onClick={() => setActiveTab("algorithm")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "algorithm"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Algorithm Settings
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "preferences"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Preference Handling
            </button>
            <button
              onClick={() => setActiveTab("limits")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "limits"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Limits & Restrictions
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeTab === "compatibility" && "Compatibility Weight Settings"}
              {activeTab === "algorithm" && "Algorithm Configuration"}
              {activeTab === "preferences" && "User Preference Handling"}
              {activeTab === "limits" && "Limits & Restrictions"}
            </h2>
            <button
              onClick={handleResetAllToDefault}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Reset All to Default
            </button>
          </div>

          <div className="space-y-6">
            {filteredParameters.map((param) => (
              <div
                key={param.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                  <div className="mb-2 md:mb-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {param.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {param.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {param.value}
                    </span>
                    <button
                      onClick={() => handleResetToDefault(param.id)}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {param.minValue}
                  </span>
                  <input
                    type="range"
                    min={param.minValue}
                    max={param.maxValue}
                    value={param.value}
                    onChange={(e) =>
                      handleParameterChange(param.id, parseInt(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    {param.maxValue}
                  </span>
                </div>

                {param.value !== param.defaultValue && (
                  <div className="mt-2 text-xs text-gray-500">
                    Default: {param.defaultValue}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last updated:{" "}
          {settings?.lastUpdated
            ? formatDateTime(settings.lastUpdated)
            : "Never"}
          {settings?.updatedBy && ` by ${settings.updatedBy}`}
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center ${
            isSaving ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSaving && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

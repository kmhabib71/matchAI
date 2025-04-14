"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SubscriptionCardProps {
  compact?: boolean; // Whether to show a compact version (for sidebars, etc.)
  showUpgradeButton?: boolean; // Whether to show the upgrade button
  className?: string; // Additional CSS classes
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  compact = false,
  showUpgradeButton = true,
  className = "",
}) => {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      // Add authorization header if using direct login
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/subscription", { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subscription");
      }

      setSubscription(data.subscription);
    } catch (err: any) {
      console.error("Error fetching subscription:", err);
      setError(err.message || "Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get plan name in readable format
  const getPlanName = (planId: string): string => {
    switch (planId) {
      case "free":
        return "Free Plan";
      case "premium_basic":
        return "Premium Basic";
      case "premium_plus":
        return "Premium Plus";
      default:
        return planId;
    }
  };

  // Function to get usage data
  const getUsageSummary = (): {
    used: number;
    total: number;
    type: string;
  }[] => {
    if (!subscription) return [];

    return [
      {
        used: subscription.usedMatches || 0,
        total: subscription.matchesLimit || 3,
        type: "Matches",
      },
      {
        used: subscription.usedProposals || 0,
        total: subscription.proposalsLimit || 3,
        type: "Proposals",
      },
      {
        used: subscription.usedContacts || 0,
        total: subscription.contactsLimit || 3,
        type: "Contacts",
      },
      {
        used: subscription.usedChats || 0,
        total: subscription.chatsLimit || 3,
        type: "Chats",
      },
    ];
  };

  // Calculate days remaining until expiration
  const getDaysRemaining = (): number => {
    if (!subscription || !subscription.currentPeriodEnd) return 0;

    const endDate = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse flex flex-col space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <p className="text-red-500 text-sm">Error loading subscription data</p>
        {showUpgradeButton && (
          <Link
            href="/subscription"
            className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-500"
          >
            View Plans
          </Link>
        )}
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <p className="text-sm">No subscription data available</p>
        {showUpgradeButton && (
          <Link
            href="/subscription"
            className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-500"
          >
            View Plans
          </Link>
        )}
      </div>
    );
  }

  const usageSummary = getUsageSummary();
  const daysRemaining = getDaysRemaining();
  const isPending = subscription.status === "pending";

  // Compact version (for sidebars)
  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow p-3 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {getPlanName(subscription.planId)}
            </h4>
            {isPending ? (
              <span className="text-xs text-yellow-600">Payment pending</span>
            ) : (
              <span className="text-xs text-gray-500">
                {daysRemaining} days left
              </span>
            )}
          </div>
          {showUpgradeButton && (
            <Link
              href="/subscription"
              className="text-xs font-medium text-purple-600 hover:text-purple-500"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getPlanName(subscription.planId)}
          </h3>
          {isPending ? (
            <div className="flex items-center mt-1">
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                Payment pending
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              Renews in {daysRemaining} days
            </p>
          )}
        </div>
        {showUpgradeButton && (
          <Link
            href="/subscription"
            className="px-3 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
          >
            {subscription.planId === "free" ? "Upgrade" : "Manage"}
          </Link>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {usageSummary.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">{item.type}</span>
              <span className="font-medium text-gray-700">
                {item.used} / {item.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  item.used >= item.total
                    ? "bg-red-500"
                    : item.used > item.total * 0.7
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(100, (item.used / item.total) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionCard;

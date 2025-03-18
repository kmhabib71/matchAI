"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface PlanFeature {
  included: boolean;
  text: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userSubscription, setUserSubscription] = useState<any>(null);

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      period: "forever",
      description: "Basic features for casual users",
      features: [
        { included: true, text: "3 matches per month" },
        { included: true, text: "Basic profile customization" },
        { included: false, text: "AI-powered compatibility scoring" },
        { included: false, text: "Unlimited matches" },
      ],
    },
    {
      id: "monthly",
      name: "Premium",
      price: 9.99,
      period: "month",
      description: "All features for serious daters",
      features: [
        { included: true, text: "Unlimited matches" },
        { included: true, text: "Advanced profile customization" },
        { included: true, text: "AI-powered compatibility scoring" },
        { included: true, text: "Priority support" },
      ],
      popular: true,
    },
    {
      id: "yearly",
      name: "Premium Yearly",
      price: 89.99,
      period: "year",
      description: "Save 25% with annual billing",
      features: [
        { included: true, text: "Unlimited matches" },
        { included: true, text: "Advanced profile customization" },
        { included: true, text: "AI-powered compatibility scoring" },
        { included: true, text: "Priority support" },
        { included: true, text: "Exclusive seasonal events" },
      ],
    },
  ];

  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      // Check for direct login token
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        router.push("/login");
        return;
      }
    }

    if (status === "authenticated" || localStorage.getItem("authToken")) {
      fetchUserSubscription();
    }
  }, [status, router]);

  const fetchUserSubscription = async () => {
    try {
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

      setUserSubscription(data.subscription);

      // If this is demo data, show a message
      if (data.demo) {
        setError(
          "You're viewing demo data. Please sign in to manage your real subscription."
        );
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while fetching your subscription"
      );
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (selectedPlan === "free") {
      router.push("/dashboard");
      return;
    }

    // Check if we're in demo mode
    if (error && error.includes("demo data")) {
      setError(
        "You cannot subscribe in demo mode. Please sign in with a real account."
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Add authorization header if using direct login
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/subscription", {
        method: "POST",
        headers,
        body: JSON.stringify({
          planId: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process subscription");
      }

      // Redirect to checkout page or show success message
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while processing your subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Subscription Plans
          </h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {userSubscription && userSubscription.status === "active" && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm leading-5 font-medium text-green-800">
                  You are currently subscribed to the {userSubscription.planId}{" "}
                  plan.
                </p>
                <p className="text-sm leading-5 text-green-700 mt-1">
                  Your subscription will renew on{" "}
                  {new Date(
                    userSubscription.currentPeriodEnd
                  ).toLocaleDateString()}
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Find Your Perfect Match with Premium
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            Upgrade to unlock all features and increase your chances of finding
            the perfect match.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                plan.popular
                  ? "border-purple-500 ring-2 ring-purple-500"
                  : "border-gray-200"
              } relative`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="ml-1 text-xl font-medium text-gray-500">
                    /{plan.period}
                  </span>
                </div>
                <p className="mt-2 text-gray-500">{plan.description}</p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        {feature.included ? (
                          <svg
                            className="h-5 w-5 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </div>
                      <p
                        className={`ml-3 text-sm ${
                          feature.included ? "text-gray-700" : "text-gray-400"
                        }`}
                      >
                        {feature.text}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                      selectedPlan === plan.id
                        ? "bg-purple-600 text-white border-transparent hover:bg-purple-700"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isLoading || !selectedPlan}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
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
                Processing...
              </>
            ) : selectedPlan === "free" ? (
              "Continue with Free Plan"
            ) : (
              "Subscribe Now"
            )}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            You can cancel your subscription at any time. No hidden fees.
          </p>
        </div>
      </main>
    </div>
  );
}

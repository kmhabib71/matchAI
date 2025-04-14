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
  currency: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bKashNumber, setBKashNumber] = useState("01XXXXXXXXX");

  // Define plans
  const plansList: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      currency: "BDT",
      description: "Basic features for casual users",
      features: [
        { included: true, text: "3 matches per month" },
        { included: true, text: "Send proposals to 3 users" },
        { included: true, text: "View contact details of 3 users" },
        { included: true, text: "Chat with 3 users" },
        { included: false, text: "Advanced compatibility scoring" },
      ],
    },
    {
      id: "premium_basic",
      name: "Premium Basic",
      price: 499,
      currency: "BDT",
      description: "All features for serious daters",
      features: [
        { included: true, text: "10 matches per month" },
        { included: true, text: "Send proposals to 10 users" },
        { included: true, text: "View contact details of 10 users" },
        { included: true, text: "Chat with 10 users" },
        { included: true, text: "Advanced compatibility scoring" },
      ],
      popular: true,
    },
    {
      id: "premium_plus",
      name: "Premium Plus",
      price: 999,
      currency: "BDT",
      description: "Premium experience with maximum matches",
      features: [
        { included: true, text: "50 matches per month" },
        { included: true, text: "Send proposals to 50 users" },
        { included: true, text: "View contact details of 50 users" },
        { included: true, text: "Chat with 50 users" },
        { included: true, text: "Advanced compatibility scoring" },
        { included: true, text: "Priority customer support" },
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

      setUserSubscription(data.subscription);
      setPlans(data.plans || {});

      // If we have a subscription, select that plan by default
      if (data.subscription && data.subscription.planId) {
        setSelectedPlan(data.subscription.planId);
      }

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);

    // If a paid plan is selected, show the payment modal directly
    if (planId !== "free") {
      setShowPaymentModal(true);
    }
  };

  const handleSubscribe = async () => {
    if (selectedPlan === "free") {
      // For free plan, submit right away
      submitSubscription();
    } else {
      // For paid plans, show payment modal
      setShowPaymentModal(true);
    }
  };

  const submitSubscription = async () => {
    // If we're already processing a submission or displayed success, don't submit again
    if (isSubmitting || paymentSuccess) return;

    // Check if we're in demo mode
    if (error && error.includes("demo data")) {
      setError(
        "You cannot subscribe in demo mode. Please sign in with a real account."
      );
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);
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

      const requestBody: Record<string, any> = {
        planId: selectedPlan,
      };

      // Include mobile number for paid plans
      if (selectedPlan !== "free") {
        if (!mobileNumber) {
          throw new Error("Please enter your mobile number");
        }
        requestBody.mobileNumber = mobileNumber;
      }

      const response = await fetch("/api/subscription", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process subscription");
      }

      // If payment is pending, show success modal
      if (data.pendingPayment) {
        setPaymentSuccess(true);
        setBKashNumber(data.bKashNumber || "01XXXXXXXXX");
      } else {
        // If it's a free plan, redirect to dashboard
        router.push("/matches");
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while processing your subscription"
      );
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    // Reset form
    setMobileNumber("");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSubscription();
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
      {/* <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Subscription Plans
          </h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/matches"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Matches
            </Link>
            <Link
              href="/profile"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Profile
            </Link>
          </div>
        </div>
      </header> */}

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
                {userSubscription.currentPeriodEnd && (
                  <p className="text-sm leading-5 text-green-700 mt-1">
                    Your subscription will renew on{" "}
                    {new Date(
                      userSubscription.currentPeriodEnd
                    ).toLocaleDateString()}
                    .
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {userSubscription && userSubscription.status === "pending" && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm leading-5 font-medium text-yellow-800">
                  Your payment for the {userSubscription.planId} plan is
                  pending.
                </p>
                <p className="text-sm leading-5 text-yellow-700 mt-1">
                  Your account will be upgraded within 15 minutes after payment
                  confirmation.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Choose Your Subscription Plan
          </h2>

          <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
            {plansList.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
                  selectedPlan === plan.id
                    ? "border-purple-500 transform scale-105"
                    : "border-transparent hover:border-purple-200"
                } ${plan.popular ? "ring-2 ring-purple-500" : ""}`}
              >
                {plan.popular && (
                  <div className="bg-purple-500 text-white text-xs font-semibold text-center py-1">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.description}
                  </p>

                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price === 0
                        ? "Free"
                        : `${plan.price} ${plan.currency}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="ml-1 text-gray-500 text-sm">/month</span>
                    )}
                  </div>

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
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-5 w-5 text-red-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
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

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`mt-8 w-full px-4 py-2 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      selectedPlan === plan.id
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-purple-500 text-white hover:bg-purple-600"
                    }`}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* 
          <div className="mt-8 text-center">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              ) : (
                `Confirm ${
                  plansList.find((p) => p.id === selectedPlan)?.name || "Plan"
                } Selection`
              )}
            </button>
          </div> */}
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={closePaymentModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Complete Payment
            </h2>

            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Instructions:</span> Please send{" "}
                <span className="font-bold">
                  {plansList.find((p) => p.id === selectedPlan)?.price} BDT
                </span>{" "}
                to the bKash number below:
              </p>
              <p className="mt-2 text-purple-600 font-bold text-lg text-center">
                01XXXXXXXXX
              </p>
              <p className="mt-2 text-sm text-gray-600">
                After sending payment, enter your mobile number below so we can
                verify your payment.
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="mobileNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Mobile Number
                </label>
                <input
                  type="text"
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Payment Submitted
            </h2>

            <p className="text-gray-600 mb-6">
              Your account will be upgraded within 15 minutes. Thank you for
              your subscription!
            </p>

            <button
              onClick={() => {
                router.push("/matches");
              }}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Go to Matches
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

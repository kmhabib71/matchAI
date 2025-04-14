"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/Layout";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Subscription {
  _id: string;
  userId: string;
  planId: string;
  status: string;
  amount?: number;
  currency?: string;
  mobileNumber?: string;
  paymentMethod?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  user?: User;
}

export default function AdminSubscriptions() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subscriptions");

      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching subscriptions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedSubscription) return;

    try {
      const response = await fetch(`/api/admin/subscriptions/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId: selectedSubscription._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve subscription");
      }

      // Refresh the subscriptions list
      await fetchSubscriptions();
      setShowApproveModal(false);
      setSelectedSubscription(null);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while approving the subscription"
      );
      console.error(err);
    }
  };

  const handleCancel = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedSubscription) return;

    try {
      const response = await fetch(`/api/admin/subscriptions/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId: selectedSubscription._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      // Refresh the subscriptions list
      await fetchSubscriptions();
      setShowCancelModal(false);
      setSelectedSubscription(null);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while cancelling the subscription"
      );
      console.error(err);
    }
  };

  const closeModal = () => {
    setShowApproveModal(false);
    setSelectedSubscription(null);
  };

  // Function to get a readable plan name
  const getPlanName = (planId: string) => {
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

  // Function to format date
  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Subscription Management
          </h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Plan
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Mobile Number
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Period
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No subscriptions found
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((subscription) => (
                        <tr key={subscription._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {subscription.user?.name || "Unknown User"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {subscription.user?.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {getPlanName(subscription.planId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                subscription.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : subscription.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : subscription.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {subscription.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subscription.mobileNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subscription.amount
                              ? `${subscription.amount} ${
                                  subscription.currency || "BDT"
                                }`
                              : "Free"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {formatDate(subscription.currentPeriodStart)}
                            </div>
                            <div>to</div>
                            <div>
                              {formatDate(subscription.currentPeriodEnd)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {subscription.status === "pending" && (
                              <button
                                onClick={() => handleApprove(subscription)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Approve
                              </button>
                            )}
                            {subscription.status === "active" && (
                              <button
                                onClick={() => handleCancel(subscription)}
                                className="text-red-600 hover:text-red-900 mr-4"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() =>
                                router.push(
                                  `/admin/users/${subscription.userId}`
                                )
                              }
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View User
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApproveModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Approve Subscription
            </h3>
            <p className="mb-4">
              Are you sure you want to approve the{" "}
              {getPlanName(selectedSubscription.planId)} subscription for{" "}
              <span className="font-medium">
                {selectedSubscription.user?.name || "this user"}
              </span>
              ?
            </p>

            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">User:</div>
                <div>{selectedSubscription.user?.name || "Unknown"}</div>

                <div className="text-gray-600">Plan:</div>
                <div>{getPlanName(selectedSubscription.planId)}</div>

                <div className="text-gray-600">Mobile:</div>
                <div>{selectedSubscription.mobileNumber || "N/A"}</div>

                <div className="text-gray-600">Amount:</div>
                <div>
                  {selectedSubscription.amount
                    ? `${selectedSubscription.amount} ${
                        selectedSubscription.currency || "BDT"
                      }`
                    : "Free"}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApprove}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cancel Subscription
            </h3>
            <p className="mb-4">
              Are you sure you want to cancel the{" "}
              {getPlanName(selectedSubscription.planId)} subscription for{" "}
              <span className="font-medium">
                {selectedSubscription.user?.name || "this user"}
              </span>
              ?
            </p>

            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">User:</div>
                <div>{selectedSubscription.user?.name || "Unknown"}</div>

                <div className="text-gray-600">Plan:</div>
                <div>{getPlanName(selectedSubscription.planId)}</div>

                <div className="text-gray-600">Mobile:</div>
                <div>{selectedSubscription.mobileNumber || "N/A"}</div>

                <div className="text-gray-600">Amount:</div>
                <div>
                  {selectedSubscription.amount
                    ? `${selectedSubscription.amount} ${
                        selectedSubscription.currency || "BDT"
                      }`
                    : "Free"}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedSubscription(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

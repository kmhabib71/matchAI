"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  VerificationMethod,
  VerificationStatus,
} from "@/lib/verification/profileVerification";

interface VerificationRecord {
  method: VerificationMethod;
  status: VerificationStatus;
  verifiedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export default function VerifyProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [verificationScore, setVerificationScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [activeMethod, setActiveMethod] = useState<VerificationMethod | null>(
    null
  );
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("linkedin");
  const [socialProfileUrl, setSocialProfileUrl] = useState("");
  const [documentType, setDocumentType] = useState("passport");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  // Fetch verification status
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile/verify");
      return;
    }

    fetchVerificationStatus();
  }, [status, router]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/verification");

      if (!response.ok) {
        throw new Error("Failed to fetch verification status");
      }

      const data = await response.json();
      setVerifications(data.verifications || []);
      setVerificationScore(data.verificationScore || 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle verification method selection
  const handleMethodSelect = (method: VerificationMethod) => {
    setActiveMethod(method);
    setFormError("");
    setSuccess("");
    setShowVerifyForm(false);

    // Reset form values
    setEmailValue("");
    setPhoneValue("");
    setVerificationCode("");
    setSocialPlatform("linkedin");
    setSocialProfileUrl("");
    setDocumentType("passport");
    setDocumentFile(null);
    setPhotoFile(null);
  };

  // Handle verification request submission
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeMethod) return;

    try {
      setSubmitting(true);
      setFormError("");

      let value: string | { platform: string; profileUrl: string } = "";

      switch (activeMethod) {
        case VerificationMethod.EMAIL:
          value = emailValue;
          break;
        case VerificationMethod.PHONE:
          value = phoneValue;
          break;
        case VerificationMethod.SOCIAL:
          value = { platform: socialPlatform, profileUrl: socialProfileUrl };
          break;
        case VerificationMethod.ID:
          // In a real app, you would upload the file to a storage service
          // and then pass the URL to the API
          value = "https://example.com/documents/sample-id.jpg";
          break;
        case VerificationMethod.PHOTO:
          // In a real app, you would upload the file to a storage service
          // and then pass the URL to the API
          value = "https://example.com/photos/sample-photo.jpg";
          break;
      }

      const response = await fetch("/api/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: activeMethod,
          value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit verification request");
      }

      setSuccess(
        `Verification request submitted successfully. ${
          activeMethod === VerificationMethod.EMAIL ||
          activeMethod === VerificationMethod.PHONE
            ? "Please check your email/phone for the verification code."
            : "Our team will review your submission."
        }`
      );

      if (
        activeMethod === VerificationMethod.EMAIL ||
        activeMethod === VerificationMethod.PHONE
      ) {
        setShowVerifyForm(true);
      } else {
        // Refresh verification status
        await fetchVerificationStatus();
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeMethod || !verificationCode) return;

    try {
      setSubmitting(true);
      setFormError("");

      const response = await fetch("/api/verification", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: activeMethod,
          token: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      setSuccess("Verification successful!");
      setShowVerifyForm(false);
      setVerificationScore(data.verificationScore || 0);

      // Refresh verification status
      await fetchVerificationStatus();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Get verification badge
  const getVerificationBadge = (score: number) => {
    if (score >= 90) return { name: "Platinum", color: "bg-gray-300" };
    if (score >= 75) return { name: "Gold", color: "bg-yellow-400" };
    if (score >= 50) return { name: "Silver", color: "bg-gray-400" };
    if (score >= 25) return { name: "Bronze", color: "bg-amber-600" };
    return { name: "None", color: "bg-gray-200" };
  };

  // Check if a method is verified
  const isMethodVerified = (method: VerificationMethod) => {
    return verifications.some(
      (v) => v.method === method && v.status === VerificationStatus.VERIFIED
    );
  };

  // Check if a method is pending
  const isMethodPending = (method: VerificationMethod) => {
    return verifications.some(
      (v) => v.method === method && v.status === VerificationStatus.PENDING
    );
  };

  // Render verification method card
  const renderMethodCard = (
    method: VerificationMethod,
    title: string,
    description: string,
    icon: React.ReactNode
  ) => {
    const isVerified = isMethodVerified(method);
    const isPending = isMethodPending(method);
    const isActive = activeMethod === method;

    return (
      <div
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isVerified
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : isPending
            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
            : isActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-700"
        }`}
        onClick={() => !isVerified && handleMethodSelect(method)}
      >
        <div className="flex items-start">
          <div className="mr-3 text-gray-500 dark:text-gray-400">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
              {isVerified && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                  Verified
                </span>
              )}
              {isPending && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const badge = getVerificationBadge(verificationScore);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        Verify Your Profile
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold dark:text-white">
            Verification Status
          </h2>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full ${badge.color} flex items-center justify-center mr-2`}
            >
              <span className="text-xs font-bold">{verificationScore}%</span>
            </div>
            <span className="text-sm font-medium dark:text-white">
              {badge.name} Badge
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${verificationScore}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Complete the verification steps below to increase your verification
          score. A higher score increases your visibility and trustworthiness to
          other users.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {renderMethodCard(
            VerificationMethod.EMAIL,
            "Email Verification",
            "Verify your email address to confirm your identity.",
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          )}
          {renderMethodCard(
            VerificationMethod.PHONE,
            "Phone Verification",
            "Verify your phone number for additional security.",
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          )}
          {renderMethodCard(
            VerificationMethod.SOCIAL,
            "Social Media Verification",
            "Link your social media profiles to verify your identity.",
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          )}
          {renderMethodCard(
            VerificationMethod.ID,
            "ID Verification",
            "Upload a government-issued ID to verify your identity.",
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
          )}
          {renderMethodCard(
            VerificationMethod.PHOTO,
            "Photo Verification",
            "Take a selfie to verify your profile photo matches you.",
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {activeMethod && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            {activeMethod === VerificationMethod.EMAIL
              ? "Email Verification"
              : activeMethod === VerificationMethod.PHONE
              ? "Phone Verification"
              : activeMethod === VerificationMethod.SOCIAL
              ? "Social Media Verification"
              : activeMethod === VerificationMethod.ID
              ? "ID Verification"
              : "Photo Verification"}
          </h2>

          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {showVerifyForm ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Verifying..." : "Verify Code"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              {activeMethod === VerificationMethod.EMAIL && (
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    required
                  />
                </div>
              )}

              {activeMethod === VerificationMethod.PHONE && (
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              )}

              {activeMethod === VerificationMethod.SOCIAL && (
                <>
                  <div>
                    <label
                      htmlFor="socialPlatform"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Social Media Platform
                    </label>
                    <select
                      id="socialPlatform"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={socialPlatform}
                      onChange={(e) => setSocialPlatform(e.target.value)}
                      required
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="socialProfileUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Profile URL
                    </label>
                    <input
                      type="url"
                      id="socialProfileUrl"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={socialProfileUrl}
                      onChange={(e) => setSocialProfileUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/in/yourprofile"
                      required
                    />
                  </div>
                </>
              )}

              {activeMethod === VerificationMethod.ID && (
                <>
                  <div>
                    <label
                      htmlFor="documentType"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      ID Type
                    </label>
                    <select
                      id="documentType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      required
                    >
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="national_id">National ID</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="documentFile"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Upload ID Document
                    </label>
                    <input
                      type="file"
                      id="documentFile"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDocumentFile(e.target.files[0]);
                        }
                      }}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Please upload a clear image of your ID. Make sure all
                      information is visible.
                    </p>
                  </div>
                </>
              )}

              {activeMethod === VerificationMethod.PHOTO && (
                <div>
                  <label
                    htmlFor="photoFile"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Upload Selfie
                  </label>
                  <input
                    type="file"
                    id="photoFile"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPhotoFile(e.target.files[0]);
                      }
                    }}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Please upload a clear selfie of yourself. This will be
                    compared to your profile photo.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setActiveMethod(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

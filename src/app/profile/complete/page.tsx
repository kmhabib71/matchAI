"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define validation schema for profile completion
const profileCompletionSchema = z.object({
  age: z.number().min(18, "You must be at least 18 years old"),
  gender: z.string().min(1, "Gender is required"),
  orientation: z.string().min(1, "Orientation is required"),
  location: z.string().min(1, "Location is required"),
  relationshipGoals: z.enum(["Casual", "Serious", "Marriage"]),
});

type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;

export default function ProfileCompletePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isNewUser = searchParams.get("newUser") === "true";
  const provider = searchParams.get("provider") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      age: 18,
      gender: "",
      orientation: "",
      location: "",
      relationshipGoals: "Casual",
    },
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // If this is not a new user and their profile is already complete, redirect to dashboard
    if (!isNewUser && status === "authenticated") {
      router.push("/dashboard");
    }

    // Log the OAuth provider being used for registration
    if (provider) {
      console.log(`Completing profile after ${provider} sign-up`);
    }
  }, [status, router, isNewUser, provider]);

  const onSubmit: SubmitHandler<ProfileCompletionFormData> = async (data) => {
    setIsLoading(true);
    setError("");

    console.log("Submitting profile completion data:", data);

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          profileCompleted: true,
          oauthProvider: provider || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      console.log("Profile update successful:", result);

      // Redirect to dashboard after successful profile completion
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "An error occurred during profile update");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          {provider && (
            <p className="mt-2 text-center text-sm text-blue-600">
              Thanks for signing up with{" "}
              {provider.charAt(0).toUpperCase() + provider.slice(1)}!
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Please provide the following information to complete your profile
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700"
              >
                Age
              </label>
              <input
                id="age"
                type="number"
                min="18"
                {...register("age", { valueAsNumber: true })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.age.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Gender
              </label>
              <select
                id="gender"
                {...register("gender")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="orientation"
                className="block text-sm font-medium text-gray-700"
              >
                Sexual Orientation
              </label>
              <select
                id="orientation"
                {...register("orientation")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              >
                <option value="">Select orientation</option>
                <option value="Straight">Straight</option>
                <option value="Gay">Gay</option>
                <option value="Lesbian">Lesbian</option>
                <option value="Bisexual">Bisexual</option>
                <option value="Pansexual">Pansexual</option>
                <option value="Asexual">Asexual</option>
                <option value="Other">Other</option>
              </select>
              {errors.orientation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.orientation.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Location (City, Country)
              </label>
              <input
                id="location"
                type="text"
                {...register("location")}
                placeholder="New York, USA"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.location.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="relationshipGoals"
                className="block text-sm font-medium text-gray-700"
              >
                Relationship Goals
              </label>
              <select
                id="relationshipGoals"
                {...register("relationshipGoals")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
              >
                <option value="Casual">Casual dating</option>
                <option value="Serious">Serious relationship</option>
                <option value="Marriage">Marriage oriented</option>
              </select>
              {errors.relationshipGoals && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.relationshipGoals.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

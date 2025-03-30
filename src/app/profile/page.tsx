"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import PhotoUploader from "@/components/PhotoUploader";
import { Button } from "@/components/ui/button";
import { IUser } from "@/models/clientUser";
import PersonalityQuiz from "@/components/PersonalityQuiz";

// Define validation schema for profile
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(18, "You must be at least 18 years old"),
  gender: z.string().min(1, "Gender is required"),
  orientation: z.string().min(1, "Orientation is required"),
  location: z.string().min(1, "Location is required"),
  relationshipGoals: z.enum(["Casual", "Serious", "Marriage"]),
  personalityType: z.string().optional(),
  preferences: z.object({
    minAge: z.number().min(18, "Minimum age must be at least 18"),
    maxAge: z.number().min(18, "Maximum age must be at least 18"),
    distance: z.number().min(1, "Distance must be at least 1 km"),
    lifestyle: z.object({
      smoking: z.enum(["Yes", "No"]),
      drinking: z.enum(["Yes", "No"]),
      diet: z.string(),
      religion: z.string(),
    }),
    dealBreakers: z.array(z.string()),
  }),
  profileImage: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [dealBreaker, setDealBreaker] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 18,
      gender: "",
      orientation: "",
      location: "",
      relationshipGoals: "Casual",
      personalityType: "",
      preferences: {
        minAge: 18,
        maxAge: 100,
        distance: 50,
        lifestyle: {
          smoking: "No",
          drinking: "No",
          diet: "Any",
          religion: "Any",
        },
        dealBreakers: [],
      },
      profileImage: "",
    },
  });

  // Custom register function that adds disabled attribute in demo mode
  const registerWithDemo = (name: any, options?: any) => {
    const baseRegister = register(name, options);
    return {
      ...baseRegister,
      disabled: isDemo,
    };
  };

  const dealBreakers = watch("preferences.dealBreakers");

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

    // Fetch user profile
    if (status === "authenticated" || localStorage.getItem("authToken")) {
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError("");
    setIsDemo(false);

    try {
      // Add authorization header if using direct login
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/user/profile", { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile");
      }

      // Set form values
      setValue("name", data.name);
      setValue("age", data.age);
      setValue("gender", data.gender);
      setValue("orientation", data.orientation);

      // Handle location which might be an object or string
      if (typeof data.location === "object" && data.location !== null) {
        // If location is an object, format it as a string
        const locationObj = data.location;
        const locationStr =
          locationObj.city && locationObj.country
            ? `${locationObj.city}, ${locationObj.country}`
            : locationObj.city || locationObj.country || "";
        setValue("location", locationStr);
      } else {
        setValue("location", data.location || "");
      }

      // Handle relationshipGoals which might be an array or string
      if (Array.isArray(data.relationshipGoals)) {
        // If it's an array, take the first value or default to "Casual"
        setValue("relationshipGoals", data.relationshipGoals[0] || "Casual");
      } else {
        setValue("relationshipGoals", data.relationshipGoals || "Casual");
      }

      setValue("personalityType", data.personalityType || "");

      // Handle preferences safely
      if (data.preferences) {
        setValue("preferences.minAge", data.preferences.minAge || 18);
        setValue("preferences.maxAge", data.preferences.maxAge || 100);
        setValue("preferences.distance", data.preferences.distance || 50);
        setValue(
          "preferences.dealBreakers",
          Array.isArray(data.preferences.dealBreakers)
            ? data.preferences.dealBreakers
            : []
        );
      }

      // Try to get cached lifestyle data first
      const cachedLifestyleJson = localStorage.getItem("cachedLifestyle");
      let lifestyleData = data.lifestyle;

      if (cachedLifestyleJson) {
        try {
          const cachedLifestyle = JSON.parse(cachedLifestyleJson);
          lifestyleData = cachedLifestyle;
          console.log("Using cached lifestyle data:", lifestyleData);
          // Clear the cache after using it once
          localStorage.removeItem("cachedLifestyle");
        } catch (e) {
          console.error("Error parsing cached lifestyle:", e);
        }
      }

      // Handle lifestyle preferences from the root lifestyle object
      if (lifestyleData) {
        console.log("Setting lifestyle values from:", lifestyleData);
        setValue(
          "preferences.lifestyle.smoking",
          lifestyleData.smoking || "No"
        );
        setValue(
          "preferences.lifestyle.drinking",
          lifestyleData.drinking || "No"
        );
        setValue("preferences.lifestyle.diet", lifestyleData.diet || "Any");
        setValue(
          "preferences.lifestyle.religion",
          lifestyleData.religion || "Any"
        );
      }

      setValue("profileImage", data.profileImage || "");

      if (data.profileImage) {
        setImagePreview(data.profileImage);
      }

      // Set additional photos
      if (data.additionalPhotos && Array.isArray(data.additionalPhotos)) {
        setAdditionalPhotos(data.additionalPhotos);
      }

      // If this is demo data, show a message and set the demo flag
      if (data.demo) {
        setIsDemo(true);
        setError(
          "You're viewing demo data. Please sign in to edit your real profile."
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching your profile");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    // Check if we're in demo mode
    if (isDemo) {
      setError(
        "You cannot update a demo profile. Please sign in with a real account."
      );
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Add authorization header if using direct login
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Format the data for submission
      const formattedData = {
        ...data,
        // Location is sent as a string, the server will handle the conversion
        location: data.location,
        // Ensure relationshipGoals is properly formatted
        relationshipGoals: Array.isArray(data.relationshipGoals)
          ? data.relationshipGoals[0]
          : data.relationshipGoals,
        // Move lifestyle preferences to the root level
        lifestyle: {
          smoking: data.preferences.lifestyle.smoking,
          drinking: data.preferences.lifestyle.drinking,
          diet: data.preferences.lifestyle.diet,
          religion: data.preferences.lifestyle.religion,
        },
        // Keep other preferences without the lifestyle part
        preferences: {
          minAge: data.preferences.minAge,
          maxAge: data.preferences.maxAge,
          distance: data.preferences.distance,
          dealBreakers: data.preferences.dealBreakers,
        },
      };

      console.log(
        "Sending data to API:",
        JSON.stringify(formattedData, null, 2)
      );

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully");

      // Force refresh the form
      if (result.user) {
        // Update lifestyle preferences in the form
        if (result.user.lifestyle) {
          console.log(
            "Updating form with lifestyle from API:",
            result.user.lifestyle
          );
          setValue(
            "preferences.lifestyle.smoking",
            result.user.lifestyle.smoking
          );
          setValue(
            "preferences.lifestyle.drinking",
            result.user.lifestyle.drinking
          );
          setValue("preferences.lifestyle.diet", result.user.lifestyle.diet);
          setValue(
            "preferences.lifestyle.religion",
            result.user.lifestyle.religion
          );
        }

        // Store the updated data in localStorage temporarily to ensure it persists
        const cachedLifestyle = JSON.stringify(result.user.lifestyle || {});
        localStorage.setItem("cachedLifestyle", cachedLifestyle);

        // Add a reload mechanism after a short delay to apply all changes
        setTimeout(() => {
          fetchUserProfile();
        }, 1000);
      } else {
        // Otherwise fetch fresh data
        fetchUserProfile();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating your profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle photo upload completion
  const handlePhotoUploaded = (url: string, isProfilePhoto: boolean) => {
    if (isProfilePhoto) {
      setImagePreview(url);
      setValue("profileImage", url);
    } else {
      setAdditionalPhotos((prev) => [...prev, url]);
    }
  };

  // Handle photo deletion
  const handlePhotoDeleted = (url: string, isProfilePhoto: boolean) => {
    if (isProfilePhoto) {
      setImagePreview("");
      setValue("profileImage", "");
    } else {
      setAdditionalPhotos((prev) => prev.filter((photo) => photo !== url));
    }
  };

  const addDealBreaker = () => {
    // Don't allow adding deal breakers in demo mode
    if (isDemo) {
      setError(
        "You cannot update a demo profile. Please sign in with a real account."
      );
      return;
    }

    if (!dealBreaker.trim()) return;

    const currentDealBreakers = getValues("preferences.dealBreakers") || [];
    setValue("preferences.dealBreakers", [...currentDealBreakers, dealBreaker]);
    setDealBreaker("");
  };

  const removeDealBreaker = (index: number) => {
    // Don't allow removing deal breakers in demo mode
    if (isDemo) {
      setError(
        "You cannot update a demo profile. Please sign in with a real account."
      );
      return;
    }

    const currentDealBreakers = [...getValues("preferences.dealBreakers")];
    currentDealBreakers.splice(index, 1);
    setValue("preferences.dealBreakers", currentDealBreakers);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Photo Upload Section */}
          <div className="md:col-span-1">
            <PhotoUploader
              profileImage={imagePreview}
              additionalPhotos={additionalPhotos}
              onPhotoUploaded={handlePhotoUploaded}
              onPhotoDeleted={handlePhotoDeleted}
              disabled={isDemo || isSaving}
            />
          </div>

          {/* Profile Form Section */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      type="number"
                      {...register("age", { valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.age.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      {...register("gender")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Gender</option>
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
                    <label className="block text-sm font-medium text-gray-700">
                      Sexual Orientation
                    </label>
                    <select
                      {...register("orientation")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Orientation</option>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    {...register("location")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="City, Country"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Relationship Goals
                  </label>
                  <select
                    {...register("relationshipGoals")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select Goal</option>
                    <option value="Casual">Casual</option>
                    <option value="Long-term">Long-term</option>
                    <option value="Marriage">Marriage</option>
                    <option value="Friendship">Friendship</option>
                  </select>
                  {errors.relationshipGoals && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.relationshipGoals.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-xl font-semibold">Preferences</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Min Age
                    </label>
                    <input
                      type="number"
                      {...register("preferences.minAge", {
                        valueAsNumber: true,
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="18"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Age
                    </label>
                    <input
                      type="number"
                      {...register("preferences.maxAge", {
                        valueAsNumber: true,
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="18"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Distance (miles)
                    </label>
                    <input
                      type="number"
                      {...register("preferences.distance", {
                        valueAsNumber: true,
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="1"
                      max="500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Lifestyle Preferences</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Smoking
                      </label>
                      <select
                        {...register("preferences.lifestyle.smoking")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Drinking
                      </label>
                      <select
                        {...register("preferences.lifestyle.drinking")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Diet
                      </label>
                      <select
                        {...register("preferences.lifestyle.diet")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="Any">Any</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Pescatarian">Pescatarian</option>
                        <option value="Keto">Keto</option>
                        <option value="Paleo">Paleo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Religion
                      </label>
                      <select
                        {...register("preferences.lifestyle.religion")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="Any">Any</option>
                        <option value="Christianity">Christianity</option>
                        <option value="Islam">Islam</option>
                        <option value="Hinduism">Hinduism</option>
                        <option value="Buddhism">Buddhism</option>
                        <option value="Judaism">Judaism</option>
                        <option value="Atheism">Atheism</option>
                        <option value="Agnosticism">Agnosticism</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isDemo || isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personality Quiz Button */}
      <div className="mt-8 flex justify-center">
        <Button
          onClick={() => setShowPersonalityQuiz(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Take Personality Quiz
        </Button>
      </div>

      {/* Personality Quiz Component */}
      {showPersonalityQuiz && (
        <PersonalityQuiz
          isOpen={showPersonalityQuiz}
          onClose={() => setShowPersonalityQuiz(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/models/clientUser";
import { use } from "react";

interface UserEditData {
  _id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  orientation: string;
  bio?: string;
  profileImage?: string;
  personalityType?: string;
  interests?: string[];
  roles: string[];
  location?: {
    city?: string;
    country?: string;
  };
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const userId = use(Promise.resolve(params.id));
  const [user, setUser] = useState<UserEditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<UserEditData>>({});
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch user");
        }

        const userData = await response.json();
        setUser(userData);
        setFormState(userData);
      } catch (error: any) {
        console.error("Error fetching user:", error);
        setError(error.message || "Failed to fetch user");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value,
      },
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    const value = UserRole.ADMIN;

    let updatedRoles = [...(formState.roles || [])];

    if (checked && !updatedRoles.includes(value)) {
      updatedRoles.push(value);
    } else if (!checked) {
      updatedRoles = updatedRoles.filter((role) => role !== value);
    }

    setFormState((prev) => ({
      ...prev,
      roles: updatedRoles,
    }));
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;

    setFormState((prev) => ({
      ...prev,
      interests: [...(prev.interests || []), newInterest.trim()],
    }));

    setNewInterest("");
  };

  const handleRemoveInterest = (interest: string) => {
    setFormState((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter((i) => i !== interest),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      const result = await response.json();
      setSuccessMessage("User updated successfully");

      // Update local user state with new data
      setUser(result.user);
    } catch (error: any) {
      console.error("Error updating user:", error);
      setError(error.message || "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    router.push("/admin/users");
  };

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={navigateBack}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit User
        </h1>
        <button
          onClick={navigateBack}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Back to Users
        </button>
      </div>

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="name"
            >
              Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              name="name"
              value={formState.name || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              name="email"
              value={formState.email || ""}
              onChange={handleChange}
              required
              disabled
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="age"
            >
              Age
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="age"
              type="number"
              name="age"
              min="18"
              max="120"
              value={formState.age ?? ""}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="gender"
            >
              Gender
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="gender"
              name="gender"
              value={formState.gender || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="orientation"
            >
              Orientation
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="orientation"
              name="orientation"
              value={formState.orientation || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Orientation</option>
              <option value="straight">Straight</option>
              <option value="gay">Gay</option>
              <option value="lesbian">Lesbian</option>
              <option value="bisexual">Bisexual</option>
              <option value="pansexual">Pansexual</option>
              <option value="asexual">Asexual</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="city"
            >
              City
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="city"
              type="text"
              name="city"
              value={formState.location?.city || ""}
              onChange={handleLocationChange}
            />
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="country"
            >
              Country
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="country"
              type="text"
              name="country"
              value={formState.location?.country || ""}
              onChange={handleLocationChange}
            />
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="profileImage"
            >
              Profile Image URL
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="profileImage"
              type="text"
              name="profileImage"
              value={formState.profileImage || ""}
              onChange={handleChange}
            />
            {formState.profileImage && (
              <div className="mt-2 flex items-center">
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  <img
                    src={formState.profileImage}
                    alt="Profile Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Replace broken image with default user icon
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  Current image preview
                </span>
              </div>
            )}
          </div>

          <div>
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="personalityType"
            >
              Personality Type
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="personalityType"
              type="text"
              name="personalityType"
              value={formState.personalityType || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mt-6">
          <label
            className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
            htmlFor="bio"
          >
            Bio
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="bio"
            name="bio"
            rows={4}
            value={formState.bio || ""}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="mt-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Interests
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(formState.interests || []).map((interest, index) => (
              <div
                key={index}
                className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full flex items-center"
              >
                <span className="text-blue-800 dark:text-blue-200 text-sm">
                  {interest}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 dark:text-white bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Add new interest"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddInterest())
              }
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600"
              checked={(formState.roles || []).includes(UserRole.ADMIN)}
              onChange={handleRoleChange}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">
              Admin User
            </span>
          </label>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={navigateBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * User Profile API Utilities
 * Functions for fetching and managing user profile data
 */

/**
 * Fetch the current user's profile
 * @returns Promise with the user profile data
 */
export async function getCurrentUserProfile() {
  try {
    const response = await fetch("/api/users/profile");

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch user profile");
    }

    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error("Error fetching current user profile:", error);
    throw error;
  }
}

/**
 * Fetch a user profile by MongoDB ID
 * @param userId - MongoDB ObjectId of the user as a string
 * @returns Promise with the user profile data
 */
export async function getUserProfileById(userId: string) {
  try {
    if (!userId || userId.trim() === "") {
      throw new Error("User ID is required");
    }

    const response = await fetch(`/api/users/byId/${userId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch user profile");
    }

    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error(`Error fetching user profile by ID ${userId}:`, error);
    throw error;
  }
}

/**
 * Update the current user's profile
 * @param profileData - Object containing the profile fields to update
 * @returns Promise with the updated user profile
 */
export async function updateUserProfile(profileData: Record<string, any>) {
  try {
    // First get the current user's ID
    const currentUser = await getCurrentUserProfile();

    if (!currentUser || !currentUser._id) {
      throw new Error("Failed to determine current user ID");
    }

    const response = await fetch(`/api/users/${currentUser._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update user profile");
    }

    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

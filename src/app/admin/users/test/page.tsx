"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/models/clientUser";

interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  orientation: string;
  location: {
    type: string;
    coordinates: number[];
    city?: string;
    country?: string;
  };
  bio?: string;
  profileImage?: string;
  personalityType?: string;
  interests?: string[];
  personalityQuiz?: {
    completed: boolean;
    answers: Record<string, string>;
    completedAt?: string;
    personalityType?: string;
    traits?: string[];
  };
}

const personalityQuestions = [
  {
    id: 1,
    question: "How would you describe your personality?",
    options: ["Introvert", "Extrovert", "Ambivert"],
    description: "Helps define social compatibility and conversation flow.",
  },
  {
    id: 2,
    question: "Are you more emotional or logical in relationships?",
    options: ["Emotional", "Logical", "Balanced"],
    description:
      "Core trait for emotional connection and decision-making style.",
  },
  {
    id: 3,
    question: "How do you handle conflicts in a relationship?",
    options: ["Talk openly", "Need space", "Stay silent", "Avoid it"],
    description: "Reveals communication and conflict-resolution style.",
  },
  {
    id: 4,
    question: "What is your love language?",
    options: ["Words", "Quality Time", "Acts of Service", "Touch", "Gifts"],
    description: "Key to understanding how you give/receive love.",
  },
  {
    id: 5,
    question: "What type of relationship are you looking for?",
    options: ["Serious", "Casual", "Friendship", "Marriage"],
    description: "Filters match intent clearly.",
  },
  {
    id: 6,
    question: "How soon do you want to get married?",
    options: ["Within 1 year", "2–5 years", "No rush", "Not thinking about it"],
    description: "Important for aligning long-term goals.",
  },
  {
    id: 7,
    question: "Do you want kids in the future?",
    options: ["Yes", "Maybe", "No"],
    description: "A major compatibility factor.",
  },
  {
    id: 8,
    question: "What are your dealbreakers in a relationship?",
    options: [
      "Cheating",
      "Lying",
      "No ambition",
      "No connection",
      "Different values",
    ],
    description: "Helps the system avoid bad matches.",
  },
  {
    id: 9,
    question: "How important is religion or spirituality in your life?",
    options: ["Very", "Somewhat", "Not at all"],
    description: "Aligns personal values and worldviews.",
  },
  {
    id: 10,
    question: "How do you view gender roles in a relationship?",
    options: ["Traditional", "Equal partnership", "Flexible"],
    description: "Important for cultural & value alignment.",
  },
  {
    id: 11,
    question: "What makes you feel most valued in a relationship?",
    options: ["Loyalty", "Support", "Passion", "Shared goals", "Understanding"],
    description: "Reveals emotional needs.",
  },
  {
    id: 12,
    question: "What is your daily lifestyle like?",
    options: ["Early riser", "Night owl", "Flexible"],
    description: "Helps align habits and routines.",
  },
  {
    id: 13,
    question: "Do you prefer a healthy lifestyle?",
    options: ["Yes, very", "I try", "Not really"],
    description: "Useful for aligning health goals.",
  },
  {
    id: 14,
    question: "How important is physical fitness to you?",
    options: ["Very", "Somewhat", "Not important"],
    description: "Affects lifestyle and long-term habits.",
  },
  {
    id: 15,
    question: "Do you drink alcohol or smoke?",
    options: ["Yes", "Occasionally", "Never"],
    description: "Lifestyle habits that affect compatibility.",
  },
  {
    id: 16,
    question: "What do you do for a living?",
    options: ["Student", "Freelancer", "Business Owner", "Employee", "Other"],
    description: "Career status for ambition alignment.",
  },
  {
    id: 17,
    question: "How important is career success to you?",
    options: ["Very", "Somewhat", "Not a priority"],
    description: "Understands ambition level.",
  },
  {
    id: 18,
    question: "Would you relocate for love?",
    options: ["Yes", "Maybe", "No"],
    description: "Helps with geographic matching.",
  },
  {
    id: 19,
    question: "What kind of social time do you prefer?",
    options: ["Big groups", "One-on-one talks", "Both"],
    description: "Social energy and compatibility.",
  },
  {
    id: 20,
    question: "What do you value most in a partner?",
    options: [
      "Honesty",
      "Humor",
      "Intelligence",
      "Loyalty",
      "Ambition",
      "Family-focused",
    ],
    description: "Direct match with partner expectations.",
  },
];

// Helper function to get a profile image URL
const getProfileImage = (seed: number): string => {
  // Multiple options for profile images to avoid CORS or availability issues
  const imageOptions = [
    // Option 1: Lorem Picsum
    `https://picsum.photos/seed/${seed}/200`,
    // Option 2: Placeholder.com
    `https://via.placeholder.com/200x200/3498db/ffffff?text=${encodeURIComponent(
      `User ${seed}`
    )}`,
    // Option 3: Robohash - generates unique robot avatars
    `https://robohash.org/${seed}?size=200x200&set=set4`,
    // Option 4: UI Faces API (if available - requires API key)
    // 'https://uifaces.co/api?limit=1&random',
    // Option 5: Local fallback
    "/avatars/default-avatar.svg",
  ];

  // Use a random option from the list
  return imageOptions[Math.floor(Math.random() * 3)]; // Using only the first 3 options
};

const sampleUsers: User[] = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    password: "Password123!",
    age: 28,
    gender: "Female",
    orientation: "Straight",
    location: {
      type: "Point",
      coordinates: [-73.935242, 40.73061],
      city: "New York",
      country: "USA",
    },
    bio: "Creative soul who loves exploring new places. I enjoy photography, hiking and trying new cuisines.",
    profileImage: getProfileImage(101),
    personalityType: "INFP",
    interests: ["Photography", "Hiking", "Cooking", "Travel"],
    personalityQuiz: {
      completed: true,
      answers: {
        "1": "Introvert",
        "2": "Emotional",
        "3": "Talk openly",
        "4": "Quality Time",
        "5": "Serious",
        "6": "2–5 years",
        "7": "Yes",
        "8": "Lying",
        "9": "Somewhat",
        "10": "Equal partnership",
        "11": "Understanding",
        "12": "Flexible",
        "13": "I try",
        "14": "Somewhat",
        "15": "Occasionally",
        "16": "Freelancer",
        "17": "Somewhat",
        "18": "Maybe",
        "19": "One-on-one talks",
        "20": "Honesty",
      },
      completedAt: new Date().toISOString(),
      personalityType: "INFP",
      traits: ["Creative", "Empathetic", "Idealistic"],
    },
  },
  {
    name: "Michael Chen",
    email: "michael.chen@example.com",
    password: "Password123!",
    age: 31,
    gender: "Male",
    orientation: "Straight",
    location: {
      type: "Point",
      coordinates: [-122.419416, 37.774929],
      city: "San Francisco",
      country: "USA",
    },
    bio: "Tech enthusiast and outdoor adventurer. I split my time between coding and rock climbing.",
    profileImage: getProfileImage(102),
    personalityType: "INTJ",
    interests: ["Tech", "Rock Climbing", "Reading", "Coffee"],
    personalityQuiz: {
      completed: true,
      answers: {
        "1": "Ambivert",
        "2": "Logical",
        "3": "Talk openly",
        "4": "Acts of Service",
        "5": "Serious",
        "6": "No rush",
        "7": "Maybe",
        "8": "No ambition",
        "9": "Not at all",
        "10": "Equal partnership",
        "11": "Shared goals",
        "12": "Early riser",
        "13": "Yes, very",
        "14": "Very",
        "15": "Occasionally",
        "16": "Business Owner",
        "17": "Very",
        "18": "No",
        "19": "One-on-one talks",
        "20": "Intelligence",
      },
      completedAt: new Date().toISOString(),
      personalityType: "INTJ",
      traits: ["Analytical", "Strategic", "Determined"],
    },
  },
  {
    name: "Jessica Williams",
    email: "jessica.williams@example.com",
    password: "Password123!",
    age: 26,
    gender: "Female",
    orientation: "Bisexual",
    location: {
      type: "Point",
      coordinates: [-0.118092, 51.509865],
      city: "London",
      country: "UK",
    },
    bio: "Book lover, yoga instructor, and aspiring chef. I believe in living mindfully and finding joy in the little things.",
    profileImage: getProfileImage(103),
    personalityType: "ENFJ",
    interests: ["Yoga", "Reading", "Cooking", "Meditation"],
    personalityQuiz: {
      completed: true,
      answers: {
        "1": "Extrovert",
        "2": "Emotional",
        "3": "Talk openly",
        "4": "Words",
        "5": "Serious",
        "6": "Not thinking about it",
        "7": "Yes",
        "8": "Different values",
        "9": "Very",
        "10": "Equal partnership",
        "11": "Support",
        "12": "Early riser",
        "13": "Yes, very",
        "14": "Very",
        "15": "Never",
        "16": "Freelancer",
        "17": "Not a priority",
        "18": "Yes",
        "19": "Both",
        "20": "Loyalty",
      },
      completedAt: new Date().toISOString(),
      personalityType: "ENFJ",
      traits: ["Charismatic", "Empathetic", "Organized"],
    },
  },
  {
    name: "David Kim",
    email: "david.kim@example.com",
    password: "Password123!",
    age: 33,
    gender: "Male",
    orientation: "Straight",
    location: {
      type: "Point",
      coordinates: [-79.383184, 43.653225],
      city: "Toronto",
      country: "Canada",
    },
    bio: "Architect with a passion for sustainable design. I love jazz music, documentaries, and exploring cities on foot.",
    profileImage: getProfileImage(104),
    personalityType: "ISTP",
    interests: ["Architecture", "Jazz", "Documentaries", "Urban Exploration"],
    personalityQuiz: {
      completed: true,
      answers: {
        "1": "Introvert",
        "2": "Logical",
        "3": "Need space",
        "4": "Acts of Service",
        "5": "Serious",
        "6": "No rush",
        "7": "No",
        "8": "No connection",
        "9": "Somewhat",
        "10": "Flexible",
        "11": "Loyalty",
        "12": "Night owl",
        "13": "I try",
        "14": "Somewhat",
        "15": "Yes",
        "16": "Employee",
        "17": "Very",
        "18": "No",
        "19": "One-on-one talks",
        "20": "Honesty",
      },
      completedAt: new Date().toISOString(),
      personalityType: "ISTP",
      traits: ["Practical", "Logical", "Independent"],
    },
  },
  {
    name: "Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    password: "Password123!",
    age: 29,
    gender: "Female",
    orientation: "Straight",
    location: {
      type: "Point",
      coordinates: [-87.629798, 41.878113],
      city: "Chicago",
      country: "USA",
    },
    bio: "Pediatric nurse by day, salsa dancer by night. I have a big heart for children and animals.",
    profileImage: getProfileImage(105),
    personalityType: "ESFJ",
    interests: ["Dancing", "Nursing", "Animals", "Volunteering"],
    personalityQuiz: {
      completed: true,
      answers: {
        "1": "Extrovert",
        "2": "Emotional",
        "3": "Talk openly",
        "4": "Touch",
        "5": "Marriage",
        "6": "Within 1 year",
        "7": "Yes",
        "8": "Lying",
        "9": "Somewhat",
        "10": "Traditional",
        "11": "Support",
        "12": "Early riser",
        "13": "Yes, very",
        "14": "Very",
        "15": "Never",
        "16": "Employee",
        "17": "Somewhat",
        "18": "Yes",
        "19": "Big groups",
        "20": "Family-focused",
      },
      completedAt: new Date().toISOString(),
      personalityType: "ESFJ",
      traits: ["Caring", "Sociable", "Organized"],
    },
  },
];

export default function TestUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [creationStatus, setCreationStatus] = useState<{
    total: number;
    created: number;
    failed: number;
  }>({
    total: 0,
    created: 0,
    failed: 0,
  });

  // Fetch existing test users from the database
  useEffect(() => {
    const fetchTestUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Search for test users by either isTestUser=true or email containing testuser
        const response = await fetch("/api/users?search=testuser");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch test users");
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (error: any) {
        console.error("Error fetching test users:", error);
        setError(error.message || "Failed to fetch test users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestUsers();
  }, []);

  // Create a test user with random data
  const createRandomUser = (id: number): User => {
    const genders = ["Male", "Female", "Non-binary"];
    const orientations = [
      "Straight",
      "Gay",
      "Lesbian",
      "Bisexual",
      "Pansexual",
    ];
    const cities = [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
    ];
    const countries = ["USA"];
    const interests = [
      "Photography",
      "Hiking",
      "Cooking",
      "Travel",
      "Reading",
      "Music",
      "Art",
      "Gaming",
      "Fitness",
      "Movies",
      "Dancing",
      "Technology",
      "Sports",
      "Fashion",
      "Writing",
      "Yoga",
      "Meditation",
      "Gardening",
    ];
    const personalityTypes = [
      "INTJ",
      "INTP",
      "ENTJ",
      "ENTP",
      "INFJ",
      "INFP",
      "ENFJ",
      "ENFP",
      "ISTJ",
      "ISFJ",
      "ESTJ",
      "ESFJ",
      "ISTP",
      "ISFP",
      "ESTP",
      "ESFP",
    ];
    const bios = [
      "I love exploring new places and trying different foods. Always up for an adventure!",
      "Creative soul with a passion for art and music. Looking for someone to share experiences with.",
      "Fitness enthusiast and nature lover. I enjoy hiking, camping, and staying active.",
      "Book lover and coffee addict. I enjoy deep conversations and quiet evenings.",
      "Tech geek who enjoys coding and learning new things. Also a big fan of outdoor activities.",
      "Foodie who loves cooking and trying new restaurants. Always exploring different cuisines.",
      "Music lover who enjoys concerts and playing instruments. Looking for someone to share that passion.",
      "Travel enthusiast who has visited over 20 countries. Always planning the next adventure.",
      "Film buff who enjoys everything from indie films to blockbusters. Let's talk movies!",
      "Sports fan who enjoys both watching and playing. Always up for a game or workout session.",
    ];

    // Generate random values
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const orientation =
      orientations[Math.floor(Math.random() * orientations.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const age = Math.floor(Math.random() * 20) + 20; // 20-40
    const bio = bios[Math.floor(Math.random() * bios.length)];
    const personalityType =
      personalityTypes[Math.floor(Math.random() * personalityTypes.length)];

    // Generate random coordinates based on city
    let lat = 40.7128; // Default to NYC
    let lng = -74.006;

    // Generate a placeholder avatar
    const randomSeed = Math.floor(Math.random() * 1000);
    const avatarUrl = getProfileImage(randomSeed);

    // Create random interests (3-5)
    const numInterests = Math.floor(Math.random() * 3) + 3;
    const userInterests: string[] = [];
    for (let i = 0; i < numInterests; i++) {
      const randomInterest =
        interests[Math.floor(Math.random() * interests.length)];
      if (!userInterests.includes(randomInterest)) {
        userInterests.push(randomInterest);
      }
    }

    // Create random answers to personality questions
    const quizAnswers: Record<string, string> = {};
    personalityQuestions.forEach((q) => {
      const randomOption =
        q.options[Math.floor(Math.random() * q.options.length)];
      quizAnswers[q.id.toString()] = randomOption;
    });

    // Generate random personality traits
    const traits = [
      "Creative",
      "Analytical",
      "Outgoing",
      "Reserved",
      "Ambitious",
      "Adventurous",
      "Practical",
      "Emotional",
      "Logical",
      "Empathetic",
    ];
    const numTraits = Math.floor(Math.random() * 2) + 2; // 2-3 traits
    const userTraits: string[] = [];
    for (let i = 0; i < numTraits; i++) {
      const randomTrait = traits[Math.floor(Math.random() * traits.length)];
      if (!userTraits.includes(randomTrait)) {
        userTraits.push(randomTrait);
      }
    }

    return {
      name: `Test User ${id}`,
      email: `testuser${id}@example.com`,
      password: `TestPassword${id}!`,
      age,
      gender,
      orientation,
      location: {
        type: "Point",
        coordinates: [lng, lat],
        city,
        country,
      },
      bio,
      profileImage: avatarUrl,
      personalityType,
      interests: userInterests,
      personalityQuiz: {
        completed: true,
        answers: quizAnswers,
        completedAt: new Date().toISOString(),
        personalityType,
        traits: userTraits,
      },
    };
  };

  // Create a batch of test users
  const createTestUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Create 10 random test users
      const numUsers = 10;
      const newUsers: User[] = [];

      for (let i = 1; i <= numUsers; i++) {
        const userId = Date.now() + i;
        newUsers.push(createRandomUser(userId));
      }

      setCreationStatus({
        total: numUsers,
        created: 0,
        failed: 0,
      });

      // Send to the test users creation API
      const response = await fetch("/api/users/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: newUsers }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create test users");
      }

      setCreationStatus({
        total: numUsers,
        created: result.usersCreated || 0,
        failed: numUsers - (result.usersCreated || 0),
      });

      setSuccessMessage(
        `Successfully created ${result.usersCreated} test users`
      );

      // Refresh the user list
      const updatedResponse = await fetch("/api/users?search=testuser");
      const updatedData = await updatedResponse.json();
      setUsers(updatedData.users || []);
    } catch (error: any) {
      console.error("Error creating test users:", error);
      setError(error.message || "Failed to create test users");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a test user
  const deleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Delete the user from the database
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      setSuccessMessage("User deleted successfully");

      // Update local state to remove the deleted user
      setUsers(users.filter((user) => user._id !== userId));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setError(error.message || "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Test Users Management
        </h1>
        <button
          onClick={() => router.push("/admin/users")}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Back to All Users
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

      {isLoading && (
        <div
          className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded relative mb-4 flex items-center"
          role="alert"
        >
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mr-3"></div>
          <span className="block sm:inline">Processing your request...</span>
        </div>
      )}

      {creationStatus.created > 0 && (
        <div
          className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <p className="font-bold mb-1">Test User Creation Results:</p>
          <div className="flex flex-col md:flex-row md:gap-6">
            <div className="flex items-center">
              <span className="inline-flex mr-2 items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-blue-800">
                {creationStatus.total}
              </span>
              <span>Total Attempted</span>
            </div>
            <div className="flex items-center">
              <span className="inline-flex mr-2 items-center justify-center w-6 h-6 rounded-full bg-green-200 text-green-800">
                {creationStatus.created}
              </span>
              <span>Successfully Created</span>
            </div>
            {creationStatus.failed > 0 && (
              <div className="flex items-center">
                <span className="inline-flex mr-2 items-center justify-center w-6 h-6 rounded-full bg-red-200 text-red-800">
                  {creationStatus.failed}
                </span>
                <span>Failed</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Create Test Users
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          This will create 10 test users with randomized data and personality
          quiz results.
        </p>
        <button
          onClick={createTestUsers}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create 10 Test Users"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Test Users
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {users.length} test users found in the database
          </p>
        </div>

        {isLoading && users.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            No test users found. Click the button above to create test users.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Personality
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {user.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.profileImage}
                              alt={user.name}
                              onError={(e) => {
                                // Replace broken image with default user icon
                                e.currentTarget.onerror = null;
                                e.currentTarget.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.age
                          ? `${user.age} Years Old`
                          : "Age not specified"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.gender || "Gender not specified"}
                        {user.gender && user.orientation ? ", " : ""}
                        {user.orientation || ""}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.location?.city && user.location?.country
                          ? `${user.location.city}, ${user.location.country}`
                          : "Location not specified"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        Type: {user.personalityType || "Not Set"}
                      </div>
                      {user.personalityQuiz?.completed ? (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Quiz Completed
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          Quiz Not Completed
                        </div>
                      )}
                      {user.interests && user.interests.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {user.interests.slice(0, 3).map((interest, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {interest}
                            </span>
                          ))}
                          {user.interests.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              +{user.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          No interests specified
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => user._id && deleteUser(user._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-3"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          user._id &&
                          router.push(`/admin/users/edit/${user._id}`)
                        }
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 ml-3"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

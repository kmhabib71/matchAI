"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Mock data for users - would be fetched from an API in a real application
const MOCK_USERS = [
  {
    id: "1",
    name: "Sarah",
    age: 28,
    location: { city: "London", country: "UK" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
    bio: "Creative and passionate digital marketer with a love for photography and hiking. Looking for someone kind and adventurous to explore life with.",
    interests: ["Photography", "Hiking", "Travel", "Reading", "Cooking"],
    jobTitle: "Digital Marketing Manager",
    education: "Bachelor's in Marketing, University of London",
    looking_for:
      "A serious relationship with someone who shares similar values and interests",
    compatibility_score: 92,
    compatibility_reasons: [
      "Similar interests in outdoor activities",
      "Complementary communication styles",
      "Shared life goals and values",
      "Matching emotional intelligence levels",
    ],
    last_active: "Online now",
    gallery: [
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?q=80&w=400&auto=format&fit=crop",
    ],
  },
  {
    id: "2",
    name: "James",
    age: 32,
    location: { city: "New York", country: "USA" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop",
    bio: "Software engineer by day, amateur chef by night. I love creating things, whether it's code or cuisine. Looking for someone to share good conversations and meals with.",
    interests: ["Cooking", "Technology", "Running", "Movies", "Jazz Music"],
    jobTitle: "Senior Software Developer",
    education: "Master's in Computer Science, MIT",
    looking_for:
      "Someone who values intellectual curiosity and enjoys good food",
    compatibility_score: 87,
    compatibility_reasons: [
      "Complementary problem-solving approaches",
      "Shared intellectual curiosity",
      "Both enjoy quality time at home and exploring",
      "Similar communication styles",
    ],
    last_active: "Active 20 minutes ago",
    gallery: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop",
    ],
  },
  {
    id: "3",
    name: "Elena",
    age: 26,
    location: { city: "Barcelona", country: "Spain" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?q=80&w=400&auto=format&fit=crop",
    bio: "Aspiring painter and art teacher who loves the Mediterranean lifestyle. I enjoy beach days, wine tastings, and dancing until dawn. Looking for someone with a creative spirit.",
    interests: ["Painting", "Dancing", "Wine Tasting", "Yoga", "Beach Life"],
    jobTitle: "Art Teacher",
    education: "Fine Arts, University of Barcelona",
    looking_for:
      "A passionate and creative person who enjoys the arts and spontaneous adventures",
    compatibility_score: 89,
    compatibility_reasons: [
      "Shared appreciation for arts and creativity",
      "Complementary energy levels",
      "Similar views on work-life balance",
      "Matching social preferences",
    ],
    last_active: "Active 2 hours ago",
    gallery: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534008897995-27a23e859048?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop",
    ],
  },
  {
    id: "4",
    name: "Michael",
    age: 30,
    location: { city: "Toronto", country: "Canada" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    bio: "Environmental scientist who loves the outdoors. I spend my weekends hiking, kayaking, or volunteering for conservation projects. Looking for someone who shares my love for nature.",
    interests: [
      "Hiking",
      "Kayaking",
      "Environmental Conservation",
      "Photography",
      "Dogs",
    ],
    jobTitle: "Environmental Scientist",
    education: "PhD in Environmental Science, University of Toronto",
    looking_for:
      "An eco-conscious partner who enjoys outdoor adventures and quiet evenings under the stars",
    compatibility_score: 95,
    compatibility_reasons: [
      "Shared values on environmental issues",
      "Mutual love for outdoor activities",
      "Complementary communication styles",
      "Similar life goals and ambitions",
    ],
    last_active: "Active 1 day ago",
    gallery: [
      "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop",
    ],
  },
  {
    id: "5",
    name: "Sophia",
    age: 29,
    location: { city: "Sydney", country: "Australia" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?q=80&w=400&auto=format&fit=crop",
    bio: "Marine biologist with a passion for ocean conservation. I love scuba diving, sailing, and beach clean-ups. Looking for someone who shares my passion for protecting our planet.",
    interests: [
      "Scuba Diving",
      "Marine Life",
      "Conservation",
      "Sailing",
      "Surfing",
    ],
    jobTitle: "Marine Biologist",
    education: "Master's in Marine Biology, University of Sydney",
    looking_for:
      "A partner who shares my love for the ocean and dedication to environmental causes",
    compatibility_score: 91,
    compatibility_reasons: [
      "Shared environmental values",
      "Mutual love for the ocean and beach life",
      "Complementary personality types",
      "Similar levels of ambition and drive",
    ],
    last_active: "Online now",
    gallery: [
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516239482977-b550ba7253f2?q=80&w=400&auto=format&fit=crop",
    ],
  },
  // More mock users would be added here...
];

const UserProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    // Simulate API call to fetch user data
    const fetchUserData = () => {
      setLoading(true);
      // Find user with matching ID
      const foundUser = MOCK_USERS.find((u) => u.id === userId);

      if (foundUser) {
        setUser(foundUser);
        setSelectedImage(foundUser.image);
      } else {
        // Handle user not found
        router.push("/users");
      }

      setLoading(false);
    };

    fetchUserData();
  }, [userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-purple-600 rounded-full animate-pulse"></div>
            <div className="h-4 w-4 bg-purple-600 rounded-full animate-pulse delay-150"></div>
            <div className="h-4 w-4 bg-purple-600 rounded-full animate-pulse delay-300"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            Sorry, this user profile doesn't exist or has been removed.
          </p>
          <Link
            href="/users"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium"
          >
            Return to Users
          </Link>
        </div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send a message to the backend
    alert(`Message sent to ${user.name}: "${messageText}"`);
    setMessageText("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/users"
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to All Users
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <div className="absolute inset-0 z-0">
              <Image
                src={selectedImage}
                alt={`${user.name}'s profile`}
                fill
                style={{ objectFit: "cover" }}
                priority
                className="brightness-[0.85]"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white overflow-hidden relative">
                    <Image
                      src={user.image}
                      alt={`${user.name}'s avatar`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {user.name}, {user.age}
                  </h1>
                  <div className="flex items-center mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-sm">
                      {user.location.city}, {user.location.country}
                    </p>
                    <span className="mx-2">•</span>
                    <p className="text-sm">{user.gender}</p>
                  </div>
                  <p className="mt-1 text-sm opacity-80">{user.last_active}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
            {/* Left Column - About Section */}
            <div className="md:col-span-2">
              {/* AI Compatibility Score */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">
                    AI Compatibility Score
                  </h3>
                </div>
                <div className="flex items-center mb-3">
                  <div className="w-full h-3 bg-gray-200 rounded-full mr-2">
                    <div
                      className="h-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                      style={{ width: `${user.compatibility_score}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold">
                    {user.compatibility_score}%
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="mb-2">Why you're compatible:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    {user.compatibility_reasons.map(
                      (reason: string, index: number) => (
                        <li key={index}>{reason}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* About Me */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">About Me</h2>
                <p className="text-gray-700">{user.bio}</p>
              </div>

              {/* Interests */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest: string, index: number) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Professional & Education */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">
                  Professional & Education
                </h2>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-700">{user.jobTitle}</p>
                  </div>
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <p className="text-gray-700">{user.education}</p>
                  </div>
                </div>
              </div>

              {/* Looking For */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Looking For</h2>
                <p className="text-gray-700">{user.looking_for}</p>
              </div>

              {/* Gallery */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Gallery</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[user.image, ...user.gallery].map((imageUrl, index) => (
                    <div
                      key={index}
                      className={`relative h-32 sm:h-40 rounded-lg overflow-hidden cursor-pointer border-2 ${
                        selectedImage === imageUrl
                          ? "border-purple-600"
                          : "border-transparent"
                      }`}
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${user.name}'s gallery image ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact/Message */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
                <h3 className="text-xl font-bold mb-4">Contact {user.name}</h3>
                <div className="space-y-3 mb-6">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full font-medium flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Chat Now
                  </button>

                  <button className="w-full border border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-3 rounded-full font-medium flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    Add to Favorites
                  </button>
                </div>

                {/* Quick Message Form */}
                <div>
                  <h4 className="font-medium mb-2">Send a Quick Message</h4>
                  <form onSubmit={handleSendMessage}>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Say hello to ${user.name}...`}
                      className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                      required
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-4 py-2 rounded-full font-medium"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PersonalityQuiz from "@/components/PersonalityQuiz";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [notAuthenticatedModal, setNotAuthenticatedModal] = useState(false);

  const openMatchModal = () => {
    setIsQuizModalOpen(true);
  };

  const closeModal = () => {
    setIsQuizModalOpen(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center mt-[-65px]">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.jpg"
            alt="Happy couple enjoying time together"
            fill
            style={{ objectFit: "cover" }}
            priority
            className="brightness-[0.7]"
          />
        </div>

        <div className="relative z-10 w-full bg-gradient-to-r from-purple-900/50 to-pink-800/50 py-32 px-4 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect Match with AI-Powered Compatibility!
            </h1>
            <p className="text-xl md:text-2xl mb-10">
              Let AI analyze your personality & preferences to find the best
              matches for you!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={openMatchModal}
                className="bg-white text-purple-700 hover:bg-gray-100 px-10 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-xl"
              >
                Find your match
              </button>
            </div>

            {/* Optional AI animation or chatbot UI preview */}
            <div className="mt-16 max-w-sm mx-auto opacity-90 bg-black/20 backdrop-blur-sm p-4 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-purple-400 rounded-full animate-pulse"></div>
                <p className="text-sm">AI Matchmaking Assistant</p>
              </div>
              <div className="mt-3 text-left p-3 bg-white/10 rounded-lg">
                <p className="text-sm">
                  Finding your perfect match based on 23 compatibility
                  factors...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Users Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See Who's Waiting for You!
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Browse real people looking for genuine connections. AI has already
            found your best matches!
          </p>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium">
              Verified profiles with shared interests
            </span>
            <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium">
              AI-curated matches based on your personality
            </span>
            <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium">
              Start chatting instantly!
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Featured Users</h3>
            <Link
              href="/users"
              className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
            >
              View All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* First Row of User Cards - Horizontally Scrollable */}
        <div className="relative mb-10">
          <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide snap-x">
            {/* User Card 1 */}
            <Link
              href="/profile/sarah"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop"
                    alt="Sarah profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Sarah, 28</h4>
                  <p className="text-gray-600 text-sm mb-3">London, UK</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* User Card 2 */}
            <Link
              href="/profile/james"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop"
                    alt="James profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">James, 32</h4>
                  <p className="text-gray-600 text-sm mb-3">New York, USA</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* User Card 3 */}
            <Link
              href="/profile/elena"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?q=80&w=400&auto=format&fit=crop"
                    alt="Elena profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Elena, 26</h4>
                  <p className="text-gray-600 text-sm mb-3">Barcelona, Spain</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* User Card 4 */}
            <Link
              href="/profile/michael"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
                    alt="Michael profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Michael, 30</h4>
                  <p className="text-gray-600 text-sm mb-3">Toronto, Canada</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* User Card 5 */}
            <Link
              href="/profile/sophia"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?q=80&w=400&auto=format&fit=crop"
                    alt="Sophia profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Sophia, 29</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Sydney, Australia
                  </p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* More Users Button */}
            <div className="snap-start flex-shrink-0 w-40 flex items-center justify-center">
              <Link
                href="/users"
                className="bg-gray-100 hover:bg-gray-200 text-purple-600 px-4 py-3 rounded-full font-medium text-sm flex items-center h-12"
              >
                More Users
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute right-0 bottom-0 flex space-x-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Second Row of User Cards - Horizontally Scrollable */}
        <div className="relative mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">New Members</h3>
          </div>
          <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide snap-x">
            {/* User Card 6 */}
            <Link
              href="/profile/david"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
                    alt="David profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">David, 35</h4>
                  <p className="text-gray-600 text-sm mb-3">Berlin, Germany</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* User Card 7 */}
            <Link
              href="/profile/anna"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
                    alt="Anna profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Anna, 27</h4>
                  <p className="text-gray-600 text-sm mb-3">Paris, France</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* User Card 8 */}
            <Link
              href="/profile/thomas"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop"
                    alt="Thomas profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Thomas, 31</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Amsterdam, Netherlands
                  </p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* Additional User Card */}
            <Link
              href="/profile/laura"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop"
                    alt="Laura profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Laura, 25</h4>
                  <p className="text-gray-600 text-sm mb-3">Madrid, Spain</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* Additional User Card */}
            <Link
              href="/profile/alex"
              className="snap-start flex-shrink-0 w-64 md:w-72"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop"
                    alt="Alex profile"
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">Alex, 33</h4>
                  <p className="text-gray-600 text-sm mb-3">Chicago, USA</p>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      Chat Now
                    </button>
                    <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-full text-sm font-medium flex-1">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </Link>

            {/* More Users Button */}
            <div className="snap-start flex-shrink-0 w-40 flex items-center justify-center">
              <Link
                href="/users"
                className="bg-gray-100 hover:bg-gray-200 text-purple-600 px-4 py-3 rounded-full font-medium text-sm flex items-center h-12"
              >
                More Users
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute right-0 bottom-0 flex space-x-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="text-center mt-10">
          <button
            onClick={openMatchModal}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-10 py-4 rounded-full font-bold text-xl inline-block shadow-lg transform transition-transform hover:scale-105"
          >
            Find Your Perfect Match Now!
          </button>
          <p className="text-gray-600 mt-4 text-lg">
            Join thousands finding love with AI-powered matchmaking.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-gray-50 w-full">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            How It Works <span className="text-purple-600">—</span> 3 Simple
            Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mb-4 relative">
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Sign Up & Complete Your Profile
              </h3>
              <p className="text-gray-600">
                Create your account and answer questions about your personality,
                interests, and what you're looking for in a partner.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mb-4 relative">
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                AI Analyzes Your Data
              </h3>
              <p className="text-gray-600">
                Our advanced AI algorithms analyze your personality traits,
                preferences, and relationship patterns to understand your needs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mb-4 relative">
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-purple-600"
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
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Get Compatible Matches
              </h3>
              <p className="text-gray-600">
                Receive highly compatible matches based on your personality
                profile and start meaningful conversations right away.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-white py-6 px-8 rounded-xl shadow-md inline-block">
            <p className="text-xl font-medium text-gray-800">
              Join <span className="text-purple-600 font-bold">10,000+</span>{" "}
              users finding love through AI-powered matchmaking
            </p>
          </div>
        </div>
      </section>

      {/* AI Matchmaking Benefits Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            AI Matchmaking Benefits
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our innovative approach to dating uses advanced artificial
            intelligence to create meaningful connections
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {/* Benefit 1 */}
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-4 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Smarter Matches</h3>
              <p className="text-gray-600">
                No random swiping or endless browsing. Our AI selects only the
                most compatible matches based on deep compatibility factors, not
                just appearance or basic interests.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-4 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                AI-Powered Insights
              </h3>
              <p className="text-gray-600">
                Receive personalized dating advice from our AI assistant. Get
                conversation starters, compatibility explanations, and
                relationship guidance tailored to your matches.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-4 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Privacy-Focused</h3>
              <p className="text-gray-600">
                All profiles are verified and real. We prioritize your privacy
                and security with advanced measures to protect your personal
                information and ensure a safe dating experience.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-4 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Easy & Fun</h3>
              <p className="text-gray-600">
                Enjoy a hassle-free, guided dating experience. Our interface is
                intuitive and engaging, making finding love feel less like work
                and more like an exciting journey.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={openMatchModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold text-lg inline-block transition-colors"
          >
            Start Finding Better Matches
          </button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Real Love Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Join thousands of couples who found their perfect match through
            AI-powered matchmaking
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
                  alt="Sarah"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div>
                <h4 className="font-semibold">Sarah & Michael</h4>
                <p className="text-gray-500 text-sm">Matched 1 year ago</p>
              </div>
            </div>
            <p className="text-gray-600 italic mb-4">
              "I met my soulmate here! The AI truly understands compatibility.
              We had a 92% match score and after our first date, we knew there
              was something special."
            </p>
            <div className="flex items-center text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">92% Match</span>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                  alt="David"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div>
                <h4 className="font-semibold">David & Lisa</h4>
                <p className="text-gray-500 text-sm">Matched 8 months ago</p>
              </div>
            </div>
            <p className="text-gray-600 italic mb-4">
              "The best dating platform—less swiping, more real connections! We
              share the same values and goals, which has made our relationship
              strong from the start."
            </p>
            <div className="flex items-center text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">88% Match</span>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                <Image
                  src="https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?q=80&w=200&auto=format&fit=crop"
                  alt="Emma"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div>
                <h4 className="font-semibold">Emma & James</h4>
                <p className="text-gray-500 text-sm">Matched 6 months ago</p>
              </div>
            </div>
            <p className="text-gray-600 italic mb-4">
              "The AI insights were incredibly accurate. We're planning our
              wedding next month, and it's all thanks to this amazing platform!"
            </p>
            <div className="flex items-center text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">95% Match</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-4 bg-purple-50 px-6 py-3 rounded-full">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-600 mr-2"
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
              <span className="text-xl font-bold text-purple-600">10,000+</span>
            </div>
            <span className="text-gray-600">
              successful matches and counting!
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about our AI-powered matchmaking
              platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* FAQ Item 1 */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">
                Is this really free?
              </h3>
              <p className="text-gray-600">
                Yes! We offer a free basic membership that includes profile
                creation, AI matching, and basic communication. Premium features
                are optional and enhance your experience with advanced matching
                algorithms and priority support.
              </p>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">
                How does AI find my match?
              </h3>
              <p className="text-gray-600">
                Our AI analyzes multiple factors including personality traits,
                interests, values, and relationship goals. It uses advanced
                algorithms to identify patterns and compatibility between users,
                ensuring more meaningful connections.
              </p>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">Is my data secure?</h3>
              <p className="text-gray-600">
                Absolutely! We use industry-standard encryption and security
                measures to protect your personal information. Your data is
                never shared with third parties, and you have complete control
                over your privacy settings.
              </p>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">
                How accurate is the matching?
              </h3>
              <p className="text-gray-600">
                Our AI matching system has a proven track record with thousands
                of successful matches. We continuously improve our algorithms
                based on user feedback and relationship outcomes to ensure the
                highest accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="w-full bg-gradient-to-r from-purple-600 to-pink-500 py-16 px-4 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Find Your Match Today!
            </h2>
            <p className="text-xl mb-4">
              First 3 Days of Premium <span className="font-bold">FREE</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
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
                <span className="text-lg">10,000+ successful matches</span>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-lg">As featured in TechCrunch</span>
              </div>
            </div>
            <Link
              href="/register"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-xl inline-block transition-all transform hover:scale-105 shadow-xl"
              onClick={(e) => {
                openMatchModal();
              }}
            >
              Start Matching Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Match AI</h3>
            <p className="text-gray-400">
              AI-powered matchmaking for meaningful relationships.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Match AI. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Personality Quiz Component */}
      <PersonalityQuiz isOpen={isQuizModalOpen} onClose={closeModal} />
    </main>
  );
}

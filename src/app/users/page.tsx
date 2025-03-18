"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// Mock data for users - in a real app, this would come from an API
const MOCK_USERS = [
  {
    id: "1",
    name: "Sarah",
    age: 28,
    location: { city: "London", country: "UK" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "James",
    age: 32,
    location: { city: "New York", country: "USA" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Elena",
    age: 26,
    location: { city: "Barcelona", country: "Spain" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Michael",
    age: 30,
    location: { city: "Toronto", country: "Canada" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "5",
    name: "Sophia",
    age: 29,
    location: { city: "Sydney", country: "Australia" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "6",
    name: "David",
    age: 35,
    location: { city: "Berlin", country: "Germany" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "7",
    name: "Anna",
    age: 27,
    location: { city: "Paris", country: "France" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "8",
    name: "Thomas",
    age: 31,
    location: { city: "Amsterdam", country: "Netherlands" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "9",
    name: "Laura",
    age: 25,
    location: { city: "Madrid", country: "Spain" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "10",
    name: "Alex",
    age: 33,
    location: { city: "Chicago", country: "USA" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "11",
    name: "Maria",
    age: 24,
    location: { city: "Rome", country: "Italy" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "12",
    name: "Daniel",
    age: 29,
    location: { city: "Tokyo", country: "Japan" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "13",
    name: "Olivia",
    age: 27,
    location: { city: "Stockholm", country: "Sweden" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "14",
    name: "Chris",
    age: 31,
    location: { city: "Los Angeles", country: "USA" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "15",
    name: "Natalie",
    age: 26,
    location: { city: "Prague", country: "Czech Republic" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "16",
    name: "Ryan",
    age: 34,
    location: { city: "Dublin", country: "Ireland" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "17",
    name: "Emma",
    age: 28,
    location: { city: "Vienna", country: "Austria" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "18",
    name: "Jack",
    age: 30,
    location: { city: "Singapore", country: "Singapore" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "19",
    name: "Isabella",
    age: 25,
    location: { city: "Melbourne", country: "Australia" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1534008897995-27a23e859048?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "20",
    name: "Jason",
    age: 32,
    location: { city: "Vancouver", country: "Canada" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "21",
    name: "Sophie",
    age: 27,
    location: { city: "Munich", country: "Germany" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "22",
    name: "Mark",
    age: 33,
    location: { city: "Seattle", country: "USA" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "23",
    name: "Lily",
    age: 24,
    location: { city: "Oslo", country: "Norway" },
    gender: "Female",
    image:
      "https://images.unsplash.com/photo-1516239482977-b550ba7253f2?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "24",
    name: "Peter",
    age: 31,
    location: { city: "Montreal", country: "Canada" },
    gender: "Male",
    image:
      "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?q=80&w=400&auto=format&fit=crop",
  },
  // More mock users would be added here...
];

// Get unique countries and cities for filters
const uniqueCountries = [
  ...new Set(MOCK_USERS.map((user) => user.location.country)),
].sort();
const uniqueCities = [
  ...new Set(MOCK_USERS.map((user) => user.location.city)),
].sort();

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [ageRange, setAgeRange] = useState({ min: 18, max: 60 });
  const [filteredUsers, setFilteredUsers] = useState(MOCK_USERS);
  const [displayCount, setDisplayCount] = useState(20);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter users based on search and filter criteria
  useEffect(() => {
    let result = MOCK_USERS;

    // Filter by search query (name)
    if (searchQuery) {
      result = result.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by gender
    if (selectedGender) {
      result = result.filter((user) => user.gender === selectedGender);
    }

    // Filter by location (country or city)
    if (selectedLocation) {
      result = result.filter(
        (user) =>
          user.location.country === selectedLocation ||
          user.location.city === selectedLocation
      );
    }

    // Filter by age range
    result = result.filter(
      (user) => user.age >= ageRange.min && user.age <= ageRange.max
    );

    setFilteredUsers(result);
  }, [searchQuery, selectedGender, selectedLocation, ageRange]);

  const loadMoreUsers = () => {
    setDisplayCount((prevCount) => prevCount + 20);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGender("");
    setSelectedLocation("");
    setAgeRange({ min: 18, max: 60 });
    setIsFilterOpen(false);
    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Discover Your Perfect Match
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Browse through our community of singles and find someone who shares
            your interests and values. Our AI has analyzed compatibility factors
            to help you find meaningful connections.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Toggle Button (Mobile) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden w-full bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              {isSearchOpen ? "Hide Search" : "Search Users"}
            </button>

            {/* Search Input (Desktop or when toggled on mobile) */}
            <div
              className={`w-full md:flex ${
                isSearchOpen ? "block" : "hidden"
              } md:block`}
            >
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Filter Toggle Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </button>

              {filteredUsers.length !== MOCK_USERS.length && (
                <button
                  onClick={resetFilters}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full text-sm font-medium"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Filter options - shows when filters are open */}
          {isFilterOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gender Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  >
                    <option value="">All Locations</option>
                    <optgroup label="Countries">
                      {uniqueCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Cities">
                      {uniqueCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Age Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Range: {ageRange.min} - {ageRange.max}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={ageRange.min}
                      onChange={(e) =>
                        setAgeRange({
                          ...ageRange,
                          min: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={ageRange.max}
                      onChange={(e) =>
                        setAgeRange({
                          ...ageRange,
                          max: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "Match" : "Matches"} Found
          </h2>
          <div className="text-sm text-gray-500">
            Showing {Math.min(displayCount, filteredUsers.length)} of{" "}
            {filteredUsers.length}
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {filteredUsers.slice(0, displayCount).map((user) => (
            <Link href={`/profile/${user.id}`} key={user.id} className="block">
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-full">
                <div className="relative h-64 w-full">
                  <Image
                    src={user.image}
                    alt={`${user.name} profile`}
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg">
                    {user.name}, {user.age}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {user.location.city}, {user.location.country}
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
          ))}
        </div>

        {/* Load More Button */}
        {displayCount < filteredUsers.length && (
          <div className="text-center">
            <button
              onClick={loadMoreUsers}
              className="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-3 rounded-full font-semibold text-lg transition-colors"
            >
              Load More Users
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;

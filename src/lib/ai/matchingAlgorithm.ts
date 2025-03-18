import { IUser } from "@/models/User";

// Extend the IUserPreferences interface to include lifestyle
declare module "@/models/User" {
  interface IUserPreferences {
    lifestyle?: {
      smoking?: boolean;
      drinking?: boolean;
      diet?: string;
      religion?: string;
    };
  }
}

/**
 * AI Matching Algorithm
 *
 * This module provides functions for calculating compatibility between users
 * and generating explanations for matches.
 */

// Personality type compatibility matrix
const personalityCompatibility: Record<string, Record<string, number>> = {
  INTJ: { ENFP: 90, ENTP: 85, INFJ: 75, INFP: 70, ENTJ: 65, INTJ: 60 },
  INTP: { ENFJ: 90, ENTJ: 85, INFJ: 75, INFP: 70, ENTP: 65, INTP: 60 },
  ENTJ: { INFP: 90, INTP: 85, ENFJ: 75, ENFP: 70, INTJ: 65, ENTJ: 60 },
  ENTP: { INFJ: 90, INTJ: 85, ENFJ: 75, ENFP: 70, INTP: 65, ENTP: 60 },
  INFJ: { ENTP: 90, ENFP: 85, INTJ: 75, INTP: 70, INFJ: 65, ENFJ: 60 },
  INFP: { ENTJ: 90, ENFJ: 85, INFJ: 75, INTJ: 70, INFP: 65, ENFP: 60 },
  ENFJ: { INTP: 90, INFP: 85, ENTJ: 75, ENTP: 70, ENFJ: 65, ENFP: 60 },
  ENFP: { INTJ: 90, INFJ: 85, ENTJ: 75, ENTP: 70, ENFP: 65, ENFJ: 60 },
  ISTJ: { ESFP: 85, ESTP: 80, ISFJ: 75, ISFP: 70, ESTJ: 65, ISTJ: 60 },
  ISFJ: { ESTP: 85, ESFP: 80, ISTJ: 75, ISFP: 70, ESFJ: 65, ISFJ: 60 },
  ESTJ: { ISFP: 85, ISTP: 80, ESFJ: 75, ESFP: 70, ISTJ: 65, ESTJ: 60 },
  ESFJ: { ISTP: 85, ISFP: 80, ESTJ: 75, ESTP: 70, ISFJ: 65, ESFJ: 60 },
  ISTP: { ESFJ: 85, ESTJ: 80, ISFP: 75, ISTJ: 70, ESTP: 65, ISTP: 60 },
  ISFP: { ESTJ: 85, ESFJ: 80, ISTP: 75, ISFJ: 70, ESFP: 65, ISFP: 60 },
  ESTP: { ISFJ: 85, ISTJ: 80, ESFP: 75, ESTJ: 70, ISTP: 65, ESTP: 60 },
  ESFP: { ISTJ: 85, ISFJ: 80, ESTP: 75, ESFJ: 70, ISFP: 65, ESFP: 60 },
};

// Personality descriptions for match explanations
const personalityDescriptions: Record<string, string> = {
  INTJ: "analytical, strategic, and independent",
  INTP: "logical, innovative, and curious",
  ENTJ: "decisive, efficient, and goal-oriented",
  ENTP: "inventive, enthusiastic, and adaptable",
  INFJ: "insightful, principled, and idealistic",
  INFP: "creative, empathetic, and authentic",
  ENFJ: "charismatic, inspiring, and supportive",
  ENFP: "passionate, imaginative, and people-oriented",
  ISTJ: "practical, reliable, and systematic",
  ISFJ: "nurturing, detail-oriented, and loyal",
  ESTJ: "organized, traditional, and direct",
  ESFJ: "warm, conscientious, and cooperative",
  ISTP: "versatile, pragmatic, and independent",
  ISFP: "artistic, sensitive, and harmonious",
  ESTP: "energetic, practical, and spontaneous",
  ESFP: "enthusiastic, friendly, and fun-loving",
};

// Default compatibility for unknown personality types
const DEFAULT_PERSONALITY_COMPATIBILITY = 65;

// Relationship goals compatibility matrix
const relationshipGoalsMatrix: Record<string, Record<string, number>> = {
  Casual: { Casual: 100, Serious: 40, Marriage: 10 },
  Serious: { Casual: 40, Serious: 100, Marriage: 80 },
  Marriage: { Casual: 10, Serious: 80, Marriage: 100 },
};

// Location distance weight factor
const DISTANCE_WEIGHT = 0.2;

// Calculate distance between two locations
// This function now handles both string locations and location objects
function calculateDistance(location1: any, location2: any): number {
  // Extract city from location object or string
  const getCity = (loc: any): string => {
    if (typeof loc === "string") {
      return loc.split(",")[0].trim().toLowerCase();
    } else if (loc && loc.city) {
      return loc.city.toLowerCase();
    }
    return "";
  };

  const city1 = getCity(location1);
  const city2 = getCity(location2);

  return city1 === city2 ? 0 : 100; // 0 km if same city, else assume 100 km
}

// Calculate age compatibility score
function calculateAgeCompatibility(user: IUser, potentialMatch: IUser): number {
  // Check if the match's age is within the user's preferences
  const withinUserPrefs =
    potentialMatch.age >= user.preferences.minAge &&
    potentialMatch.age <= user.preferences.maxAge;

  // Check if the user's age is within the match's preferences
  const withinMatchPrefs =
    user.age >= potentialMatch.preferences.minAge &&
    user.age <= potentialMatch.preferences.maxAge;

  // Both parties' preferences are satisfied
  if (withinUserPrefs && withinMatchPrefs) return 100;

  // Only one party's preferences are satisfied
  if (withinUserPrefs || withinMatchPrefs) return 50;

  // Neither party's preferences are satisfied
  return 0;
}

// Calculate personality compatibility score
function calculatePersonalityCompatibility(
  user: IUser,
  potentialMatch: IUser
): number {
  // If either user doesn't have a personality type, return default score
  if (!user.personalityType || !potentialMatch.personalityType) {
    return DEFAULT_PERSONALITY_COMPATIBILITY;
  }

  // Get compatibility score from matrix
  const userType = user.personalityType;
  const matchType = potentialMatch.personalityType;

  // Check if both types exist in the matrix
  if (
    personalityCompatibility[userType] &&
    personalityCompatibility[userType][matchType]
  ) {
    return personalityCompatibility[userType][matchType];
  }

  // Check if reverse lookup exists
  if (
    personalityCompatibility[matchType] &&
    personalityCompatibility[matchType][userType]
  ) {
    return personalityCompatibility[matchType][userType];
  }

  // Default score if not found in matrix
  return DEFAULT_PERSONALITY_COMPATIBILITY;
}

// Calculate relationship goals compatibility
function calculateRelationshipGoalsCompatibility(
  user: IUser,
  potentialMatch: IUser
): number {
  // Ensure relationshipGoals is a string
  const userGoal =
    typeof user.relationshipGoals === "string"
      ? user.relationshipGoals
      : "Casual";
  const matchGoal =
    typeof potentialMatch.relationshipGoals === "string"
      ? potentialMatch.relationshipGoals
      : "Casual";

  // Check if goals exist in the matrix
  if (
    relationshipGoalsMatrix[userGoal] &&
    relationshipGoalsMatrix[userGoal][matchGoal]
  ) {
    return relationshipGoalsMatrix[userGoal][matchGoal];
  }

  return 50; // Default compatibility if not found
}

// Calculate lifestyle compatibility
function calculateLifestyleCompatibility(
  user: IUser,
  potentialMatch: IUser
): number {
  let score = 0;

  // Safely access lifestyle preferences
  const userLifestyle = user.preferences.lifestyle || {};
  const matchLifestyle = potentialMatch.preferences.lifestyle || {};

  // Smoking compatibility
  if (userLifestyle.smoking === matchLifestyle.smoking) {
    score += 25;
  }

  // Drinking compatibility
  if (userLifestyle.drinking === matchLifestyle.drinking) {
    score += 25;
  }

  // Diet compatibility
  if (
    userLifestyle.diet === matchLifestyle.diet ||
    userLifestyle.diet === "Any" ||
    matchLifestyle.diet === "Any"
  ) {
    score += 25;
  }

  // Religion compatibility
  if (
    userLifestyle.religion === matchLifestyle.religion ||
    userLifestyle.religion === "Any" ||
    matchLifestyle.religion === "Any"
  ) {
    score += 25;
  }

  return score;
}

// Check for deal breakers
function checkDealBreakers(user: IUser, potentialMatch: IUser): boolean {
  // If user has no deal breakers, return false (no deal breakers triggered)
  if (
    !user.preferences.dealBreakers ||
    user.preferences.dealBreakers.length === 0
  ) {
    return false;
  }

  // Safely access lifestyle preferences
  const matchLifestyle = potentialMatch.preferences.lifestyle || {};

  // Check each deal breaker
  for (const dealBreaker of user.preferences.dealBreakers) {
    const lowerCaseDealBreaker = dealBreaker.toLowerCase();

    // Check for smoking
    if (lowerCaseDealBreaker.includes("smoking") && matchLifestyle.smoking) {
      return true;
    }

    // Check for drinking
    if (lowerCaseDealBreaker.includes("drinking") && matchLifestyle.drinking) {
      return true;
    }

    // Check for distance/location
    if (
      lowerCaseDealBreaker.includes("distance") ||
      lowerCaseDealBreaker.includes("long distance")
    ) {
      const distance = calculateDistance(
        user.location,
        potentialMatch.location
      );
      if (distance > user.preferences.distance) {
        return true;
      }
    }

    // Check for specific religions
    if (
      lowerCaseDealBreaker.includes("religion") &&
      matchLifestyle.religion !== "Any" &&
      lowerCaseDealBreaker.includes(
        (matchLifestyle.religion || "").toLowerCase()
      )
    ) {
      return true;
    }
  }

  return false;
}

// Calculate overall compatibility score
export function calculateCompatibilityScore(
  user: IUser,
  potentialMatch: IUser
): number {
  // Check for deal breakers first
  if (checkDealBreakers(user, potentialMatch)) {
    return 0; // Automatic zero if deal breakers are triggered
  }

  // Calculate individual compatibility scores
  const ageScore = calculateAgeCompatibility(user, potentialMatch);
  const personalityScore = calculatePersonalityCompatibility(
    user,
    potentialMatch
  );
  const relationshipGoalsScore = calculateRelationshipGoalsCompatibility(
    user,
    potentialMatch
  );
  const lifestyleScore = calculateLifestyleCompatibility(user, potentialMatch);

  // Calculate distance score
  const distance = calculateDistance(user.location, potentialMatch.location);
  const distanceScore = Math.max(
    0,
    100 - (distance / user.preferences.distance) * 100
  );

  // Weighted average of all scores
  const weightedScore =
    ageScore * 0.2 +
    personalityScore * 0.25 +
    relationshipGoalsScore * 0.25 +
    lifestyleScore * 0.2 +
    distanceScore * 0.1;

  // Round to nearest integer and ensure it's between 0 and 100
  return Math.min(Math.max(Math.round(weightedScore), 0), 100);
}

// Generate match explanation based on compatibility score and personality type
export function generateMatchExplanation(
  compatibilityScore: number,
  personalityType: string
): string {
  // Base explanation structure
  let explanation = "";

  // Compatibility level description
  if (compatibilityScore >= 90) {
    explanation += "You two have exceptional compatibility! ";
  } else if (compatibilityScore >= 80) {
    explanation += "You have strong compatibility with this match. ";
  } else if (compatibilityScore >= 70) {
    explanation += "You have good compatibility with this match. ";
  } else if (compatibilityScore >= 60) {
    explanation += "You have moderate compatibility with this match. ";
  } else {
    explanation += "You have some compatibility with this match. ";
  }

  // Add personality insights if available
  if (personalityType && personalityDescriptions[personalityType]) {
    explanation += `Their ${personalityType} personality type suggests they are ${personalityDescriptions[personalityType]}. `;

    // Add complementary traits based on personality
    if (personalityType.includes("N")) {
      explanation +=
        "They tend to focus on ideas, possibilities, and the future. ";
    } else if (personalityType.includes("S")) {
      explanation +=
        "They tend to be practical and focused on concrete details and experiences. ";
    }

    if (personalityType.includes("F")) {
      explanation +=
        "They make decisions based on personal values and how their actions affect others. ";
    } else if (personalityType.includes("T")) {
      explanation +=
        "They approach decisions with logical analysis and objective reasoning. ";
    }

    if (personalityType.includes("E")) {
      explanation +=
        "Their extroverted nature means they gain energy from social interactions. ";
    } else if (personalityType.includes("I")) {
      explanation +=
        "Their introverted nature means they recharge through quiet reflection and alone time. ";
    }
  }

  // Add compatibility insights based on score
  if (compatibilityScore >= 80) {
    explanation +=
      "Our AI analysis suggests you share important values and communication styles. ";
    explanation +=
      "You're likely to understand each other well and have complementary approaches to life. ";
  } else if (compatibilityScore >= 60) {
    explanation +=
      "You have some complementary traits that could create a balanced relationship. ";
    explanation +=
      "While you may have different approaches in some areas, these differences could help you grow together. ";
  } else {
    explanation +=
      "You have some differences that might require more effort to understand each other. ";
    explanation +=
      "However, these differences could also lead to growth and new perspectives. ";
  }

  // Add recommendation
  explanation +=
    "We recommend starting a conversation to explore your connection further.";

  return explanation;
}

/**
 * Returns personality traits based on MBTI type
 */
function getPersonalityTraits(type: string): string[] {
  const traits: Record<string, string[]> = {
    INTJ: ["analytical", "strategic", "independent", "determined"],
    INTP: ["logical", "innovative", "curious", "adaptable"],
    ENTJ: ["decisive", "efficient", "strategic", "assertive"],
    ENTP: ["innovative", "enthusiastic", "adaptable", "analytical"],
    INFJ: ["insightful", "principled", "creative", "determined"],
    INFP: ["idealistic", "empathetic", "creative", "authentic"],
    ENFJ: ["charismatic", "inspiring", "empathetic", "organized"],
    ENFP: ["enthusiastic", "creative", "sociable", "perceptive"],
    ISTJ: ["practical", "reliable", "systematic", "logical"],
    ISFJ: ["supportive", "reliable", "observant", "patient"],
    ESTJ: ["organized", "practical", "direct", "systematic"],
    ESTP: ["energetic", "practical", "spontaneous", "adaptable"],
    ISFP: ["gentle", "sensitive", "spontaneous", "artistic"],
    ISTP: ["practical", "logical", "spontaneous", "independent"],
    ESFJ: ["supportive", "sociable", "practical", "organized"],
    ESFP: ["enthusiastic", "spontaneous", "friendly", "adaptable"],
  };

  return traits[type] || ["thoughtful", "unique", "interesting"];
}

/**
 * Returns random interests for conversation starters
 */
function getRandomInterests(): string {
  const interests = [
    "travel and adventure",
    "food and cooking",
    "music and arts",
    "books and literature",
    "sports and fitness",
    "technology and innovation",
    "nature and outdoors",
    "philosophy and ideas",
  ];

  const randomIndex = Math.floor(Math.random() * interests.length);
  return interests[randomIndex];
}

// Get top matches for a user
export function getTopMatches(
  user: IUser,
  potentialMatches: IUser[],
  limit: number = 10
): Array<{ match: IUser; score: number; explanation: string }> {
  // Calculate compatibility scores for each potential match
  const scoredMatches = potentialMatches.map((match) => {
    const score = calculateCompatibilityScore(user, match);
    const explanation = generateMatchExplanation(
      score,
      user.personalityType || ""
    );

    return {
      match,
      score,
      explanation,
    };
  });

  // Filter out zero scores (deal breakers)
  const validMatches = scoredMatches.filter((match) => match.score > 0);

  // Sort by compatibility score (highest first)
  validMatches.sort((a, b) => b.score - a.score);

  // Return top N matches
  return validMatches.slice(0, limit);
}

// For demonstration purposes, we'll add a simple auth options stub
// In a real app, this would be properly implemented in lib/auth.ts
export const authOptions = {
  // This is just a placeholder to make the code compile
  // The actual implementation would be in lib/auth.ts
};

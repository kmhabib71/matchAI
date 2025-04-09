import { IUser } from "@/models/User";

// Extend the IUserPreferences interface to include lifestyle
declare module "@/models/User" {
  interface IUserPreferences {
    lifestyle?: {
      smoking?: boolean;
      drinking?: boolean;
      diet?: string;
      religion?: string;
      children?: string;
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

/**
 * Extract quiz answers that will be used for matching
 */
function extractQuizData(user: IUser): Record<string, any> {
  if (!user.personalityQuiz?.answers) return {};

  return user.personalityQuiz.answers;
}

/**
 * Check if users are of opposite genders (strict requirement)
 */
function isOppositeGender(user: IUser, potentialMatch: IUser): boolean {
  // For binary gender matching (male/female)
  const userGender = user.gender.toLowerCase();
  const matchGender = potentialMatch.gender.toLowerCase();

  if (userGender === "male" && matchGender === "female") return true;
  if (userGender === "female" && matchGender === "male") return true;

  // Consider user's orientation for non-binary cases
  const userOrientation = user.orientation?.toLowerCase() || "";

  if (userOrientation === "heterosexual" || userOrientation === "straight") {
    return userGender !== matchGender;
  }

  // For other orientations, don't filter by gender
  return true;
}

/**
 * Calculate compatibility based primarily on quiz answers
 */
function calculateQuizCompatibility(
  user: IUser,
  potentialMatch: IUser
): number {
  // Extract quiz answers
  const userAnswers = extractQuizData(user);
  const matchAnswers = extractQuizData(potentialMatch);

  // If either user doesn't have quiz answers, return a low compatibility
  if (
    Object.keys(userAnswers).length === 0 ||
    Object.keys(matchAnswers).length === 0
  ) {
    return 30; // Minimal compatibility if quiz not completed
  }

  let totalScore = 0;
  let factors = 0;

  // 1. Age preference match
  if (userAnswers.preferences_1 && matchAnswers.profile_3) {
    // Convert preferences_1 (age range) and profile_3 (birth year) to actual ages
    const ageRangeStr = userAnswers.preferences_1.replace(/[^\d-–—]/g, "");
    const ageRange = ageRangeStr
      .split(/[-–—]/)
      .map((a: string) => parseInt(a.trim()));

    let matchAge = 0;
    if (matchAnswers.profile_3) {
      const birthYear = parseInt(matchAnswers.profile_3);
      if (!isNaN(birthYear)) {
        const currentYear = new Date().getFullYear();
        matchAge = currentYear - birthYear;
      }
    }

    if (matchAge > 0 && ageRange.length === 2) {
      const minAge = ageRange[0];
      const maxAge = ageRange[1];

      if (!isNaN(minAge) && !isNaN(maxAge)) {
        if (matchAge >= minAge && matchAge <= maxAge) {
          totalScore += 100;
        } else {
          // Partial score for close match
          const ageDiff = Math.min(
            Math.abs(matchAge - minAge),
            Math.abs(matchAge - maxAge)
          );
          totalScore += Math.max(0, 100 - ageDiff * 10);
        }
        factors++;
      }
    }
  }

  // 2. Occupation preference match
  if (userAnswers.preferences_2 && matchAnswers.profile_5) {
    const preferredOccupations = userAnswers.preferences_2
      .split(",")
      .map((o: string) => o.trim().toLowerCase());
    const matchOccupation = matchAnswers.profile_5.toLowerCase();

    if (
      preferredOccupations.some((occ: string) => matchOccupation.includes(occ))
    ) {
      totalScore += 100;
    } else if (
      preferredOccupations.includes("any") ||
      preferredOccupations.includes("any occupation")
    ) {
      totalScore += 80;
    } else {
      totalScore += 40; // Some value for non-matching occupation
    }
    factors++;
  }

  // 3. Income preference match
  if (userAnswers.preferences_3 && matchAnswers.profile_6) {
    if (userAnswers.preferences_3.includes(matchAnswers.profile_6)) {
      totalScore += 100;
    } else {
      // Try to parse income ranges and compare
      totalScore += 50; // Default partial match
    }
    factors++;
  }

  // 4. Education preference match
  if (userAnswers.preferences_4 && matchAnswers.profile_7) {
    if (
      matchAnswers.profile_7
        .toLowerCase()
        .includes(userAnswers.preferences_4.toLowerCase())
    ) {
      totalScore += 100;
    } else if (userAnswers.preferences_4.includes("Any")) {
      totalScore += 80;
    } else {
      totalScore += 50;
    }
    factors++;
  }

  // 5. Location preference match
  if (userAnswers.preferences_5 && user.location && potentialMatch.location) {
    const preferredLocation = userAnswers.preferences_5.toLowerCase();
    const matchLocation =
      (potentialMatch.location.city || "").toLowerCase() +
      (potentialMatch.location.country || "").toLowerCase();

    if (
      matchLocation.includes(preferredLocation) ||
      preferredLocation.includes("any")
    ) {
      totalScore += 100;
    } else {
      totalScore += 40;
    }
    factors++;
  }

  // 6. Religion compatibility
  if (userAnswers.profile_8 && matchAnswers.profile_8) {
    if (userAnswers.profile_8 === matchAnswers.profile_8) {
      totalScore += 100;
    } else if (
      userAnswers.profile_8 === "Any" ||
      matchAnswers.profile_8 === "Any"
    ) {
      totalScore += 70;
    } else {
      totalScore += 30;
    }
    factors++;
  }

  // 7. Relationship goals compatibility
  if (userAnswers.profile_9 && matchAnswers.profile_9) {
    const statusToGoal: Record<string, string> = {
      Single: "Casual",
      Divorced: "Serious",
      Widowed: "Serious",
      Separated: "Casual",
      Married: "Marriage",
    };

    const userGoal =
      statusToGoal[userAnswers.profile_9] || userAnswers.profile_9;
    const matchGoal =
      statusToGoal[matchAnswers.profile_9] || matchAnswers.profile_9;

    if (userGoal === matchGoal) {
      totalScore += 100;
    } else if (
      (userGoal === "Serious" && matchGoal === "Marriage") ||
      (userGoal === "Marriage" && matchGoal === "Serious")
    ) {
      totalScore += 80;
    } else {
      totalScore += 30;
    }
    factors++;
  }

  // 8. Lifestyle factors (smoking, children)
  if (userAnswers.profile_10 && matchAnswers.profile_10) {
    if (userAnswers.profile_10 === matchAnswers.profile_10) {
      totalScore += 100;
    } else {
      totalScore += 50;
    }
    factors++;
  }

  // 9. Smoking habits
  if (userAnswers.profile_11 && matchAnswers.profile_11) {
    if (userAnswers.profile_11 === matchAnswers.profile_11) {
      totalScore += 100;
    } else {
      totalScore += 30;
    }
    factors++;
  }

  // 10. Shared interests
  if (userAnswers.profile_12 && matchAnswers.profile_12) {
    const userInterests = userAnswers.profile_12
      .split(",")
      .map((i: string) => i.trim().toLowerCase());
    const matchInterests = matchAnswers.profile_12
      .split(",")
      .map((i: string) => i.trim().toLowerCase());

    if (userInterests.length > 0 && matchInterests.length > 0) {
      const sharedInterests = userInterests.filter((i: string) =>
        matchInterests.includes(i)
      ).length;
      const interestScore =
        (sharedInterests / Math.max(1, Math.min(userInterests.length, 5))) *
        100;
      totalScore += interestScore;
      factors++;
    }
  }

  // 11. MBTI compatibility
  if (user.personalityType && potentialMatch.personalityType) {
    const mbtiScore = calculateMBTICompatibility(
      user.personalityType,
      potentialMatch.personalityType
    );
    totalScore += mbtiScore;
    factors++;
  } else {
    // Use MBTI quiz answers to calculate compatibility
    let mbtiMatchCount = 0;
    let mbtiQuestions = 0;

    for (let i = 1; i <= 8; i++) {
      const key = `mbti_${i}`;
      if (userAnswers[key] && matchAnswers[key]) {
        mbtiQuestions++;
        if (userAnswers[key] === matchAnswers[key]) {
          mbtiMatchCount++;
        }
      }
    }

    if (mbtiQuestions > 0) {
      const mbtiScore = (mbtiMatchCount / mbtiQuestions) * 100;
      totalScore += mbtiScore;
      factors++;
    }
  }

  // Calculate average score
  return factors > 0 ? Math.round(totalScore / factors) : 50;
}

/**
 * Calculate MBTI type compatibility score
 */
function calculateMBTICompatibility(type1: string, type2: string): number {
  // Check direct compatibility from the matrix
  if (personalityCompatibility[type1]?.[type2]) {
    return personalityCompatibility[type1][type2];
  }

  // Check reverse lookup
  if (personalityCompatibility[type2]?.[type1]) {
    return personalityCompatibility[type2][type1];
  }

  // Calculate based on individual letter compatibility
  let score = 0;

  // E/I compatibility (opposites attract)
  if (type1[0] !== type2[0]) score += 20;

  // S/N compatibility (same preference is better)
  if (type1[1] === type2[1]) score += 25;

  // T/F compatibility (opposites can complement)
  if (type1[2] !== type2[2]) score += 20;

  // J/P compatibility (balance is good)
  if (type1[3] !== type2[3]) score += 20;

  return score + 15; // Base score plus calculated
}

/**
 * Generate compatibility explanation with reasons
 */
function generateCompatibilityReasons(
  user: IUser,
  match: IUser,
  score: number
): string[] {
  const reasons: string[] = [];
  const userAnswers = extractQuizData(user);
  const matchAnswers = extractQuizData(match);

  if (score >= 80) {
    reasons.push("You have exceptional compatibility");
  } else if (score >= 70) {
    reasons.push("You have strong compatibility");
  } else if (score >= 60) {
    reasons.push("You have good compatibility");
  } else {
    reasons.push("You have moderate compatibility");
  }

  // Add personality type match reason
  if (user.personalityType && match.personalityType) {
    if (
      personalityCompatibility[user.personalityType]?.[match.personalityType] >=
      80
    ) {
      reasons.push(
        `Your personality types (${user.personalityType} and ${match.personalityType}) are highly compatible`
      );
    } else if (user.personalityType === match.personalityType) {
      reasons.push(
        `You share the same personality type (${user.personalityType})`
      );
    }
  }

  // Add interests match reason
  if (userAnswers.profile_12 && matchAnswers.profile_12) {
    const userInterests = userAnswers.profile_12
      .split(",")
      .map((i: string) => i.trim().toLowerCase());
    const matchInterests = matchAnswers.profile_12
      .split(",")
      .map((i: string) => i.trim().toLowerCase());
    const sharedInterests = userInterests.filter((i: string) =>
      matchInterests.includes(i)
    );

    if (sharedInterests.length > 0) {
      reasons.push(`You share interests in ${sharedInterests.join(", ")}`);
    }
  }

  // Add religion match reason
  if (
    userAnswers.profile_8 &&
    matchAnswers.profile_8 &&
    userAnswers.profile_8 === matchAnswers.profile_8
  ) {
    reasons.push(`You share the same religion (${userAnswers.profile_8})`);
  }

  // Add relationship goal match reason
  if (
    userAnswers.profile_9 &&
    matchAnswers.profile_9 &&
    userAnswers.profile_9 === matchAnswers.profile_9
  ) {
    reasons.push(
      `You have similar relationship goals (${userAnswers.profile_9})`
    );
  }

  // Add lifestyle match reasons
  if (
    userAnswers.profile_11 &&
    matchAnswers.profile_11 &&
    userAnswers.profile_11 === matchAnswers.profile_11
  ) {
    const smokingStatus =
      userAnswers.profile_11 === "Yes" ? "being smokers" : "being non-smokers";
    reasons.push(`You match in ${smokingStatus}`);
  }

  if (
    userAnswers.profile_10 &&
    matchAnswers.profile_10 &&
    userAnswers.profile_10 === matchAnswers.profile_10
  ) {
    const childrenStatus =
      userAnswers.profile_10 === "Yes"
        ? "having children"
        : "not having children";
    reasons.push(`You match in ${childrenStatus}`);
  }

  return reasons;
}

// Export function to calculate compatibility score
export function calculateCompatibilityScore(
  user: IUser,
  potentialMatch: IUser
): number {
  // First check if users are of opposite gender (strict requirement)
  if (!isOppositeGender(user, potentialMatch)) {
    return 0; // No compatibility if not opposite gender
  }

  // Calculate compatibility based primarily on quiz answers
  return calculateQuizCompatibility(user, potentialMatch);
}

/**
 * Generate match explanation based on compatibility score and user data
 */
export function generateMatchExplanation(
  user: IUser,
  match: IUser,
  compatibilityScore: number
): {
  explanation: string;
  reasons: string[];
  sharedValues: string[];
  topTraits: string[];
} {
  // Generate base explanation
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
  if (match.personalityType && personalityDescriptions[match.personalityType]) {
    explanation += `Their ${
      match.personalityType
    } personality type suggests they are ${
      personalityDescriptions[match.personalityType]
    }. `;
  }

  // Extract specific match details from quiz answers
  const matchAnswers = match.personalityQuiz?.answers || {};

  // Add information about their interests
  if (matchAnswers.profile_12) {
    explanation += `They enjoy ${matchAnswers.profile_12}. `;
  }

  // Add information about their education/occupation
  if (matchAnswers.profile_5 || matchAnswers.profile_7) {
    const occupation = matchAnswers.profile_5
      ? `works as a ${matchAnswers.profile_5}`
      : "";
    const education = matchAnswers.profile_7
      ? `has ${matchAnswers.profile_7} education`
      : "";

    if (occupation && education) {
      explanation += `They ${occupation} and ${education}. `;
    } else if (occupation) {
      explanation += `They ${occupation}. `;
    } else if (education) {
      explanation += `They ${education}. `;
    }
  }

  // Add compatibility insights based on score
  if (compatibilityScore >= 80) {
    explanation +=
      "Our analysis suggests you share important values and communication styles. ";
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

  // Generate specific reasons for compatibility
  const reasons = generateCompatibilityReasons(user, match, compatibilityScore);

  // Extract shared values
  const sharedValues = extractSharedValues(user, match);

  // Get personality traits
  const topTraits = match.personalityType
    ? getPersonalityTraits(match.personalityType)
    : extractTraitsFromQuiz(match);

  return {
    explanation,
    reasons,
    sharedValues,
    topTraits,
  };
}

/**
 * Extract shared values between users
 */
function extractSharedValues(user: IUser, match: IUser): string[] {
  const sharedValues: string[] = [];
  const userAnswers = user.personalityQuiz?.answers || {};
  const matchAnswers = match.personalityQuiz?.answers || {};

  // Religion
  if (
    userAnswers.profile_8 &&
    matchAnswers.profile_8 &&
    userAnswers.profile_8 === matchAnswers.profile_8
  ) {
    sharedValues.push(`Religion: ${userAnswers.profile_8}`);
  }

  // Family values
  if (
    userAnswers.profile_10 &&
    matchAnswers.profile_10 &&
    userAnswers.profile_10 === matchAnswers.profile_10
  ) {
    const familyValue =
      userAnswers.profile_10 === "Yes"
        ? "Family-oriented"
        : "Independent lifestyle";
    sharedValues.push(familyValue);
  }

  // Lifestyle
  if (
    userAnswers.profile_11 &&
    matchAnswers.profile_11 &&
    userAnswers.profile_11 === matchAnswers.profile_11
  ) {
    const lifestyleValue =
      userAnswers.profile_11 === "No" ? "Healthy lifestyle" : "Social smoking";
    sharedValues.push(lifestyleValue);
  }

  // MBTI related values
  if (
    userAnswers.mbti_3 &&
    matchAnswers.mbti_3 &&
    userAnswers.mbti_3 === matchAnswers.mbti_3
  ) {
    sharedValues.push(`View on relationships: ${userAnswers.mbti_3}`);
  }

  if (
    userAnswers.mbti_5 &&
    matchAnswers.mbti_5 &&
    userAnswers.mbti_5 === matchAnswers.mbti_5
  ) {
    sharedValues.push(`Approach to life: ${userAnswers.mbti_5}`);
  }

  return sharedValues;
}

/**
 * Extract personality traits from quiz answers
 */
function extractTraitsFromQuiz(user: IUser): string[] {
  const traits: string[] = [];
  const answers = user.personalityQuiz?.answers || {};

  // Map answers to traits
  if (answers.mbti_1 === "Social and energetic") {
    traits.push("extroverted");
  } else if (answers.mbti_1 === "Quiet and reflective") {
    traits.push("introspective");
  }

  if (answers.mbti_3 === "Love is based on practical considerations") {
    traits.push("practical");
  } else if (answers.mbti_3 === "Love develops over time") {
    traits.push("patient");
  } else if (answers.mbti_3 === "Love at first sight") {
    traits.push("romantic");
  }

  if (answers.mbti_5 === "More practical") {
    traits.push("grounded");
  } else if (answers.mbti_5 === "More imaginative") {
    traits.push("creative");
  }

  if (answers.mbti_6 === "Need some alone time") {
    traits.push("independent");
  } else if (answers.mbti_6 === "Prefer being around others") {
    traits.push("sociable");
  }

  // Add default traits if we have too few
  if (traits.length < 3) {
    if (user.personalityType) {
      const personalityTraits = getPersonalityTraits(user.personalityType);
      traits.push(...personalityTraits.filter((t) => !traits.includes(t)));
    }

    const defaultTraits = ["thoughtful", "unique", "interesting"];
    traits.push(...defaultTraits.filter((t) => !traits.includes(t)));
  }

  // Return at most 4 traits
  return traits.slice(0, 4);
}

/**
 * Returns personality traits based on MBTI type
 */
export function getPersonalityTraits(type: string): string[] {
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
 * Get top matches for a user with detailed information
 */
export function getTopMatches(
  user: IUser,
  potentialMatches: IUser[],
  limit: number = 10
): Array<{
  match: IUser;
  score: number;
  explanation: string;
  compatibilityReasons: string[];
  sharedValues: string[];
  topTraits: string[];
}> {
  // First filter for opposite gender matches
  const oppositeGenderMatches = potentialMatches.filter((match) =>
    isOppositeGender(user, match)
  );

  // Calculate compatibility scores for each potential match
  const scoredMatches = oppositeGenderMatches.map((match) => {
    const score = calculateCompatibilityScore(user, match);
    const { explanation, reasons, sharedValues, topTraits } =
      generateMatchExplanation(user, match, score);

    return {
      match,
      score,
      explanation,
      compatibilityReasons: reasons,
      sharedValues,
      topTraits,
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

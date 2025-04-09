import { IUser } from "@/models/User";

// Interface for compatibility scores
export interface CompatibilityScore {
  userId: string;
  score: number;
  matchDetails?: {
    personalityScore: number;
    attachmentScore: number;
    valuesScore: number;
    hobbiesScore: number;
    demographicsScore: number;
    preferencesScore: number;
  };
}

// Interface for final match result with explanation
export interface MatchResult {
  userId: string;
  score: number;
  reason: string;
}

// Add PersonalityTraits interface
interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  secureAttachment: number;
  anxiousAttachment: number;
  values: {
    family: number;
    career: number;
    adventure: number;
    stability: number;
  };
}

// Helper for extracting personality scores (1-5 scale)
export function getPersonalityTraits(
  answers: Record<string, string>
): PersonalityTraits {
  const extractValue = (key: string): number => {
    const value = answers[key];
    return value ? parseInt(value.split(":")[0]) : 3;
  };

  return {
    openness: extractValue("personality_1"),
    conscientiousness: extractValue("personality_2"),
    extraversion: extractValue("personality_3"),
    agreeableness: extractValue("personality_4"),
    neuroticism: extractValue("personality_5"),
    secureAttachment: extractValue("personality_7"), // Fixed: Secure is personality_7
    anxiousAttachment: extractValue("personality_6"), // Fixed: Anxious is personality_6
    values: {
      family: extractValue("personality_9"),
      career: extractValue("personality_10"),
      adventure: extractValue("personality_11"),
      stability: extractValue("personality_12"),
    },
  };
}

// Parse age range from preferences_1 (e.g., "23-28")
function parseAgeRange(ageRange: string): { min: number; max: number } {
  const match = ageRange.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
  }
  return { min: 18, max: 100 }; // Default range if parsing fails
}

// Calculate age from birth year (profile_3)
function calculateAge(birthYear: string): number {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(birthYear, 10);
}

// Calculate demographic matching score (gender, religion, marital status)
function calculateDemographicScore(
  currentUser: IUser,
  candidate: IUser
): number {
  const currentUserProfile = currentUser.personalityQuiz?.answers || {};
  const candidateProfile = candidate.personalityQuiz?.answers || {};

  let score = 0;
  const maxScore = 30;

  // Gender matching (opposite gender: currentUser = male, candidate = female or vice versa)
  // "পুরুষ" = Male, "নারী" = Female
  const genderMatch =
    (currentUserProfile.profile_2 === "male" &&
      candidateProfile.profile_2 === "female") ||
    (currentUserProfile.profile_2 === "female" &&
      candidateProfile.profile_2 === "male");

  if (genderMatch) score += 10;

  // Religion matching (exact match required)
  // e.g., "ইসলাম" = Islam
  const religionMatch =
    currentUserProfile.profile_8 === candidateProfile.profile_8;
  if (religionMatch) score += 10;

  // Marital status matching
  // Single with Single, Divorced with Divorced
  // "অবিবাহিত" = Single, "বিবাহবিচ্ছিন্ন" = Divorced, "বিধবা/বিপত্নীক" = Widowed
  const currentUserMaritalStatus = currentUserProfile.profile_9;
  const candidateMaritalStatus = candidateProfile.profile_9;

  const maritalStatusMatch =
    // Singles match with singles
    (currentUserMaritalStatus === "single" &&
      candidateMaritalStatus === "single") ||
    // Divorced/separated match with divorced/separated/widowed
    ((currentUserMaritalStatus === "divorced" ||
      currentUserMaritalStatus === "widowed") &&
      (candidateMaritalStatus === "divorced" ||
        candidateMaritalStatus === "widowed"));

  if (maritalStatusMatch) score += 10;

  return (score / maxScore) * 100;
}

// Calculate hobbies similarity score using Jaccard similarity
function calculateHobbiesScore(currentUser: IUser, candidate: IUser): number {
  const currentUserHobbies = (
    currentUser.personalityQuiz?.answers?.profile_12 || ""
  )
    .split(",")
    .map((h) => h.trim().toLowerCase());

  const candidateHobbies = (
    candidate.personalityQuiz?.answers?.profile_12 || ""
  )
    .split(",")
    .map((h) => h.trim().toLowerCase());

  if (currentUserHobbies.length === 0 || candidateHobbies.length === 0) {
    return 0;
  }

  // Calculate Jaccard similarity (intersection / union)
  const intersection = currentUserHobbies.filter((hobby) =>
    candidateHobbies.includes(hobby)
  ).length;

  const union = new Set([...currentUserHobbies, ...candidateHobbies]).size;

  return (intersection / union) * 100;
}

// Calculate personality compatibility (Big Five)
function calculatePersonalityScore(
  currentUser: IUser,
  candidate: IUser
): number {
  const currentUserTraits = getPersonalityTraits(
    currentUser.personalityQuiz?.answers || {}
  );
  const candidateTraits = getPersonalityTraits(
    candidate.personalityQuiz?.answers || {}
  );

  // Big Five similarity with specialized rules
  // For most traits, similarity is good (low difference = high score)
  // For some traits (like extraversion), some complementarity may be beneficial

  // Calculate normalized differences (0-1 scale where 0 = identical, 1 = maximum difference)
  const opennessDiff =
    Math.abs(currentUserTraits.openness - candidateTraits.openness) / 4;
  const conscientiousnessDiff =
    Math.abs(
      currentUserTraits.conscientiousness - candidateTraits.conscientiousness
    ) / 4;

  // For extraversion, some complementarity can be good (difference of 1-2 points optimal)
  const extraversionDiff = Math.abs(
    currentUserTraits.extraversion - candidateTraits.extraversion
  );
  const extraversionScore =
    extraversionDiff <= 2
      ? 1 - extraversionDiff / 4
      : 1 - (extraversionDiff - 1) / 3;

  const agreeablenessDiff =
    Math.abs(currentUserTraits.agreeableness - candidateTraits.agreeableness) /
    4;
  const neuroticismDiff =
    Math.abs(currentUserTraits.neuroticism - candidateTraits.neuroticism) / 4;

  // Convert differences to similarity scores (0-1 where 1 = perfect match)
  const opennessScore = 1 - opennessDiff;
  const conscientiousnessScore = 1 - conscientiousnessDiff;
  const agreeablenessScore = 1 - agreeablenessDiff;
  const neuroticismScore = 1 - neuroticismDiff;

  // Weighted average of personality trait scores
  // Emphasize emotional stability (low neuroticism) and agreeableness
  const weightedScore =
    opennessScore * 0.15 +
    conscientiousnessScore * 0.2 +
    extraversionScore * 0.15 +
    agreeablenessScore * 0.25 +
    neuroticismScore * 0.25;

  return weightedScore * 100;
}

// Calculate attachment style compatibility
function calculateAttachmentScore(
  currentUser: IUser,
  candidate: IUser
): number {
  const currentUserTraits = getPersonalityTraits(
    currentUser.personalityQuiz?.answers || {}
  );
  const candidateTraits = getPersonalityTraits(
    candidate.personalityQuiz?.answers || {}
  );

  // Calculate differences for secure and anxious attachment
  const secureDiff =
    Math.abs(
      currentUserTraits.secureAttachment - candidateTraits.secureAttachment
    ) / 4;
  const anxiousDiff =
    Math.abs(
      currentUserTraits.anxiousAttachment - candidateTraits.anxiousAttachment
    ) / 4;

  // Convert to similarity scores (0-1 where 1 = perfect match)
  const secureScore = 1 - secureDiff;
  const anxiousScore = 1 - anxiousDiff;

  // Weighted average with equal importance
  return ((secureScore + anxiousScore) / 2) * 100;
}

// Calculate values compatibility (family, career, social, adventure)
function calculateValuesScore(currentUser: IUser, candidate: IUser): number {
  const currentUserTraits = getPersonalityTraits(
    currentUser.personalityQuiz?.answers || {}
  );
  const candidateTraits = getPersonalityTraits(
    candidate.personalityQuiz?.answers || {}
  );

  // Calculate differences for each value dimension
  const familyDiff =
    Math.abs(currentUserTraits.values.family - candidateTraits.values.family) /
    4;
  const careerDiff =
    Math.abs(currentUserTraits.values.career - candidateTraits.values.career) /
    4;
  const adventureDiff =
    Math.abs(
      currentUserTraits.values.adventure - candidateTraits.values.adventure
    ) / 4;
  const stabilityDiff =
    Math.abs(
      currentUserTraits.values.stability - candidateTraits.values.stability
    ) / 4;

  // Convert to similarity scores (0-1 where 1 = perfect match)
  const familyScore = 1 - familyDiff;
  const careerScore = 1 - careerDiff;
  const adventureScore = 1 - adventureDiff;
  const stabilityScore = 1 - stabilityDiff;

  // Weighted average with higher emphasis on family values
  const weightedScore =
    familyScore * 0.4 + // Family values most important
    careerScore * 0.2 + // Career secondary
    adventureScore * 0.2 + // Adventure tertiary
    stabilityScore * 0.2; // Stability tertiary

  return weightedScore * 100;
}

// Update calculatePreferencesScore to handle IUser type
export function calculatePreferencesScore(
  currentUser: IUser,
  candidate: IUser
): number {
  const currentUserPrefs = currentUser.personalityQuiz?.answers || {};
  const candidateProfile = candidate.personalityQuiz?.answers || {};

  let score = 0;
  const maxScore = 4; // Increased from 3 to include city

  // Age range matching
  const userAgeRange = currentUserPrefs.preferences_1;
  const candidateAge = parseInt(candidateProfile.profile_3);
  if (userAgeRange && candidateAge) {
    const [minAge, maxAge] = userAgeRange.split("-").map(Number);
    if (candidateAge >= minAge && candidateAge <= maxAge) {
      score += 1;
    }
  }

  // Profession matching
  const userProfessions =
    currentUserPrefs.preferences_2?.split(",").map((p) => p.trim()) || [];
  const candidateProfession = candidateProfile.profile_5;
  if (userProfessions.includes(candidateProfession)) {
    score += 1;
  }

  // Education matching
  const userEducation = currentUserPrefs.preferences_4;
  const candidateEducation = candidateProfile.profile_7;
  if (userEducation === candidateEducation) {
    score += 1;
  }

  // City matching with personality override
  const prefersSameCity = currentUserPrefs.preferences_5
    ?.toLowerCase()
    .includes("same");
  const userCity = currentUserPrefs.profile_4;
  const candidateCity = candidateProfile.profile_4;

  if (!prefersSameCity || userCity === candidateCity) {
    score += 1;
  } else if (calculatePersonalityScore(currentUser, candidate) >= 90) {
    score += 1; // Personality override for city preference
  }

  return (score / maxScore) * 100;
}

// Main function to calculate overall compatibility score
export function calculateCompatibilityScore(
  currentUser: IUser,
  candidate: IUser
): CompatibilityScore {
  const personalityScore = calculatePersonalityScore(currentUser, candidate);
  const attachmentScore = calculateAttachmentScore(currentUser, candidate);
  const valuesScore = calculateValuesScore(currentUser, candidate);
  const hobbiesScore = calculateHobbiesScore(currentUser, candidate);
  const demographicsScore = calculateDemographicScore(currentUser, candidate);
  const preferencesScore = calculatePreferencesScore(currentUser, candidate);

  // City scoring with personality override
  const userCity = currentUser.personalityQuiz?.answers?.profile_4;
  const candidateCity = candidate.personalityQuiz?.answers?.profile_4;
  const cityScore =
    userCity === candidateCity
      ? 100
      : calculatePersonalityScore(currentUser, candidate) >= 90
      ? 100
      : 70;

  // Updated weights
  const weightedScore =
    personalityScore * 0.4 + // Personality: 40%
    attachmentScore * 0.2 + // Attachment: 20%
    valuesScore * 0.15 + // Values: 15%
    hobbiesScore * 0.1 + // Hobbies: 10%
    preferencesScore * 0.075 + // Preferences: 7.5%
    cityScore * 0.075; // City: 7.5%

  return {
    userId: candidate._id?.toString() || "",
    score: Math.round(weightedScore * 100) / 100, // Round to 2 decimal places
    matchDetails: {
      personalityScore,
      attachmentScore,
      valuesScore,
      hobbiesScore,
      demographicsScore,
      preferencesScore,
    },
  };
}

// Function to find top 5 matches from a list of candidates
export function findTop5Soulmates(
  currentUser: IUser,
  candidates: IUser[]
): CompatibilityScore[] {
  const scores = candidates.map((candidate) => {
    const score = calculateCompatibilityScore(currentUser, candidate);

    // Add bonus for perfect matches
    const allFieldsMatch =
      score.matchDetails!.demographicsScore === 100 &&
      score.matchDetails!.preferencesScore === 100 &&
      score.matchDetails!.hobbiesScore > 0 &&
      score.matchDetails!.personalityScore >= 90 &&
      score.matchDetails!.attachmentScore >= 90;

    if (allFieldsMatch) {
      score.score += 10; // Add bonus for perfect matches
    }

    return score;
  });

  return scores.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Function to generate a match explanation (placeholder - will be replaced by OpenAI function)
export function generateMatchExplanation(
  currentUser: IUser,
  candidate: IUser,
  score: CompatibilityScore
): string {
  // This is a placeholder - the actual implementation is in openai.ts
  return `Match score: ${score.score.toFixed(
    1
  )}%. This user appears to be highly compatible with you based on personality traits, attachment style, and shared interests.`;
}

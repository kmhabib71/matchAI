import OpenAI from "openai";
import { IUser } from "@/models/User";
import {
  CompatibilityScore,
  MatchResult,
  getPersonalityTraits,
} from "./matchingAlgorithm";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache for match analysis results
// Key: currentUserId + sortedCandidateIds, Value: analysis result
const matchAnalysisCache = new Map<string, MatchResult[]>();
const CACHE_MAX_SIZE = 100; // Limit cache size to prevent memory issues

/**
 * Generate detailed match explanations using OpenAI
 * @param currentUser The user looking for matches
 * @param candidates Array of top 5 potential matches with scores
 * @returns Promise<Array<MatchResult>> Top 3 matches with detailed explanations
 */
export async function analyzeTopMatches(
  currentUser: any,
  candidates: Array<{ user: any; score: CompatibilityScore }>
): Promise<MatchResult[]> {
  try {
    // Create a cache key using user ID and sorted candidate IDs
    const currentUserId = currentUser._id?.toString() || "";
    const candidateIds = candidates
      .map(({ user }) => user._id?.toString() || "")
      .sort()
      .join("-");
    const cacheKey = `${currentUserId}-${candidateIds}`;

    // Check cache first
    if (matchAnalysisCache.has(cacheKey)) {
      console.log("Using cached match analysis result");
      return matchAnalysisCache.get(cacheKey)!;
    }

    // Limit to top 3 candidates to reduce token usage
    const top3Candidates = candidates.slice(0, 3);

    // Extract only necessary information to reduce token usage
    const currentUserTraits = getPersonalityTraits(
      currentUser.personalityQuiz?.answers || {}
    );
    const candidateDetails = top3Candidates.map(({ user, score }) => {
      const userAnswers = user.personalityQuiz?.answers || {};
      const traits = getPersonalityTraits(userAnswers);

      return {
        userId: user._id?.toString() || "",
        score: score.score,
        name: userAnswers.profile_1 || "User",
        // Just include trait values without descriptions to save tokens
        traits: {
          openness: traits.openness,
          conscientiousness: traits.conscientiousness,
          extraversion: traits.extraversion,
          agreeableness: traits.agreeableness,
          neuroticism: traits.neuroticism,
          secureAttachment: traits.secureAttachment,
          anxiousAttachment: traits.anxiousAttachment,
        },
        hobbies: (userAnswers.profile_12 || "")
          .split(",")
          .map((h: string) => h.trim()),
        profession: userAnswers.profile_5 || "",
        education: userAnswers.profile_7 || "",
        age: calculateAge(userAnswers.profile_3 || "2000"),
        matchDetails: {
          personalityScore: score.matchDetails?.personalityScore || 0,
          attachmentScore: score.matchDetails?.attachmentScore || 0,
          hobbiesScore: score.matchDetails?.hobbiesScore || 0,
        },
      };
    });

    // Current user details for the prompt - only essential info
    const userDetails = {
      name: currentUser.personalityQuiz?.answers?.profile_1 || "User",
      traits: {
        openness: currentUserTraits.openness,
        conscientiousness: currentUserTraits.conscientiousness,
        extraversion: currentUserTraits.extraversion,
        agreeableness: currentUserTraits.agreeableness,
        neuroticism: currentUserTraits.neuroticism,
        secureAttachment: currentUserTraits.secureAttachment,
        anxiousAttachment: currentUserTraits.anxiousAttachment,
      },
      hobbies: (currentUser.personalityQuiz?.answers?.profile_12 || "")
        .split(",")
        .map((h: string) => h.trim()),
      profession: currentUser.personalityQuiz?.answers?.profile_5 || "",
      education: currentUser.personalityQuiz?.answers?.profile_7 || "",
      age: calculateAge(
        currentUser.personalityQuiz?.answers?.profile_3 || "2000"
      ),
    };

    // Prepare the prompt - more concise
    const prompt = generateOptimizedPrompt(userDetails, candidateDetails);

    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Use a more cost-effective model
      messages: [
        {
          role: "system",
          content:
            "You are an expert matchmaker analyzing compatibility between potential partners based on their personality traits, attachment styles, and interests. Provide concise, insightful match explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 800, // Reduced token limit
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsedResponse = JSON.parse(content);

    // Extract the matches with reasons
    const topMatches = top3Candidates.map(({ user, score }, index) => {
      const userId = user._id?.toString() || "";
      const matchResponse = parsedResponse.matches.find(
        (m: any) => m.userId === userId
      );

      return {
        userId,
        score: score.score,
        reason:
          matchResponse?.reason ||
          generateFallbackReason(currentUser, user, score),
      };
    });

    // Store in cache
    matchAnalysisCache.set(cacheKey, topMatches);

    // Maintain cache size limit
    if (matchAnalysisCache.size > CACHE_MAX_SIZE) {
      const oldestKey = matchAnalysisCache.keys().next().value;
      if (oldestKey) {
        matchAnalysisCache.delete(oldestKey);
      }
    }

    return topMatches;
  } catch (error) {
    console.error("Error in OpenAI match analysis:", error);

    // Fallback: Return top 3 matches with generic reasons
    return candidates.slice(0, 3).map(({ user, score }) => ({
      userId: user._id?.toString() || "",
      score: score.score,
      reason: generateFallbackReason(currentUser, user, score),
    }));
  }
}

// Calculate age from birth year
function calculateAge(birthYear: string): number {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(birthYear, 10);
  return isNaN(yearNum) ? 25 : currentYear - yearNum;
}

// Generate a concise, token-efficient prompt for OpenAI
function generateOptimizedPrompt(currentUser: any, candidates: any[]): string {
  return `
Analyze compatibility between the current user and ${
    candidates.length
  } potential matches, then provide reasons why they are compatible.

CURRENT USER:
Name: ${currentUser.name}
Age: ${currentUser.age}
Profession: ${currentUser.profession}
Education: ${currentUser.education}
Hobbies: ${currentUser.hobbies.join(", ")}
Traits: Openness(${currentUser.traits.openness}/5), Conscientiousness(${
    currentUser.traits.conscientiousness
  }/5), Extraversion(${currentUser.traits.extraversion}/5), Agreeableness(${
    currentUser.traits.agreeableness
  }/5), Neuroticism(${currentUser.traits.neuroticism}/5), SecureAttachment(${
    currentUser.traits.secureAttachment
  }/5), AnxiousAttachment(${currentUser.traits.anxiousAttachment}/5)

MATCHES:
${candidates
  .map(
    (candidate) => `
Match ID: ${candidate.userId}
Name: ${candidate.name}
Age: ${candidate.age}
Profession: ${candidate.profession}
Education: ${candidate.education}
Compatibility: ${candidate.score.toFixed(
      2
    )}% (Personality: ${candidate.matchDetails?.personalityScore.toFixed(
      2
    )}%, Attachment: ${candidate.matchDetails?.attachmentScore.toFixed(
      2
    )}%, Hobbies: ${candidate.matchDetails?.hobbiesScore.toFixed(2)}%)
Hobbies: ${candidate.hobbies.join(", ")}
Traits: Openness(${candidate.traits.openness}/5), Conscientiousness(${
      candidate.traits.conscientiousness
    }/5), Extraversion(${candidate.traits.extraversion}/5), Agreeableness(${
      candidate.traits.agreeableness
    }/5), Neuroticism(${candidate.traits.neuroticism}/5), SecureAttachment(${
      candidate.traits.secureAttachment
    }/5), AnxiousAttachment(${candidate.traits.anxiousAttachment}/5)
`
  )
  .join("\n")}

For each match, provide ONE concise paragraph (60-80 words) explaining compatibility, focusing on:
1. How their personalities complement each other
2. Attachment style dynamics
3. Shared interests or values
4. Why they would be good soulmates

Return in JSON format:
{
  "matches": [
    {"userId": "match1_id", "reason": "concise paragraph"},
    {"userId": "match2_id", "reason": "concise paragraph"},
    {"userId": "match3_id", "reason": "concise paragraph"}
  ]
}`;
}

// Generate a fallback reason if OpenAI call fails
function generateFallbackReason(
  currentUser: any,
  candidate: any,
  score: CompatibilityScore
): string {
  const candidateAnswers = candidate.personalityQuiz?.answers || {};
  const userAnswers = currentUser.personalityQuiz?.answers || {};

  // Extract key information
  const candidateName = candidateAnswers.profile_1 || "This person";
  const currentUserTraits = getPersonalityTraits(userAnswers);
  const candidateTraits = getPersonalityTraits(candidateAnswers);

  // Generate a basic compatibility explanation
  let reason = `${candidateName} appears to be a strong match with a compatibility score of ${score.score.toFixed(
    1
  )}%. `;

  // Add personality insights
  if (
    Math.abs(currentUserTraits.extraversion - candidateTraits.extraversion) <= 1
  ) {
    reason += `You both have similar social energy levels, which creates natural harmony. `;
  } else if (currentUserTraits.extraversion > candidateTraits.extraversion) {
    reason += `Your outgoing nature complements their more reflective personality. `;
  } else {
    reason += `Their social energy nicely balances your more thoughtful approach. `;
  }

  // Add attachment insights
  if (
    currentUserTraits.secureAttachment >= 3 &&
    candidateTraits.secureAttachment >= 3
  ) {
    reason += `You both show signs of secure attachment, suggesting a stable emotional foundation. `;
  }

  // Add hobbies insight
  const userHobbies = (userAnswers.profile_12 || "")
    .split(",")
    .map((h: string) => h.trim().toLowerCase());
  const candidateHobbies = (candidateAnswers.profile_12 || "")
    .split(",")
    .map((h: string) => h.trim().toLowerCase());
  const sharedHobbies = userHobbies.filter((h: string) =>
    candidateHobbies.includes(h)
  );

  if (sharedHobbies.length > 0) {
    reason += `You share common interests in ${sharedHobbies.join(
      ", "
    )}, creating opportunities for shared experiences.`;
  } else {
    reason += `Your different interests offer opportunities to introduce each other to new experiences and grow together.`;
  }

  return reason;
}

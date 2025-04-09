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

/**
 * Generate detailed match explanations using OpenAI
 * @param currentUser The user looking for matches
 * @param candidates Array of top 5 potential matches with scores
 * @returns Promise<Array<MatchResult>> Top 3 matches with detailed explanations
 */
export async function analyzeTopMatches(
  currentUser: IUser,
  candidates: Array<{ user: IUser; score: CompatibilityScore }>
): Promise<MatchResult[]> {
  try {
    // Extract personality traits for all users
    const currentUserTraits = getPersonalityTraits(currentUser);
    const candidateDetails = candidates.map(({ user, score }) => {
      const traits = getPersonalityTraits(user);
      const userAnswers = user.personalityQuiz?.answers || {};

      return {
        userId: user._id?.toString() || "",
        score: score.score,
        name: userAnswers.profile_1 || "User",
        traits,
        hobbies: (userAnswers.profile_12 || "").split(",").map((h) => h.trim()),
        profession: userAnswers.profile_5 || "",
        education: userAnswers.profile_7 || "",
        age: calculateAge(userAnswers.profile_3 || "2000"),
        matchDetails: score.matchDetails,
      };
    });

    // Current user details for the prompt
    const userDetails = {
      name: currentUser.personalityQuiz?.answers?.profile_1 || "You",
      traits: currentUserTraits,
      hobbies: (currentUser.personalityQuiz?.answers?.profile_12 || "")
        .split(",")
        .map((h) => h.trim()),
      profession: currentUser.personalityQuiz?.answers?.profile_5 || "",
      education: currentUser.personalityQuiz?.answers?.profile_7 || "",
      age: calculateAge(
        currentUser.personalityQuiz?.answers?.profile_3 || "2000"
      ),
    };

    // Prepare the prompt for OpenAI
    const prompt = generateMatchAnalysisPrompt(userDetails, candidateDetails);

    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Use the most advanced model available
      messages: [
        {
          role: "system",
          content: `You are an expert matchmaker and relationship psychologist. Your task is to analyze 
          compatibility between potential romantic partners based on their personality traits, 
          attachment styles, values, and interests. Your analysis should be insightful, accurate, 
          and personalized.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsedResponse = JSON.parse(content);

    // Extract the top 3 matches with reasons
    const top3Matches = parsedResponse.matches.map((match: any) => ({
      userId: match.userId,
      score:
        candidateDetails.find((c) => c.userId === match.userId)?.score || 0,
      reason: match.reason,
    }));

    return top3Matches;
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

// Generate a detailed prompt for OpenAI
function generateMatchAnalysisPrompt(
  currentUser: any,
  candidates: any[]
): string {
  // Trait descriptions for better context
  const traitDescriptions = {
    openness: "Openness to new experiences, creativity, and curiosity",
    conscientiousness: "Organization, responsibility, and reliability",
    extraversion: "Sociability, assertiveness, and energy in social settings",
    agreeableness: "Kindness, cooperation, and consideration for others",
    neuroticism: "Emotional sensitivity, anxiety, and stress response",
    secureAttachment: "Comfort with intimacy and healthy independence",
    anxiousAttachment: "Fear of abandonment and need for reassurance",
    avoidantAttachment: "Difficulty with emotional intimacy and independence",
    familyValues: "Importance of family and desire for children",
    careerValues: "Focus on professional growth and career success",
    travelValues: "Importance of travel and exploration",
    moneyValues: "Financial values and money management",
  };

  // Format trait data for better readability
  const formatTraits = (traits: any) => {
    return Object.entries(traits)
      .map(([trait, value]) => {
        const description = (traitDescriptions as any)[trait] || "";
        return `- ${trait}: ${value}/5 (${description})`;
      })
      .join("\n");
  };

  return `
Please analyze the compatibility between the current user and 5 potential matches, then select the top 3 most compatible matches with detailed explanations.

CURRENT USER:
Name: ${currentUser.name}
Age: ${currentUser.age}
Profession: ${currentUser.profession}
Education: ${currentUser.education}
Hobbies: ${currentUser.hobbies.join(", ")}

Personality Traits:
${formatTraits(currentUser.traits)}

POTENTIAL MATCHES:
${candidates
  .map(
    (candidate) => `
Match ID: ${candidate.userId}
Name: ${candidate.name}
Age: ${candidate.age}
Profession: ${candidate.profession}
Education: ${candidate.education}
Compatibility Score: ${candidate.score.toFixed(1)}%
- Personality Score: ${candidate.matchDetails?.personalityScore.toFixed(1)}%
- Attachment Score: ${candidate.matchDetails?.attachmentScore.toFixed(1)}%
- Values Score: ${candidate.matchDetails?.valuesScore.toFixed(1)}%
- Hobbies Score: ${candidate.matchDetails?.hobbiesScore.toFixed(1)}%
Hobbies: ${candidate.hobbies.join(", ")}

Personality Traits:
${formatTraits(candidate.traits)}
`
  )
  .join("\n")}

INSTRUCTIONS:
1. Analyze the psychological compatibility between the current user and each of the 5 potential matches.
2. Consider personality trait matching, attachment style compatibility, shared values, and common interests.
3. Select the top 3 most compatible matches.
4. For each of the top 3 matches, provide a detailed paragraph explaining why they would be great soulmates for the current user.
5. Focus on how their personalities complement each other, attachment style dynamics, shared values, and interests.
6. Be specific about which traits create harmony (e.g., complementary extraversion/introversion, similar conscientiousness levels).
7. IMPORTANT: When evaluating matches, prioritize personality compatibility over location. A strong personality match from a different city should be considered more valuable than a weaker personality match from the same city. Explain how their personality traits and values create a foundation that can overcome geographical distance.

Please return your analysis in JSON format as follows:
{
  "matches": [
    {
      "userId": "match_id_1",
      "reason": "Detailed paragraph explaining compatibility..."
    },
    {
      "userId": "match_id_2",
      "reason": "Detailed paragraph explaining compatibility..."
    },
    {
      "userId": "match_id_3",
      "reason": "Detailed paragraph explaining compatibility..."
    }
  ]
}
`;
}

// Generate a fallback reason if OpenAI call fails
function generateFallbackReason(
  currentUser: IUser,
  candidate: IUser,
  score: CompatibilityScore
): string {
  const candidateAnswers = candidate.personalityQuiz?.answers || {};
  const userAnswers = currentUser.personalityQuiz?.answers || {};

  // Extract key information
  const candidateName = candidateAnswers.profile_1 || "This person";
  const currentUserTraits = getPersonalityTraits(currentUser);
  const candidateTraits = getPersonalityTraits(candidate);

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
    .map((h) => h.trim().toLowerCase());
  const candidateHobbies = (candidateAnswers.profile_12 || "")
    .split(",")
    .map((h) => h.trim().toLowerCase());
  const sharedHobbies = userHobbies.filter((h) => candidateHobbies.includes(h));

  if (sharedHobbies.length > 0) {
    reason += `You share common interests in ${sharedHobbies.join(
      ", "
    )}, creating opportunities for shared experiences.`;
  } else {
    reason += `Your different interests offer opportunities to introduce each other to new experiences and grow together.`;
  }

  return reason;
}

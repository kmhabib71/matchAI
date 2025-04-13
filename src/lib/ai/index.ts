import { IUser } from "@/models/User";
import { CompatibilityScore, MatchResult } from "./matchingAlgorithm";
import {
  analyzeTopMatchesWithTemplate,
  generateTemplateReason,
} from "./templateGenerator";

/**
 * Generate detailed match explanations using template system
 * @param currentUser The user looking for matches
 * @param candidates Array of top 5 potential matches with scores
 * @returns Promise<Array<MatchResult>> Top 3 matches with detailed explanations
 */
export async function analyzeTopMatches(
  currentUser: any,
  candidates: Array<{
    user: any;
    score: CompatibilityScore;
    matchDetails?: any;
  }>
): Promise<(MatchResult & { matchDetails?: any })[]> {
  // Include matchDetails from each candidate's score when returning results
  const topMatches = analyzeTopMatchesWithTemplate(currentUser, candidates);

  // Ensure matchDetails is carried over to the results
  return topMatches.map((match) => {
    // Find the corresponding candidate
    const candidate = candidates.find((c) => c.score.userId === match.userId);
    // Add matchDetails to the result
    return {
      ...match,
      matchDetails: candidate?.score.matchDetails || candidate?.matchDetails,
    };
  });
}

/**
 * Generate a reason for a single match using template system
 * This function keeps the same signature as the OpenAI version for compatibility
 */
export async function generateAIReason(
  currentUser: IUser,
  candidate: IUser,
  score: CompatibilityScore
): Promise<string> {
  return generateTemplateReason(currentUser, candidate, score);
}

/**
 * Generate a match explanation
 * This matches the function signature in matchingAlgorithm.ts
 */
export function generateMatchExplanation(
  currentUser: IUser,
  candidate: IUser,
  score: CompatibilityScore
): string {
  // Call the template generator synchronously
  return generateTemplateReason(currentUser, candidate, score);
}

/**
 * Batch analyze compatibility for a list of matches
 * This is a template-based replacement for the OpenAI version
 */
export async function batchAnalyzeCompatibility(
  currentUser: any,
  matches: any[]
): Promise<any[]> {
  // Simply return the matches with a template-based reason for each
  return matches.map((match) => {
    // Create a simplified compatibility score object if one doesn't exist
    const score = match.compatibilityScore || {
      score: match.score || 75,
      matchDetails: {
        personalityScore: 80,
        attachmentScore: 75,
        valuesScore: 70,
        hobbiesScore: 65,
        demographicsScore: 90,
        preferencesScore: 85,
      },
    };

    // Generate reason using our template system
    const reason = generateTemplateReason(currentUser, match, score);

    // Return the match with the reason
    return {
      ...match,
      reason,
    };
  });
}

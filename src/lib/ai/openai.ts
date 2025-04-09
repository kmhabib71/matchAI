import OpenAI from "openai";
import { IUser } from "@/models/User";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze compatibility between two users using OpenAI
 */
export async function analyzeCompatibility(
  user: IUser,
  potentialMatch: IUser
): Promise<{
  score: number;
  explanation: string;
  compatibilityReasons: string[];
  sharedValues: string[];
  topTraits: string[];
}> {
  try {
    // Create a prompt that describes both users and asks for compatibility analysis
    const prompt = createCompatibilityPrompt(user, potentialMatch);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert matchmaker and relationship psychologist. Your task is to analyze the compatibility between two people based on their profiles and provide a compatibility score and detailed explanation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);
    return {
      score: result.compatibilityScore,
      explanation: result.explanation,
      compatibilityReasons: result.compatibilityReasons || [],
      sharedValues: result.sharedValues || [],
      topTraits: result.topTraits || [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to the rule-based algorithm if OpenAI fails
    return fallbackCompatibilityAnalysis(user, potentialMatch);
  }
}

/**
 * Create a batch of compatibility analyses for multiple potential matches
 */
export async function batchAnalyzeCompatibility(
  user: IUser,
  potentialMatches: IUser[],
  limit: number = 5
): Promise<
  Array<{
    match: IUser;
    score: number;
    explanation: string;
    compatibilityReasons: string[];
    sharedValues: string[];
    topTraits: string[];
  }>
> {
  try {
    // First filter for opposite gender matches
    const oppositeGenderMatches = potentialMatches.filter((match) => {
      const userGender = user.gender.toLowerCase();
      const matchGender = match.gender.toLowerCase();
      return (
        (userGender === "male" && matchGender === "female") ||
        (userGender === "female" && matchGender === "male")
      );
    });

    // For small batches, we can process them in parallel
    if (oppositeGenderMatches.length <= limit) {
      const analysisPromises = oppositeGenderMatches.map(async (match) => {
        const {
          score,
          explanation,
          compatibilityReasons,
          sharedValues,
          topTraits,
        } = await analyzeCompatibility(user, match);
        return {
          match,
          score,
          explanation,
          compatibilityReasons,
          sharedValues,
          topTraits,
        };
      });

      const results = await Promise.all(analysisPromises);

      // Sort by compatibility score (highest first)
      return results.sort((a, b) => b.score - a.score);
    }

    // For larger batches, first use embeddings to find the most promising matches
    const topCandidates = await findTopCandidatesWithEmbeddings(
      user,
      oppositeGenderMatches,
      limit
    );

    // Then analyze those candidates in detail
    const analysisPromises = topCandidates.map(async (match) => {
      const {
        score,
        explanation,
        compatibilityReasons,
        sharedValues,
        topTraits,
      } = await analyzeCompatibility(user, match);
      return {
        match,
        score,
        explanation,
        compatibilityReasons,
        sharedValues,
        topTraits,
      };
    });

    const results = await Promise.all(analysisPromises);

    // Sort by compatibility score (highest first)
    return results.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Batch analysis error:", error);
    // Fallback to the rule-based algorithm
    return fallbackBatchAnalysis(user, potentialMatches, limit);
  }
}

/**
 * Use OpenAI embeddings to find the most promising matches
 */
async function findTopCandidatesWithEmbeddings(
  user: IUser,
  potentialMatches: IUser[],
  limit: number
): Promise<IUser[]> {
  try {
    // Create a user profile embedding
    const userProfileText = createUserProfileText(user);
    const userEmbedding = await createEmbedding(userProfileText);

    // Create embeddings for all potential matches
    const matchEmbeddingPromises = potentialMatches.map(async (match) => {
      const matchProfileText = createUserProfileText(match);
      const embedding = await createEmbedding(matchProfileText);
      return { match, embedding };
    });

    const matchEmbeddings = await Promise.all(matchEmbeddingPromises);

    // Calculate cosine similarity between user and each potential match
    const scoredMatches = matchEmbeddings.map(({ match, embedding }) => {
      const similarity = calculateCosineSimilarity(userEmbedding, embedding);
      return { match, similarity };
    });

    // Sort by similarity (highest first) and take the top matches
    scoredMatches.sort((a, b) => b.similarity - a.similarity);
    return scoredMatches.slice(0, limit).map((item) => item.match);
  } catch (error) {
    console.error("Embedding error:", error);
    // If embeddings fail, return a random selection of matches
    const shuffled = [...potentialMatches].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }
}

/**
 * Create an embedding for a text using OpenAI
 */
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  return dotProduct / (mag1 * mag2);
}

/**
 * Create a text representation of a user profile for embedding
 * Updated to handle quiz data
 */
function createUserProfileText(user: IUser): string {
  // Extract quiz answers
  const quizAnswers = user.personalityQuiz?.answers || {};

  // Convert quiz answers to text
  let quizText = "";
  Object.entries(quizAnswers).forEach(([key, value]) => {
    if (key.startsWith("profile_")) {
      const questionNum = key.split("_")[1];
      quizText += `Profile Question ${questionNum}: ${value}\n`;
    } else if (key.startsWith("mbti_")) {
      const questionNum = key.split("_")[1];
      quizText += `MBTI Question ${questionNum}: ${value}\n`;
    } else if (key.startsWith("preferences_")) {
      const questionNum = key.split("_")[1];
      quizText += `Preference Question ${questionNum}: ${value}\n`;
    }
  });

  return `
    Name: ${user.name}
    Age: ${user.age}
    Gender: ${user.gender}
    Orientation: ${user.orientation}
    Location: ${user.location.city || ""}, ${user.location.country || ""}
    Bio: ${user.bio || ""}
    Personality Type: ${user.personalityType || ""}
    Interests: ${user.interests?.join(", ") || ""}
    Relationship Goals: ${
      Array.isArray(user.relationshipGoals)
        ? user.relationshipGoals.join(", ")
        : user.relationshipGoals || ""
    }
    Lifestyle: 
      Drinking: ${user.lifestyle?.drinking || ""}
      Smoking: ${user.lifestyle?.smoking || ""}
      Exercise: ${user.lifestyle?.exercise || ""}
      Diet: ${user.lifestyle?.diet || ""}
      Religion: ${user.lifestyle?.religion || ""}
      Politics: ${user.lifestyle?.politics || ""}
      Children: ${user.lifestyle?.children || ""}
    Personality Quiz Data:
    ${quizText}
    Preferences:
      Age Range: ${user.preferences.minAge} - ${user.preferences.maxAge}
      Distance: ${user.preferences.distance}
  `;
}

/**
 * Create a detailed prompt for compatibility analysis
 */
function createCompatibilityPrompt(user: IUser, potentialMatch: IUser): string {
  return `
    I need you to analyze the compatibility between two people based on their profiles.
    
    Person 1:
    ${createUserProfileText(user)}
    
    Person 2:
    ${createUserProfileText(potentialMatch)}
    
    Please analyze their compatibility considering:
    1. Age preferences
    2. Personality type compatibility
    3. Relationship goals alignment
    4. Lifestyle compatibility (smoking, drinking, diet, religion, etc.)
    5. Shared interests
    6. Geographic distance
    7. Quiz answers and preferences
    
    Provide a compatibility score from 0-100 and a detailed explanation of why they might be compatible or incompatible.
    
    Return your analysis in the following JSON format:
    {
      "compatibilityScore": number,
      "explanation": "detailed explanation",
      "compatibilityReasons": ["reason1", "reason2"...],
      "sharedValues": ["value1", "value2"...],
      "topTraits": ["trait1", "trait2"...]
    }
  `;
}

/**
 * Fallback to rule-based algorithm if OpenAI fails
 */
function fallbackCompatibilityAnalysis(
  user: IUser,
  potentialMatch: IUser
): {
  score: number;
  explanation: string;
  compatibilityReasons: string[];
  sharedValues: string[];
  topTraits: string[];
} {
  // Import the rule-based algorithm functions
  const {
    calculateCompatibilityScore,
    generateMatchExplanation,
  } = require("./matchingAlgorithm");

  // Use the rule-based algorithm as fallback
  const score = calculateCompatibilityScore(user, potentialMatch);
  const {
    explanation,
    reasons: compatibilityReasons,
    sharedValues,
    topTraits,
  } = generateMatchExplanation(user, potentialMatch, score);

  return {
    score,
    explanation,
    compatibilityReasons,
    sharedValues,
    topTraits,
  };
}

/**
 * Fallback batch analysis using rule-based algorithm
 */
function fallbackBatchAnalysis(
  user: IUser,
  potentialMatches: IUser[],
  limit: number
): Array<{
  match: IUser;
  score: number;
  explanation: string;
  compatibilityReasons: string[];
  sharedValues: string[];
  topTraits: string[];
}> {
  // Import the rule-based algorithm function
  const { getTopMatches } = require("./matchingAlgorithm");

  // Use the rule-based algorithm as fallback
  return getTopMatches(user, potentialMatches, limit);
}

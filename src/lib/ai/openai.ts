import OpenAI from "openai";
import { IUser } from "@/models/User";
import {
  CompatibilityScore,
  MatchResult,
  getPersonalityTraits,
} from "./matchingAlgorithm";
import {
  analyzeTopMatchesWithTemplate,
  generateTemplateReason,
} from "./templateGenerator";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Flag to toggle between OpenAI API and template-based generation
const USE_TEMPLATE_SYSTEM = process.env.USE_TEMPLATE_SYSTEM === "true";

// Simple in-memory cache for match analysis results
// Key: currentUserId + sortedCandidateIds, Value: analysis result
const matchAnalysisCache = new Map<string, MatchResult[]>();
const CACHE_MAX_SIZE = 100; // Limit cache size to prevent memory issues

/**
 * Generate detailed match explanations using OpenAI or template system
 * @param currentUser The user looking for matches
 * @param candidates Array of top 5 potential matches with scores
 * @returns Promise<Array<MatchResult>> Top 3 matches with detailed explanations
 */
export async function analyzeTopMatches(
  currentUser: any,
  candidates: Array<{ user: any; score: CompatibilityScore }>
): Promise<MatchResult[]> {
  // If using template system, use it instead of OpenAI
  if (USE_TEMPLATE_SYSTEM) {
    return analyzeTopMatchesWithTemplate(currentUser, candidates);
  }

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
      max_tokens: 1400, // Increased token limit to ensure complete responses
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsedResponse = JSON.parse(content);

    // Extract the matches with reasons
    const topMatches = await Promise.all(
      top3Candidates.map(async ({ user, score }, index) => {
        const userId = user._id?.toString() || "";
        let reason = "";

        try {
          // Try to get the reason from the parsed response
          if (parsedResponse && parsedResponse.matches) {
            const matchResponse = parsedResponse.matches.find(
              (m: any) => m.userId === userId
            );
            if (matchResponse && matchResponse.reason) {
              reason = matchResponse.reason;
            } else {
              // If no reason found, try a simplified request for just this match
              reason = await generateAIReason(currentUser, user, score);
            }
          } else {
            // If no matches in the response, use a simplified request
            reason = await generateAIReason(currentUser, user, score);
          }
        } catch (error) {
          console.error("Error extracting reason for match:", error);
          // Use a simplified request if any error occurs
          reason = await generateAIReason(currentUser, user, score);
        }

        return {
          userId,
          score: score.score,
          reason,
        };
      })
    );

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

    // Fallback: Return top 3 matches with Bangla reasons from simplified AI calls
    const fallbackResults = await Promise.all(
      candidates.slice(0, 3).map(async ({ user, score }) => ({
        userId: user._id?.toString() || "",
        score: score.score,
        reason: await generateAIReason(currentUser, user, score),
      }))
    );

    return fallbackResults;
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

CRITICAL INSTRUCTION: YOU MUST WRITE THE ENTIRE RESPONSE IN BENGALI (BANGLA) LANGUAGE. DO NOT USE ENGLISH AT ALL IN THE RESPONSE TEXT.

For each match, provide ONE complete paragraph (150-200 words) FULLY IN BANGLA explaining why they are compatible.

CRITICAL REQUIREMENTS FOR BENGALI TEXT:
1. Start each explanation with "আপনি এবং [match_name] এর মধ্যে [score]% মিল রয়েছে।" (with score in Bengali numerals)
2. Use the match's actual name throughout, not "Match" or generic terms
3. Write in a warm, formal Bengali tone that sounds like friendly expert advice
4. Make sure the ENTIRE response is in Bengali, with ALL NUMBERS in Bengali numerals (০১২৩৪৫৬৭৮৯)
5. Each explanation MUST have a properly completed final sentence with conclusion
6. Explicitly mention personality trait scores in Bengali (e.g., উন্মুক্ততা: ৩/৫)
7. Explain how specific traits complement each other
8. Use proper Bengali grammar and complete sentences throughout
9. NEVER use English words or Latin numerals
10. NEVER use "আমরা" or "আমাদের" (we/our) - use "আপনি" (formal you) and "তিনি/তাঁর" (he/she/they)

Return in this JSON format with FULLY BANGLA explanations:
{
  "matches": [
    {"userId": "match1_id", "reason": "আপনি এবং [name] এর মধ্যে [score]% মিল রয়েছে... [FULL COMPLETE RESPONSE IN BANGLA WITH PROPER CONCLUSION]"},
    {"userId": "match2_id", "reason": "আপনি এবং [name] এর মধ্যে [score]% মিল রয়েছে... [FULL COMPLETE RESPONSE IN BANGLA WITH PROPER CONCLUSION]"},
    {"userId": "match3_id", "reason": "আপনি এবং [name] এর মধ্যে [score]% মিল রয়েছে... [FULL COMPLETE RESPONSE IN BANGLA WITH PROPER CONCLUSION]"}
  ]
}`;
}

// Generate a reason using a simplified OpenAI request for a single match
async function generateAIReason(
  currentUser: any,
  candidate: any,
  score: CompatibilityScore
): Promise<string> {
  // Use template system if enabled
  if (USE_TEMPLATE_SYSTEM) {
    return generateTemplateReason(currentUser, candidate, score);
  }

  try {
    const candidateAnswers = candidate.personalityQuiz?.answers || {};
    const userAnswers = currentUser.personalityQuiz?.answers || {};

    // Extract key information for an optimized prompt that focuses on interests and specifics
    const candidateName = candidateAnswers.profile_1 || "এই ব্যক্তি"; // "This person" in Bangla

    // Extract only relevant information to save tokens
    const userHobbies = (userAnswers.profile_12 || "")
      .split(",")
      .map((h: string) => h.trim());

    const candidateHobbies = (candidateAnswers.profile_12 || "")
      .split(",")
      .map((h: string) => h.trim());

    // Find shared hobbies - this is important for a specific analysis
    const sharedHobbies = userHobbies.filter((hobby: string) =>
      candidateHobbies.some(
        (candidateHobby: string) =>
          candidateHobby.toLowerCase().includes(hobby.toLowerCase()) ||
          hobby.toLowerCase().includes(candidateHobby.toLowerCase())
      )
    );

    // Get match details for more specific analysis
    const personalityMatchScore = score.matchDetails?.personalityScore || 0;
    const attachmentMatchScore = score.matchDetails?.attachmentScore || 0;
    const hobbiesMatchScore = score.matchDetails?.hobbiesScore || 0;

    // Create traits comparison for more specific analysis
    const userTraits = getPersonalityTraits(userAnswers);
    const candidateTraits = getPersonalityTraits(candidateAnswers);

    // Create a more focused and concise prompt for GPT-3.5 Turbo
    const optimizedPrompt = `
Write a high-quality, accurate paragraph in FORMAL BENGALI (Bangla) explaining compatibility between two people based on the SPECIFIC details below.

Start with: "আপনি এবং ${candidateName} এর মধ্যে ${score.score.toFixed(
      1
    )}% মিল রয়েছে।"

MATCH SPECIFICS:
- User: ${userAnswers.profile_1 || "User"}, ${
      userAnswers.profile_5 || "Not specified"
    }
- Match: ${candidateName}, ${candidateAnswers.profile_5 || "Not specified"}
- Overall Compatibility: ${score.score.toFixed(1)}%
- Personality Match: ${personalityMatchScore.toFixed(1)}%
- Attachment Style Match: ${attachmentMatchScore.toFixed(1)}%
- Hobbies Match: ${hobbiesMatchScore.toFixed(1)}%

SHARED INTERESTS: ${
      sharedHobbies.length > 0
        ? sharedHobbies.join(", ")
        : "Few shared interests found"
    }

USER TRAITS vs MATCH TRAITS (scale 1-5):
- Openness: ${userTraits.openness} vs ${candidateTraits.openness}
- Conscientiousness: ${userTraits.conscientiousness} vs ${
      candidateTraits.conscientiousness
    }
- Extraversion: ${userTraits.extraversion} vs ${candidateTraits.extraversion}
- Agreeableness: ${userTraits.agreeableness} vs ${candidateTraits.agreeableness}
- Neuroticism: ${userTraits.neuroticism} vs ${candidateTraits.neuroticism}
- SecureAttachment: ${userTraits.secureAttachment} vs ${
      candidateTraits.secureAttachment
    }
- AnxiousAttachment: ${userTraits.anxiousAttachment} vs ${
      candidateTraits.anxiousAttachment
    }

CRITICAL REQUIREMENTS:
1. You MUST specifically mention trait scores, shared interests, and compatibility percentages in Bengali
2. Use "আপনি" (formal you) when addressing the user, "তিনি/তাঁর" for the match
3. NEVER use "আমরা" or "আমাদের" (we/our)
4. Write 100% in proper Bengali with CORRECT GRAMMAR - NO ENGLISH terms at all
5. Use Bengali numerals (৩/৫) when mentioning trait scores - all numbers must be in Bengali digits: ০১২৩৪৫৬৭৮৯
6. Mention SPECIFIC personality traits that complement each other
7. Explain WHY these traits create compatibility with specific examples
8. Complete the response with full, grammatically correct sentences
9. Use formal, polished Bengali throughout
10. EVERY response must have a clear conclusion with a completed final sentence
11. Keep the total length between 150-200 words to ensure a complete message

BAD OUTPUT EXAMPLE (DO NOT WRITE LIKE THIS):
"আপনি এবং এই ব্যক্তি এর মধ্যে 75.5% মিল রয়েছে। আপনাদের একই অত্যন্ত ভাল লেগেছে..."

GOOD OUTPUT EXAMPLE:
"আপনি এবং রহিম এর মধ্যে ৮০% মিল রয়েছে। আপনাদের উভয়ের সাহিত্য ও সংগীতের প্রতি আগ্রহ একটি শক্তিশালী বন্ধন তৈরি করবে। আপনার উচ্চ মাত্রার উন্মুক্ততা (৪/৫) এবং তাঁর সচেতনতা (৪/৫) একে অপরকে পরিপূরক করে, যা দীর্ঘস্থায়ী সম্পর্কের জন্য দরকারী। আপনি নতুন ধারণা এবং অভিজ্ঞতার প্রতি আগ্রহী, আর তিনি সংগঠিত ও দায়িত্বশীল - এই মিশ্রণ আপনাদের সম্পর্ককে ভারসাম্যপূর্ণ করবে। এই সামঞ্জস্যপূর্ণ সম্পর্কের মাধ্যমে আপনারা উভয়েই একে অপরের জীবনকে সমৃদ্ধ করতে পারবেন।"`;

    // Use GPT-4 Turbo for higher quality
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Use a more capable model for high-quality Bangla
      messages: [
        {
          role: "system",
          content:
            "You are a highly skilled Bengali matchmaker and language expert who produces flawless, natural-sounding Bengali text. You must analyze specific compatibility factors between people and explain them in perfect formal Bengali. Always use আপনি (formal you) and তিনি/তাঁর (he/she/they). Never use আমরা/আমাদের. Your Bengali must be grammatically perfect with complete sentences.",
        },
        {
          role: "user",
          content: optimizedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800, // Increased token limit to ensure complete responses
    });

    const content = response.choices[0].message.content;

    // Basic quality checks
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // If we got a response with English or perspective errors, try again with GPT-3.5
    if (/আমরা|আমাদের/.test(content) || /[a-zA-Z]{3,}/.test(content)) {
      console.log("Quality check failed, retrying with different model");

      // Retry with GPT-3.5-turbo
      const retryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125", // Fallback to this model
        messages: [
          {
            role: "system",
            content:
              "You are a Bengali matchmaker who must write PERFECT FORMAL BENGALI with NO ENGLISH. Focus on formal Bengali (আপনি) and third person (তিনি/তাঁর). Never use আমরা/আমাদের. Your task is to generate a compatibility explanation in flawless Bengali.",
          },
          {
            role: "user",
            content:
              optimizedPrompt +
              "\n\nIMPORTANT: The response MUST be 100% in Bengali with NO ENGLISH words.",
          },
        ],
        temperature: 0.5,
        max_tokens: 800, // Increased token limit to ensure complete responses
      });

      const retryContent = retryResponse.choices[0].message.content;
      if (retryContent && !/[a-zA-Z]{3,}/.test(retryContent)) {
        return retryContent.trim();
      }

      // If retry fails, generate a simple but correct Bengali message
      const fallbackMessage = `আপনি এবং ${candidateName} এর মধ্যে ${score.score.toFixed(
        1
      )}% মিল রয়েছে। আপনাদের ব্যক্তিত্বের মিলে একটি সুখী সম্পর্কের সম্ভাবনা দেখা যাচ্ছে। আপনার উন্মুক্ততা (${
        userTraits.openness
      }/৫) এবং তাঁর উন্মুক্ততা (${
        candidateTraits.openness
      }/৫) সমন্বয়ে আপনাদের সম্পর্ক গভীর হতে পারে।`;
      return fallbackMessage;
    }

    return content.trim();
  } catch (error) {
    console.error("Error generating AI reason:", error);

    // If we encounter an error with OpenAI, fall back to template
    return generateTemplateReason(currentUser, candidate, score);
  }
}

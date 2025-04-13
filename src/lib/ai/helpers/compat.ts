/**
 * Compatibility helper functions
 *
 * This file exports AI functions from our template-based system
 * instead of the OpenAI API to save costs
 */

// Re-export the AI functions from our new module
export {
  analyzeTopMatches,
  generateAIReason,
  generateMatchExplanation,
  batchAnalyzeCompatibility,
} from "@/lib/ai";

// If there's a batchAnalyzeCompatibility function needed, you can add it here later

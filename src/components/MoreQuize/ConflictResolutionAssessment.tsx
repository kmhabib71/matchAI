"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConflictResolutionAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export default function ConflictResolutionAssessment({
  isOpen,
  onClose,
  onComplete,
}: ConflictResolutionAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({
    constructiveCommunication: 0,
    validation: 0,
    compromise: 0,
    repairAttempts: 0,
    criticism: 0,
    contempt: 0,
    defensiveness: 0,
    stonewalling: 0,
  });
  const [engagementScore, setEngagementScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Questions based on Gottman's research
  const questions = [
    // Constructive Communication Questions
    {
      id: 1,
      question:
        "When you disagree with someone, how likely are you to express your feelings calmly and directly?",
      category: "constructiveCommunication",
      type: "scale",
      labels: ["Not likely", "Very likely"],
      positive: true,
    },
    {
      id: 2,
      question:
        "How often do you use 'I' statements rather than 'You' statements during conflicts?",
      category: "constructiveCommunication",
      type: "scale",
      labels: ["Rarely", "Always"],
      positive: true,
    },

    // Validation Questions
    {
      id: 3,
      question:
        "Do you try to understand your partner's point of view, even if you don't agree?",
      category: "validation",
      type: "scale",
      labels: ["Rarely", "Always"],
      positive: true,
    },
    {
      id: 4,
      question:
        "How often do you acknowledge your partner's feelings during disagreements?",
      category: "validation",
      type: "scale",
      labels: ["Rarely", "Always"],
      positive: true,
    },

    // Compromise Questions
    {
      id: 5,
      question:
        "How willing are you to meet a partner halfway during an argument?",
      category: "compromise",
      type: "scale",
      labels: ["Not willing", "Very willing"],
      positive: true,
    },
    {
      id: 6,
      question:
        "How often do you prioritize finding a solution that works for both people?",
      category: "compromise",
      type: "scale",
      labels: ["Rarely", "Always"],
      positive: true,
    },

    // Repair Attempts Questions
    {
      id: 7,
      question:
        "After a fight, how often do you try to lighten the mood or apologize to reconnect?",
      category: "repairAttempts",
      type: "scale",
      labels: ["Never", "Often"],
      positive: true,
    },
    {
      id: 8,
      question:
        "How likely are you to be the first to reach out after a disagreement?",
      category: "repairAttempts",
      type: "scale",
      labels: ["Not likely", "Very likely"],
      positive: true,
    },

    // Four Horsemen: Criticism
    {
      id: 9,
      question:
        "Do you tend to blame your partner's character (e.g., 'You're so selfish') rather than the situation?",
      category: "criticism",
      type: "scale",
      labels: ["Never", "Frequently"],
      positive: false,
    },
    {
      id: 10,
      question:
        "How often do you find yourself using phrases like 'you always' or 'you never' during arguments?",
      category: "criticism",
      type: "scale",
      labels: ["Never", "Frequently"],
      positive: false,
    },

    // Four Horsemen: Contempt
    {
      id: 11,
      question:
        "How often do you feel superior or sarcastic toward a partner during conflict?",
      category: "contempt",
      type: "scale",
      labels: ["Never", "Frequently"],
      positive: false,
    },
    {
      id: 12,
      question:
        "Do you ever mock or use hostile humor toward your partner during disagreements?",
      category: "contempt",
      type: "scale",
      labels: ["Never", "Frequently"],
      positive: false,
    },

    // Four Horsemen: Defensiveness
    {
      id: 13,
      question:
        "When criticized, do you usually make excuses or counterattack?",
      category: "defensiveness",
      type: "scale",
      labels: ["Never", "Always"],
      positive: false,
    },
    {
      id: 14,
      question:
        "How often do you respond to complaints by defending yourself instead of listening?",
      category: "defensiveness",
      type: "scale",
      labels: ["Never", "Always"],
      positive: false,
    },

    // Four Horsemen: Stonewalling
    {
      id: 15,
      question: "Do you shut down or withdraw during arguments?",
      category: "stonewalling",
      type: "scale",
      labels: ["Never", "Frequently"],
      positive: false,
    },
    {
      id: 16,
      question:
        "How often do you physically or emotionally distance yourself during conflicts?",
      category: "stonewalling",
      type: "scale",
      labels: ["Never", "Frequently"],
      positive: false,
    },
  ];

  // Handle answer selection
  const handleAnswerSelect = (value: number) => {
    // Update scores based on the current question's category and whether it's positive or negative
    const currentQ = questions[currentQuestion];
    const category = currentQ.category as keyof typeof scores;

    // For negative traits (Four Horsemen), we invert the score (5 becomes 1, 4 becomes 2, etc.)
    const adjustedValue = currentQ.positive ? value : 6 - value;

    setScores((prev) => ({
      ...prev,
      [category]: prev[category] + adjustedValue,
    }));

    // Increase engagement score
    setEngagementScore((prev) => prev + 5);

    // Move to next question or complete
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
      // Process and calculate the conflict resolution profile
      processAndSubmitData();
    }
  };

  // Process and calculate insights from answers
  const processAndSubmitData = () => {
    // Normalize scores to percentages
    const maxPossibleScorePositive = 10; // 2 questions per positive category × max score of 5
    const maxPossibleScoreNegative = 10; // 2 questions per negative category × max score of 5

    const normalizedScores = {
      // Positive traits (higher is better)
      constructiveCommunication: Math.round(
        (scores.constructiveCommunication / maxPossibleScorePositive) * 100
      ),
      validation: Math.round(
        (scores.validation / maxPossibleScorePositive) * 100
      ),
      compromise: Math.round(
        (scores.compromise / maxPossibleScorePositive) * 100
      ),
      repairAttempts: Math.round(
        (scores.repairAttempts / maxPossibleScorePositive) * 100
      ),

      // Negative traits (Four Horsemen) - higher is better (means less of the negative trait)
      criticism: Math.round(
        (scores.criticism / maxPossibleScoreNegative) * 100
      ),
      contempt: Math.round((scores.contempt / maxPossibleScoreNegative) * 100),
      defensiveness: Math.round(
        (scores.defensiveness / maxPossibleScoreNegative) * 100
      ),
      stonewalling: Math.round(
        (scores.stonewalling / maxPossibleScoreNegative) * 100
      ),
    };

    // Calculate overall conflict resolution style
    const positiveTraitsAvg =
      (normalizedScores.constructiveCommunication +
        normalizedScores.validation +
        normalizedScores.compromise +
        normalizedScores.repairAttempts) /
      4;

    const negativeTraitsAvg =
      (normalizedScores.criticism +
        normalizedScores.contempt +
        normalizedScores.defensiveness +
        normalizedScores.stonewalling) /
      4;

    // Determine primary conflict style
    const conflictStyle = determineConflictStyle(normalizedScores);

    // Generate insights
    const insights = generateInsights(conflictStyle, normalizedScores);

    // Calculate relationship health indicators
    const relationshipHealthIndicators = {
      overall: Math.round(positiveTraitsAvg * 0.6 + negativeTraitsAvg * 0.4),
      communicationEffectiveness: Math.round(
        normalizedScores.constructiveCommunication * 0.4 +
          normalizedScores.validation * 0.3 +
          normalizedScores.criticism * 0.3
      ),
      emotionalSafety: Math.round(
        normalizedScores.validation * 0.3 +
          normalizedScores.contempt * 0.4 +
          normalizedScores.repairAttempts * 0.3
      ),
      compromiseAbility: Math.round(
        normalizedScores.compromise * 0.6 + normalizedScores.defensiveness * 0.4
      ),
    };

    // Final data to return
    const assessmentData = {
      conflictStyle: conflictStyle,
      scores: normalizedScores,
      insights: insights,
      relationshipHealthIndicators: relationshipHealthIndicators,
      matchingRecommendations: generateMatchingRecommendations(
        conflictStyle,
        normalizedScores
      ),
    };

    // Call the onComplete callback with processed data
    onComplete(assessmentData);
  };

  // Determine primary conflict resolution style
  const determineConflictStyle = (scores: any) => {
    // Calculate average scores for different aspects
    const positiveTraits =
      (scores.constructiveCommunication +
        scores.validation +
        scores.compromise +
        scores.repairAttempts) /
      4;

    const negativeTraits =
      (scores.criticism +
        scores.contempt +
        scores.defensiveness +
        scores.stonewalling) /
      4;

    // Determine style based on combinations of scores
    if (positiveTraits >= 80 && negativeTraits >= 80) {
      return "constructive"; // High positive, low negative (high negative score means less of the trait)
    } else if (positiveTraits >= 60 && negativeTraits >= 60) {
      return "effective";
    } else if (positiveTraits >= 60 && negativeTraits < 60) {
      return "volatile"; // Good at positive interactions but struggles with negative patterns
    } else if (positiveTraits < 60 && negativeTraits >= 60) {
      return "avoidant"; // Avoids negative patterns but lacks positive skills
    } else {
      return "distressed"; // Struggles with both positive skills and negative patterns
    }
  };

  // Generate insights based on conflict style
  const generateInsights = (style: string, scores: any) => {
    const insights = {
      summary: "",
      strengths: [] as string[],
      challenges: [] as string[],
      growthAreas: [] as string[],
    };

    // Add specific strengths based on high scores
    if (scores.constructiveCommunication >= 70) {
      insights.strengths.push(
        "Expressing feelings directly and calmly during conflicts"
      );
    }
    if (scores.validation >= 70) {
      insights.strengths.push(
        "Listening to and validating your partner's perspective"
      );
    }
    if (scores.compromise >= 70) {
      insights.strengths.push("Finding mutually acceptable solutions");
    }
    if (scores.repairAttempts >= 70) {
      insights.strengths.push("Reconnecting after disagreements");
    }

    // Add challenges based on low scores in positive traits
    if (scores.constructiveCommunication < 50) {
      insights.challenges.push(
        "Communicating clearly during emotional moments"
      );
    }
    if (scores.validation < 50) {
      insights.challenges.push(
        "Understanding your partner's perspective fully"
      );
    }
    if (scores.compromise < 50) {
      insights.challenges.push("Finding middle ground in disagreements");
    }
    if (scores.repairAttempts < 50) {
      insights.challenges.push("Taking steps to reconnect after conflicts");
    }

    // Add challenges based on presence of the Four Horsemen
    if (scores.criticism < 50) {
      insights.challenges.push(
        "Avoiding personal criticism during disagreements"
      );
      insights.growthAreas.push(
        "Practice using specific complaints rather than criticism of character"
      );
    }
    if (scores.contempt < 50) {
      insights.challenges.push("Managing feelings of superiority or sarcasm");
      insights.growthAreas.push(
        "Focus on building a culture of appreciation and respect"
      );
    }
    if (scores.defensiveness < 50) {
      insights.challenges.push("Receiving feedback without becoming defensive");
      insights.growthAreas.push(
        "Practice accepting responsibility and validating concerns"
      );
    }
    if (scores.stonewalling < 50) {
      insights.challenges.push(
        "Staying engaged during difficult conversations"
      );
      insights.growthAreas.push(
        "Learn to recognize when you're feeling flooded and request timeouts"
      );
    }

    // Summary based on conflict style
    switch (style) {
      case "constructive":
        insights.summary =
          "You demonstrate a highly constructive conflict resolution style. You excel at expressing your feelings appropriately while also validating your partner's perspective. You rarely engage in harmful communication patterns.";
        break;

      case "effective":
        insights.summary =
          "Your conflict resolution approach is generally effective. You balance expressing your needs with understanding your partner, though there may be specific areas for growth.";
        break;

      case "volatile":
        insights.summary =
          "Your conflict style shows strengths in positive communication, but you may sometimes fall into negative patterns during intense disagreements. Learning to manage these challenging moments could significantly improve your relationships.";
        break;

      case "avoidant":
        insights.summary =
          "You tend to avoid destructive conflict behaviors, which is valuable, but you may also be hesitant to engage in necessary discussions or express your true feelings. Developing more comfort with productive conflict could strengthen your connections.";
        break;

      case "distressed":
        insights.summary =
          "Your conflict resolution patterns show some areas that may be creating difficulty in relationships. The good news is that these patterns can be changed with awareness and practice, leading to more satisfying connections.";
        break;
    }

    return insights;
  };

  // Generate matching recommendations
  const generateMatchingRecommendations = (style: string, scores: any) => {
    switch (style) {
      case "constructive":
        return "Your constructive approach to conflict makes you compatible with a wide range of partners. You'll likely thrive with someone who also values open communication and mutual respect. Your skills can help create a relationship with a strong foundation of trust.";

      case "effective":
        return "Your generally effective conflict style means you can build healthy relationships with most partners who are willing to work through disagreements. Look for someone who appreciates your communication strengths and supports growth in challenging areas.";

      case "volatile":
        return "Your strengths in positive communication are valuable, but be mindful of how negative patterns might impact a relationship. You may connect well with partners who are patient and can help you maintain perspective during heated moments. Avoid partners who escalate conflicts.";

      case "avoidant":
        return "Your tendency to avoid harmful conflict behaviors serves you well, but you might benefit from a partner who gently encourages more open expression. Look for someone who creates emotional safety for discussing difficult topics.";

      case "distressed":
        return "As you work on developing healthier conflict patterns, seek partners who are patient, non-judgmental, and committed to their own growth. Avoid relationships that trigger your most challenging responses. Consider whether relationship coaching might be beneficial.";

      default:
        return "Based on your unique conflict resolution style, look for partners who complement your communication approach and are committed to working through differences respectfully.";
    }
  };

  // Reset and close
  const handleClose = () => {
    setCurrentQuestion(0);
    setScores({
      constructiveCommunication: 0,
      validation: 0,
      compromise: 0,
      repairAttempts: 0,
      criticism: 0,
      contempt: 0,
      defensiveness: 0,
      stonewalling: 0,
    });
    setEngagementScore(0);
    setIsComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-blue-50 z-50 flex items-center justify-center overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full h-auto max-h-[90vh] overflow-y-auto relative p-6">
        {/* Header with progress indicator */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-indigo-800">
              {isComplete
                ? "Your Conflict Resolution Profile"
                : "Understanding Your Conflict Style"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress indicator */}
          {!isComplete && (
            <div className="flex items-center mt-4">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestion + 1) / questions.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-gray-600 font-medium text-sm">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
          )}
        </div>

        {/* Engagement score */}
        <div className="absolute top-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          ✨ {engagementScore} points
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key={`question-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="py-4"
            >
              {/* Current question */}
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">
                  {questions[currentQuestion].question}
                </h3>

                {/* Rating scale */}
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{questions[currentQuestion].labels[0]}</span>
                    <span>{questions[currentQuestion].labels[1]}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleAnswerSelect(value)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center"
                      >
                        <span className="text-xl font-bold text-indigo-600">
                          {value}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Your Conflict Resolution Assessment is Complete!
              </h3>

              <p className="text-gray-600 mb-8">
                We've analyzed your responses and created personalized insights
                about how you handle relationship disagreements.
              </p>

              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <p className="text-indigo-800 font-medium">
                  You've earned premium matching features for the next 7 days!
                </p>
              </div>

              <button
                onClick={handleClose}
                className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white py-3 px-8 rounded-full font-semibold hover:from-indigo-700 hover:to-purple-600 transition-all"
              >
                See My Matches
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

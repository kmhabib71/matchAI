"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AttachmentStylesAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export default function AttachmentStylesAssessment({
  isOpen,
  onClose,
  onComplete,
}: AttachmentStylesAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({
    secure: 0,
    anxious: 0,
    avoidant: 0,
    fearfulAvoidant: 0,
  });
  const [engagementScore, setEngagementScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Questions based on attachment theory research
  const questions = [
    // Secure Attachment Questions
    {
      id: 1,
      question:
        "I feel comfortable relying on others and having them rely on me",
      category: "secure",
      type: "scale",
      labels: ["Not at all", "Very much"],
    },
    {
      id: 2,
      question: "I find it easy to trust a partner in a relationship",
      category: "secure",
      type: "scale",
      labels: ["Not at all", "Very much"],
    },
    {
      id: 3,
      question:
        "I'm generally comfortable with both emotional closeness and independence",
      category: "secure",
      type: "scale",
      labels: ["Not at all", "Very much"],
    },

    // Anxious Attachment Questions
    {
      id: 4,
      question: "I worry that my partner might leave me or doesn't care enough",
      category: "anxious",
      type: "scale",
      labels: ["Rarely", "Constantly"],
    },
    {
      id: 5,
      question:
        "I need frequent reassurance from my partner about their feelings",
      category: "anxious",
      type: "scale",
      labels: ["Rarely", "Constantly"],
    },
    {
      id: 6,
      question:
        "I sometimes feel that I want more closeness than my partner provides",
      category: "anxious",
      type: "scale",
      labels: ["Rarely", "Constantly"],
    },

    // Avoidant Attachment Questions
    {
      id: 7,
      question:
        "I prefer to maintain my independence rather than get too close to someone",
      category: "avoidant",
      type: "scale",
      labels: ["Not at all", "Very much"],
    },
    {
      id: 8,
      question:
        "I feel uncomfortable when a partner wants to discuss deep emotions with me",
      category: "avoidant",
      type: "scale",
      labels: ["Very comfortable", "Very uncomfortable"],
    },
    {
      id: 9,
      question: "I tend to keep emotional distance in relationships",
      category: "avoidant",
      type: "scale",
      labels: ["Not at all", "Very much"],
    },

    // Fearful-Avoidant Attachment Questions
    {
      id: 10,
      question: "I feel torn between wanting closeness and being afraid of it",
      category: "fearfulAvoidant",
      type: "scale",
      labels: ["Never", "Frequently"],
    },
    {
      id: 11,
      question: "I push people away even though I want them to stay",
      category: "fearfulAvoidant",
      type: "scale",
      labels: ["Never", "Frequently"],
    },
    {
      id: 12,
      question:
        "I desire close relationships but find it difficult to trust others completely",
      category: "fearfulAvoidant",
      type: "scale",
      labels: ["Not at all", "Very much"],
    },
  ];

  // Handle answer selection
  const handleAnswerSelect = (value: number) => {
    // Update scores based on the current question's category
    const currentQ = questions[currentQuestion];
    const category = currentQ.category as keyof typeof scores;

    setScores((prev) => ({
      ...prev,
      [category]: prev[category] + value,
    }));

    // Increase engagement score
    setEngagementScore((prev) => prev + 5);

    // Move to next question or complete
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
      // Process and calculate the attachment style
      processAndSubmitData();
    }
  };

  // Process and calculate insights from answers
  const processAndSubmitData = () => {
    // Calculate highest scoring attachment style
    const attachmentStyles = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primaryStyle = attachmentStyles[0][0];
    const secondaryStyle = attachmentStyles[1][0];

    // Normalize scores to percentages
    const maxPossibleScore = 15; // 3 questions per category × max score of 5
    const normalizedScores = {
      secure: Math.round((scores.secure / maxPossibleScore) * 100),
      anxious: Math.round((scores.anxious / maxPossibleScore) * 100),
      avoidant: Math.round((scores.avoidant / maxPossibleScore) * 100),
      fearfulAvoidant: Math.round(
        (scores.fearfulAvoidant / maxPossibleScore) * 100
      ),
    };

    // Generate insights based on attachment style
    const insights = generateInsights(
      primaryStyle,
      secondaryStyle,
      normalizedScores
    );

    // Calculate compatibility metrics
    const compatibilityMetrics = {
      secureCompatibility: calculateSecureCompatibility(normalizedScores),
      emotionalIntimacy: calculateEmotionalIntimacy(normalizedScores),
      independenceBalance: calculateIndependenceBalance(normalizedScores),
    };

    // Final data to return
    const assessmentData = {
      primaryAttachmentStyle: primaryStyle,
      secondaryAttachmentStyle: secondaryStyle,
      scores: normalizedScores,
      insights: insights,
      compatibilityMetrics: compatibilityMetrics,
      matchingSuggestions: generateMatchingSuggestions(primaryStyle),
    };

    // Call the onComplete callback with processed data
    onComplete(assessmentData);
  };

  // Generate insights based on attachment styles
  const generateInsights = (
    primary: string,
    secondary: string,
    scores: any
  ) => {
    const insights = {
      summary: "",
      strengths: [],
      challenges: [],
      relationshipDynamics: "",
    };

    // Summary based on primary attachment style
    switch (primary) {
      case "secure":
        insights.summary =
          "You show traits of a secure attachment style, meaning you're likely comfortable with both closeness and independence. This flexibility can make you compatible with most partners.";
        insights.strengths = [
          "Comfort with both intimacy and autonomy",
          "Ability to communicate needs effectively",
          "Resilience during relationship challenges",
        ];
        insights.challenges = [
          "May become frustrated with partners who have difficulty expressing needs",
          "Might need to practice patience with anxious or avoidant partners",
        ];
        insights.relationshipDynamics =
          "You tend to create balanced, healthy relationships based on mutual trust and respect.";
        break;

      case "anxious":
        insights.summary =
          "Your responses suggest an anxious attachment style, where you might benefit from a partner who offers consistent reassurance.";
        insights.strengths = [
          "Deep commitment to relationships",
          "High emotional awareness",
          "Attentiveness to partner's needs",
        ];
        insights.challenges = [
          "Tendency to worry about abandonment",
          "May seek excessive reassurance",
          "Risk of becoming emotionally dependent",
        ];
        insights.relationshipDynamics =
          "You thrive with partners who provide consistent affection and reassurance without feeling overwhelmed by your emotional needs.";
        break;

      case "avoidant":
        insights.summary =
          "You display characteristics of an avoidant attachment style, valuing independence and sometimes finding close emotional intimacy challenging.";
        insights.strengths = [
          "Self-reliance and independence",
          "Ability to maintain boundaries",
          "Less likely to be clingy or dependent",
        ];
        insights.challenges = [
          "Difficulty expressing emotional needs",
          "Tendency to withdraw during conflict",
          "May keep partners at emotional distance",
        ];
        insights.relationshipDynamics =
          "You work well with partners who respect your need for space while gently encouraging emotional connection.";
        break;

      case "fearfulAvoidant":
        insights.summary =
          "Your answers indicate a fearful-avoidant attachment style, characterized by both desiring and fearing close relationships.";
        insights.strengths = [
          "Deep capacity for emotional reflection",
          "Sensitivity to others' feelings",
          "Awareness of relationship dynamics",
        ];
        insights.challenges = [
          "Inner conflict between wanting closeness and fearing rejection",
          "Unpredictable responses to intimacy",
          "Difficulty establishing consistent trust",
        ];
        insights.relationshipDynamics =
          "You benefit most from patient partners who maintain consistent, predictable behavior and respect both your need for connection and space.";
        break;
    }

    // Add influence of secondary style
    if (secondary && Math.abs(scores[primary] - scores[secondary]) < 20) {
      insights.summary += ` You also show some characteristics of a ${formatStyleName(
        secondary
      )} attachment style, which adds complexity to your relationship patterns.`;
    }

    return insights;
  };

  // Format attachment style name for display
  const formatStyleName = (style: string) => {
    switch (style) {
      case "secure":
        return "secure";
      case "anxious":
        return "anxious";
      case "avoidant":
        return "avoidant";
      case "fearfulAvoidant":
        return "fearful-avoidant";
      default:
        return style;
    }
  };

  // Calculate compatibility metrics
  const calculateSecureCompatibility = (scores: any) => {
    return scores.secure > 70 ? 90 : scores.secure;
  };

  const calculateEmotionalIntimacy = (scores: any) => {
    // Higher for secure and anxious, lower for avoidant
    return Math.round(
      scores.secure * 0.6 + scores.anxious * 0.4 - scores.avoidant * 0.3
    );
  };

  const calculateIndependenceBalance = (scores: any) => {
    // Higher for secure and avoidant, lower for anxious
    return Math.round(
      scores.secure * 0.5 + scores.avoidant * 0.3 - scores.anxious * 0.2
    );
  };

  // Generate matching suggestions based on attachment style
  const generateMatchingSuggestions = (primaryStyle: string) => {
    switch (primaryStyle) {
      case "secure":
        return "You're compatible with most attachment styles. You'll likely form the most balanced relationship with another secure partner, but you also have the flexibility to understand and support anxious or avoidant partners.";

      case "anxious":
        return "You'll likely find the most stability with secure partners who can provide the reassurance you value without feeling overwhelmed. Relationships with avoidant partners may be challenging without mutual understanding and growth.";

      case "avoidant":
        return "You may connect well with partners who respect your independence while still maintaining emotional intimacy. Secure partners can help you find this balance, while relationships with anxious partners might require more conscious communication.";

      case "fearfulAvoidant":
        return "You benefit most from relationships with secure partners who can provide consistency and patience. With awareness and possibly therapeutic support, you can develop more secure attachment patterns over time.";

      default:
        return "Based on your unique attachment profile, look for partners who appreciate your relationship approach and complement your strengths and challenges.";
    }
  };

  // Reset and close
  const handleClose = () => {
    setCurrentQuestion(0);
    setScores({
      secure: 0,
      anxious: 0,
      avoidant: 0,
      fearfulAvoidant: 0,
    });
    setEngagementScore(0);
    setIsComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 z-50 flex items-center justify-center overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full h-auto max-h-[90vh] overflow-y-auto relative p-6">
        {/* Header with progress indicator */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-indigo-800">
              {isComplete
                ? "Your Attachment Style Assessment"
                : "Understanding Your Attachment Style"}
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
                Your Attachment Style Assessment is Complete!
              </h3>

              <p className="text-gray-600 mb-8">
                We've analyzed your responses and created personalized insights
                to help you understand your relationship patterns.
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

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RelationshipInsightsProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export default function RelationshipInsights({
  isOpen,
  onClose,
  onComplete,
}: RelationshipInsightsProps) {
  const [activeSection, setActiveSection] = useState<
    "conflict" | "values" | "attachment" | "complete"
  >("conflict");

  const [answers, setAnswers] = useState({
    conflict: {},
    values: {},
    attachment: {},
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);

  // Conflict Resolution Questions
  const conflictQuestions = [
    {
      id: 1,
      question: "When disagreements arise, how do you typically respond?",
      options: [
        "I address issues directly and calmly",
        "I need time to process before discussing",
        "I prefer to avoid direct confrontation",
        "I express my feelings immediately and intensely",
      ],
      type: "card-select",
      insight: "conflict_style",
      mapping: {
        "I address issues directly and calmly": "assertive",
        "I need time to process before discussing": "reflective",
        "I prefer to avoid direct confrontation": "avoidant",
        "I express my feelings immediately and intensely": "expressive",
      },
    },
    {
      id: 2,
      question: "Which scenario would make you most uncomfortable?",
      options: [
        "Your partner raises their voice during disagreements",
        "Your partner doesn't share how they feel about important issues",
        "Your partner wants to discuss problems immediately when upset",
        "Your partner analyzes every detail of a disagreement",
      ],
      type: "image-select",
      insight: "conflict_triggers",
      imageSet: "conflict_scenarios",
    },
    {
      id: 3,
      question: "After a disagreement, what helps you reconnect with someone?",
      options: [
        "Having a calm conversation about what happened",
        "Spending quality time together without discussing the issue",
        "Receiving an apology or acknowledgment",
        "Having some space and time apart first",
      ],
      type: "priority-rank",
      insight: "reconciliation_pattern",
    },
  ];

  // Shared Values Questions
  const valuesQuestions = [
    {
      id: 1,
      question:
        "Which of these would be most important in your ideal relationship?",
      options: [
        "Growth and personal development",
        "Stability and security",
        "Adventure and new experiences",
        "Tradition and established routines",
      ],
      type: "forced-choice",
      insight: "relationship_values",
      followUp: "Why is this particularly meaningful to you?",
    },
    {
      id: 2,
      question: "Rate how important these factors are in a relationship:",
      options: [
        "Financial compatibility",
        "Shared religious/spiritual views",
        "Similar approaches to family",
        "Aligned life goals and ambitions",
      ],
      type: "slider-grid",
      insight: "value_priorities",
    },
    {
      id: 3,
      question:
        "Which statement best reflects your view on independence in relationships?",
      options: [
        "Partners should maintain separate interests and friendships",
        "Partners should share most activities and friends",
        "Balance between togetherness and independence is ideal",
        "Partners should be each other's primary focus",
      ],
      type: "card-select",
      insight: "independence_value",
    },
  ];

  // Attachment Style Questions
  const attachmentQuestions = [
    {
      id: 1,
      question: "In romantic relationships, I tend to:",
      options: [
        "Worry my partner doesn't care as much as I do",
        "Feel comfortable with closeness and independence",
        "Prefer maintaining some emotional distance",
        "Both desire and fear getting too close",
      ],
      type: "scenario-based",
      insight: "attachment_pattern",
    },
    {
      id: 2,
      question: "When your partner needs space, you typically feel:",
      options: [
        "Anxious or rejected",
        "Understanding and patient",
        "Relieved to have your own space too",
        "Confused about what they really want",
      ],
      type: "emoji-react",
      insight: "space_response",
      emojiSet: "emotional_reactions",
    },
    {
      id: 3,
      question: "When something is bothering you, you're most likely to:",
      options: [
        "Share it with your partner immediately",
        "Process it yourself first, then discuss if needed",
        "Keep it to yourself unless directly asked",
        "Drop hints but avoid direct discussion",
      ],
      type: "card-select",
      insight: "disclosure_style",
    },
  ];

  // Get current questions based on active section
  const getCurrentQuestions = () => {
    switch (activeSection) {
      case "conflict":
        return conflictQuestions;
      case "values":
        return valuesQuestions;
      case "attachment":
        return attachmentQuestions;
      default:
        return [];
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: any) => {
    setAnswers({
      ...answers,
      [activeSection]: {
        ...answers[activeSection as keyof typeof answers],
        [questionId]: answer,
      },
    });

    // Increase engagement score and move to next question
    setEngagementScore((prev) => prev + 5);

    // Move to next question or section
    const currentQuestions = getCurrentQuestions();
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Move to next section or complete
      if (activeSection === "conflict") {
        setActiveSection("values");
        setCurrentQuestion(0);
        // Bonus points for completing a section
        setEngagementScore((prev) => prev + 10);
      } else if (activeSection === "values") {
        setActiveSection("attachment");
        setCurrentQuestion(0);
        setEngagementScore((prev) => prev + 10);
      } else {
        setActiveSection("complete");
        setEngagementScore((prev) => prev + 20);
        // Process and submit data
        processAndSubmitData();
      }
    }
  };

  // Process and calculate insights from answers
  const processAndSubmitData = () => {
    // Here we would analyze the answers to determine:
    // 1. Attachment style (secure, anxious, avoidant, fearful-avoidant)
    // 2. Conflict resolution pattern
    // 3. Core values priorities

    // Example processing logic (simplified)
    const insights = {
      attachmentStyle: determineAttachmentStyle(answers.attachment),
      conflictStyle: determineConflictStyle(answers.conflict),
      coreValues: determineCoreValues(answers.values),
      compatibilityMetrics: {
        communicationCompatibility: calculateCommunicationCompatibility(),
        valueAlignment: calculateValueAlignment(),
        emotionalResponsiveness: calculateEmotionalResponsiveness(),
      },
    };

    // Call the onComplete callback with processed data
    onComplete(insights);
  };

  // Placeholder functions for determining insights
  // These would contain actual analysis logic in production
  const determineAttachmentStyle = (answers: any) => {
    // Analysis logic would go here
    return "secure"; // Example return
  };

  const determineConflictStyle = (answers: any) => {
    // Analysis logic would go here
    return "collaborative"; // Example return
  };

  const determineCoreValues = (answers: any) => {
    // Analysis logic would go here
    return ["growth", "stability"]; // Example return
  };

  const calculateCommunicationCompatibility = () => {
    // Calculation logic would go here
    return 85; // Example percentage
  };

  const calculateValueAlignment = () => {
    // Calculation logic would go here
    return 72; // Example percentage
  };

  const calculateEmotionalResponsiveness = () => {
    // Calculation logic would go here
    return 90; // Example percentage
  };

  // Reset and close
  const handleClose = () => {
    setActiveSection("conflict");
    setCurrentQuestion(0);
    setEngagementScore(0);
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
              {activeSection === "conflict" &&
                "Understanding Your Conflict Style"}
              {activeSection === "values" && "Exploring Your Core Values"}
              {activeSection === "attachment" &&
                "Discovering Your Attachment Pattern"}
              {activeSection === "complete" && "Your Relationship Insights"}
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

          {/* Section progress */}
          {activeSection !== "complete" && (
            <div className="flex items-center mt-4">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestion + 1) / getCurrentQuestions().length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-gray-600 font-medium text-sm">
                Question {currentQuestion + 1} of {getCurrentQuestions().length}
              </span>
            </div>
          )}

          {/* Section indicators */}
          <div className="flex justify-center gap-2 mt-4">
            <div
              className={`w-10 h-1 rounded-full ${
                activeSection === "conflict" || activeSection === "complete"
                  ? "bg-indigo-600"
                  : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-10 h-1 rounded-full ${
                activeSection === "values" || activeSection === "complete"
                  ? "bg-indigo-600"
                  : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-10 h-1 rounded-full ${
                activeSection === "attachment" || activeSection === "complete"
                  ? "bg-indigo-600"
                  : "bg-gray-300"
              }`}
            ></div>
          </div>
        </div>

        {/* Engagement score */}
        <div className="absolute top-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          ✨ {engagementScore} points
        </div>

        {/* Question content */}
        <AnimatePresence mode="wait">
          {activeSection !== "complete" ? (
            <motion.div
              key={`${activeSection}-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="py-4"
            >
              {/* Current question */}
              {getCurrentQuestions()[currentQuestion] && (
                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-gray-800">
                    {getCurrentQuestions()[currentQuestion].question}
                  </h3>

                  {/* Options - simplified implementation for now */}
                  <div className="grid grid-cols-1 gap-3">
                    {getCurrentQuestions()[currentQuestion].options?.map(
                      (option, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            handleAnswerSelect(
                              getCurrentQuestions()[currentQuestion].id,
                              option
                            )
                          }
                          className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-left transition-all"
                        >
                          {option}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
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
                Your Relationship Profile is Ready!
              </h3>

              <p className="text-gray-600 mb-8">
                We've analyzed your responses and created personalized insights
                to help you find more meaningful connections.
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

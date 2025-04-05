"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SharedValuesAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export default function SharedValuesAssessment({
  isOpen,
  onClose,
  onComplete,
}: SharedValuesAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [engagementScore, setEngagementScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Questions for assessing shared values
  const questions = [
    // Life Goals
    {
      id: "lifeGoals1",
      question: "How important is career success to you?",
      category: "lifeGoals",
      type: "scale",
      labels: ["Not important", "Very important"],
      importance: "high",
    },
    {
      id: "lifeGoals2",
      question: "Would you relocate for a partner's ambitions?",
      category: "lifeGoals",
      type: "options",
      options: ["Yes", "No", "Maybe"],
      importance: "medium",
    },
    {
      id: "lifeGoals3",
      question: "Which best describes your life priorities?",
      category: "lifeGoals",
      type: "options",
      options: [
        "Building a successful career",
        "Raising a family",
        "Personal growth and experiences",
        "Contributing to community/society",
      ],
      importance: "high",
    },

    // Financial Attitudes
    {
      id: "financial1",
      question: "Are you more of a saver or a spender?",
      category: "financial",
      type: "options",
      options: ["Mostly a saver", "Balanced approach", "Mostly a spender"],
      importance: "high",
    },
    {
      id: "financial2",
      question: "How important is financial security to you?",
      category: "financial",
      type: "scale",
      labels: ["Not important", "Very important"],
      importance: "high",
    },
    {
      id: "financial3",
      question: "How do you prefer to manage finances in a relationship?",
      category: "financial",
      type: "options",
      options: [
        "Completely shared finances",
        "Shared expenses, separate personal accounts",
        "Mostly separate finances",
        "Proportional to income",
      ],
      importance: "medium",
    },

    // Family Planning
    {
      id: "family1",
      question: "Do you want children?",
      category: "family",
      type: "options",
      options: ["Yes", "No", "Unsure"],
      importance: "critical",
    },
    {
      id: "family2",
      question:
        "If you want children, how many would you ideally like to have?",
      category: "family",
      type: "options",
      options: ["1", "2", "3", "4+", "Not applicable"],
      importance: "medium",
      condition: {
        id: "family1",
        showIf: ["Yes"],
      },
    },
    {
      id: "family3",
      question: "How important are family gatherings and traditions to you?",
      category: "family",
      type: "scale",
      labels: ["Not important", "Very important"],
      importance: "medium",
    },

    // Religious/Spiritual Beliefs
    {
      id: "religion1",
      question: "How important is religion or spirituality in your life?",
      category: "religion",
      type: "scale",
      labels: ["Not important", "Very important"],
      importance: "high",
    },
    {
      id: "religion2",
      question: "Would you need a partner to share your beliefs?",
      category: "religion",
      type: "options",
      options: ["Yes", "No", "Somewhat important"],
      importance: "medium",
    },

    // Lifestyle Preferences
    {
      id: "lifestyle1",
      question: "Do you prefer a structured routine or spontaneity?",
      category: "lifestyle",
      type: "options",
      options: ["Structured routine", "Balanced approach", "Spontaneity"],
      importance: "medium",
    },
    {
      id: "lifestyle2",
      question: "How much do you value socializing vs. alone time?",
      category: "lifestyle",
      type: "scale",
      labels: ["Mostly alone time", "Mostly socializing"],
      importance: "medium",
    },
    {
      id: "lifestyle3",
      question: "How do you like to spend weekends?",
      category: "lifestyle",
      type: "options",
      options: [
        "Relaxing at home",
        "Outdoor activities",
        "Social gatherings",
        "Cultural events",
        "Mix of different activities",
      ],
      importance: "low",
    },

    // Political/Social Views
    {
      id: "political1",
      question: "How important are your political beliefs to your identity?",
      category: "political",
      type: "scale",
      labels: ["Not important", "Very important"],
      importance: "medium",
    },
    {
      id: "political2",
      question: "Could you date someone with opposing views on major issues?",
      category: "political",
      type: "options",
      options: ["Yes", "No", "Depends on the issue"],
      importance: "high",
    },
  ];

  // Handle answer selection for scale questions
  const handleScaleAnswer = (value: number) => {
    const currentQ = questions[currentQuestion];

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        value: value,
        category: currentQ.category,
        importance: currentQ.importance,
      },
    }));

    // Increase engagement score
    setEngagementScore((prev) => prev + 5);

    moveToNextQuestion();
  };

  // Handle answer selection for option questions
  const handleOptionSelect = (option: string) => {
    const currentQ = questions[currentQuestion];

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        value: option,
        category: currentQ.category,
        importance: currentQ.importance,
      },
    }));

    // Increase engagement score
    setEngagementScore((prev) => prev + 5);

    moveToNextQuestion();
  };

  // Move to next question or complete assessment
  const moveToNextQuestion = () => {
    // Find next applicable question
    let nextIndex = currentQuestion + 1;

    while (
      nextIndex < questions.length &&
      questions[nextIndex].condition &&
      !isConditionMet(questions[nextIndex].condition)
    ) {
      nextIndex++;
    }

    if (nextIndex < questions.length) {
      setCurrentQuestion(nextIndex);
    } else {
      setIsComplete(true);
      // Process and complete assessment
      processAndSubmitData();
    }
  };

  // Check if a conditional question should be shown
  const isConditionMet = (condition: { id: string; showIf: string[] }) => {
    const previousAnswer = answers[condition.id];
    return previousAnswer && condition.showIf.includes(previousAnswer.value);
  };

  // Process answers and generate insights
  const processAndSubmitData = () => {
    // Group answers by category
    const categorizedAnswers: Record<string, any[]> = {};

    Object.values(answers).forEach((answer) => {
      if (!categorizedAnswers[answer.category]) {
        categorizedAnswers[answer.category] = [];
      }
      categorizedAnswers[answer.category].push(answer);
    });

    // Calculate value priorities
    const valuePriorities = calculateValuePriorities(categorizedAnswers);

    // Generate insights based on answers
    const insights = generateInsights(categorizedAnswers, valuePriorities);

    // Calculate compatibility metrics
    const compatibilityProfile = {
      valuePriorities: valuePriorities,
      familyOrientation: calculateFamilyOrientation(categorizedAnswers),
      financialCompatibility:
        calculateFinancialCompatibility(categorizedAnswers),
      lifestylePreferences: calculateLifestylePreferences(categorizedAnswers),
      religiousImportance: calculateReligiousImportance(categorizedAnswers),
      politicalAlignment: calculatePoliticalAlignment(categorizedAnswers),
    };

    // Prepare final data
    const assessmentData = {
      answers: answers,
      insights: insights,
      compatibilityProfile: compatibilityProfile,
      matchingRecommendations:
        generateMatchingRecommendations(compatibilityProfile),
    };

    // Call onComplete with processed data
    onComplete(assessmentData);
  };

  // Calculate value priorities by importance
  const calculateValuePriorities = (
    categorizedAnswers: Record<string, any[]>
  ) => {
    const priorities: Record<string, number> = {
      lifeGoals: 0,
      financial: 0,
      family: 0,
      religion: 0,
      lifestyle: 0,
      political: 0,
    };

    // Calculate average importance for each category
    Object.entries(categorizedAnswers).forEach(([category, answers]) => {
      if (!priorities[category]) return;

      // Convert importance levels to numeric values
      const importanceValues = answers.map((answer) => {
        switch (answer.importance) {
          case "critical":
            return 4;
          case "high":
            return 3;
          case "medium":
            return 2;
          case "low":
            return 1;
          default:
            return 0;
        }
      });

      // Calculate average importance if we have values
      if (importanceValues.length > 0) {
        const total = importanceValues.reduce((sum, value) => sum + value, 0);
        priorities[category] = Math.round(
          (total / importanceValues.length) * 25
        ); // Scale to 0-100
      }
    });

    return priorities;
  };

  // Calculate family orientation score
  const calculateFamilyOrientation = (
    categorizedAnswers: Record<string, any[]>
  ) => {
    const familyAnswers = categorizedAnswers.family || [];
    let score = 50; // Default middle score

    familyAnswers.forEach((answer) => {
      if (answer.id === "family1" && answer.value === "Yes") {
        score += 25;
      } else if (answer.id === "family1" && answer.value === "No") {
        score -= 25;
      }

      if (answer.id === "family3") {
        // Convert scale answer (1-5) to -20 to +20 adjustment
        const scaleValue = answer.value;
        score += (scaleValue - 3) * 10;
      }
    });

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  };

  // Calculate financial compatibility profile
  const calculateFinancialCompatibility = (
    categorizedAnswers: Record<string, any[]>
  ) => {
    const financialAnswers = categorizedAnswers.financial || [];
    const profile = {
      saverSpender: 50, // 0 = saver, 100 = spender
      securityFocus: 50, // 0 = low, 100 = high
      financialIndependence: 50, // 0 = shared, 100 = independent
    };

    financialAnswers.forEach((answer) => {
      if (answer.id === "financial1") {
        if (answer.value === "Mostly a saver") profile.saverSpender = 25;
        else if (answer.value === "Balanced approach")
          profile.saverSpender = 50;
        else if (answer.value === "Mostly a spender") profile.saverSpender = 75;
      }

      if (answer.id === "financial2") {
        // Convert scale answer (1-5) to 0-100
        profile.securityFocus = answer.value * 20;
      }

      if (answer.id === "financial3") {
        if (answer.value === "Completely shared finances")
          profile.financialIndependence = 0;
        else if (answer.value === "Shared expenses, separate personal accounts")
          profile.financialIndependence = 33;
        else if (answer.value === "Proportional to income")
          profile.financialIndependence = 66;
        else if (answer.value === "Mostly separate finances")
          profile.financialIndependence = 100;
      }
    });

    return profile;
  };

  // Calculate lifestyle preferences
  const calculateLifestylePreferences = (
    categorizedAnswers: Record<string, any[]>
  ) => {
    const lifestyleAnswers = categorizedAnswers.lifestyle || [];
    const profile = {
      structuredVsSpontaneous: 50, // 0 = structured, 100 = spontaneous
      socialVsPrivate: 50, // 0 = private, 100 = social
      activityLevel: 50, // 0 = relaxed, 100 = active
    };

    lifestyleAnswers.forEach((answer) => {
      if (answer.id === "lifestyle1") {
        if (answer.value === "Structured routine")
          profile.structuredVsSpontaneous = 25;
        else if (answer.value === "Balanced approach")
          profile.structuredVsSpontaneous = 50;
        else if (answer.value === "Spontaneity")
          profile.structuredVsSpontaneous = 75;
      }

      if (answer.id === "lifestyle2") {
        // Convert scale answer (1-5) to 0-100
        profile.socialVsPrivate = answer.value * 20;
      }

      if (answer.id === "lifestyle3") {
        if (answer.value === "Relaxing at home") profile.activityLevel = 25;
        else if (answer.value === "Cultural events") profile.activityLevel = 50;
        else if (answer.value === "Social gatherings")
          profile.activityLevel = 75;
        else if (answer.value === "Outdoor activities")
          profile.activityLevel = 90;
        else profile.activityLevel = 50; // Mix of activities
      }
    });

    return profile;
  };

  // Calculate religious importance
  const calculateReligiousImportance = (
    categorizedAnswers: Record<string, any[]>
  ) => {
    const religiousAnswers = categorizedAnswers.religion || [];
    const profile = {
      importance: 50, // 0 = not important, 100 = very important
      partnerAlignmentNecessary: false,
    };

    religiousAnswers.forEach((answer) => {
      if (answer.id === "religion1") {
        // Convert scale answer (1-5) to 0-100
        profile.importance = answer.value * 20;
      }

      if (answer.id === "religion2") {
        profile.partnerAlignmentNecessary = answer.value === "Yes";
      }
    });

    return profile;
  };

  // Calculate political alignment
  const calculatePoliticalAlignment = (
    categorizedAnswers: Record<string, any[]>
  ) => {
    const politicalAnswers = categorizedAnswers.political || [];
    const profile = {
      importance: 50, // 0 = not important, 100 = very important
      openToOpposingViews: true,
    };

    politicalAnswers.forEach((answer) => {
      if (answer.id === "political1") {
        // Convert scale answer (1-5) to 0-100
        profile.importance = answer.value * 20;
      }

      if (answer.id === "political2") {
        profile.openToOpposingViews = answer.value !== "No";
      }
    });

    return profile;
  };

  // Generate insights based on answers
  const generateInsights = (
    categorizedAnswers: Record<string, any[]>,
    valuePriorities: Record<string, number>
  ) => {
    const insights = {
      summary: "",
      topValues: [] as string[],
      potentialChallenges: [] as string[],
      partnerRecommendations: [] as string[],
    };

    // Determine top values
    const priorityOrder = Object.entries(valuePriorities)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    // Generate top values insights
    for (let i = 0; i < Math.min(3, priorityOrder.length); i++) {
      const category = priorityOrder[i];

      switch (category) {
        case "lifeGoals":
          insights.topValues.push("Career and life aspirations");
          break;
        case "financial":
          insights.topValues.push("Financial security and management");
          break;
        case "family":
          insights.topValues.push("Family planning and traditions");
          break;
        case "religion":
          insights.topValues.push("Spiritual/religious beliefs");
          break;
        case "lifestyle":
          insights.topValues.push("Day-to-day lifestyle preferences");
          break;
        case "political":
          insights.topValues.push("Social and political values");
          break;
      }
    }

    // Generate potential challenges
    const familyAnswers = categorizedAnswers.family || [];
    const wantsChildren = familyAnswers.some(
      (a) => a.id === "family1" && a.value === "Yes"
    );
    const doesntWantChildren = familyAnswers.some(
      (a) => a.id === "family1" && a.value === "No"
    );

    if (wantsChildren) {
      insights.partnerRecommendations.push(
        "Someone who shares your desire to build a family"
      );
    }
    if (doesntWantChildren) {
      insights.partnerRecommendations.push(
        "Someone who doesn't want children or is open to not having them"
      );
      insights.potentialChallenges.push(
        "Disagreements with partners who want children"
      );
    }

    // Financial compatibility challenges
    const financialAnswers = categorizedAnswers.financial || [];
    const isSaver = financialAnswers.some(
      (a) => a.id === "financial1" && a.value === "Mostly a saver"
    );
    const isSpender = financialAnswers.some(
      (a) => a.id === "financial1" && a.value === "Mostly a spender"
    );

    if (isSaver) {
      insights.partnerRecommendations.push(
        "Someone who values financial planning and security"
      );
      if (valuePriorities.financial > 70) {
        insights.potentialChallenges.push(
          "Conflicts with partners who have different spending habits"
        );
      }
    }
    if (isSpender) {
      insights.partnerRecommendations.push(
        "Someone who balances your spending tendencies or shares your approach to finances"
      );
    }

    // Religious compatibility
    const religiousAnswers = categorizedAnswers.religion || [];
    const religionImportant = religiousAnswers.some(
      (a) => a.id === "religion1" && a.value > 3
    );
    const needsReligiousAlignment = religiousAnswers.some(
      (a) => a.id === "religion2" && a.value === "Yes"
    );

    if (religionImportant && needsReligiousAlignment) {
      insights.partnerRecommendations.push(
        "Someone who shares your spiritual or religious beliefs"
      );
      insights.potentialChallenges.push(
        "Differences in religious or spiritual beliefs"
      );
    }

    // Political compatibility
    const politicalAnswers = categorizedAnswers.political || [];
    const politicsImportant = politicalAnswers.some(
      (a) => a.id === "political1" && a.value > 3
    );
    const needsPoliticalAlignment = politicalAnswers.some(
      (a) => a.id === "political2" && a.value === "No"
    );

    if (politicsImportant && needsPoliticalAlignment) {
      insights.partnerRecommendations.push(
        "Someone with similar political and social values"
      );
      insights.potentialChallenges.push(
        "Different perspectives on social or political issues"
      );
    }

    // Generate summary
    insights.summary = `You prioritize ${insights.topValues.join(
      ", "
    )} in relationships. `;

    if (insights.potentialChallenges.length > 0) {
      insights.summary += `You may face challenges with ${insights.potentialChallenges[0].toLowerCase()}${
        insights.potentialChallenges.length > 1 ? " and other differences" : ""
      }.`;
    } else {
      insights.summary +=
        "Your balanced approach to values suggests compatibility with a range of partners.";
    }

    return insights;
  };

  // Generate matching recommendations
  const generateMatchingRecommendations = (profile: any) => {
    let recommendations =
      "Based on your values assessment, you would likely thrive with a partner who ";

    // Add family recommendations
    if (profile.familyOrientation > 75) {
      recommendations +=
        "shares your strong family values and desire for children, ";
    } else if (profile.familyOrientation < 25) {
      recommendations +=
        "respects your preference not to focus on traditional family structures, ";
    }

    // Add financial recommendations
    if (profile.financialCompatibility.securityFocus > 75) {
      recommendations += "values financial security and planning, ";
    }
    if (profile.financialCompatibility.saverSpender < 30) {
      recommendations += "shares your careful approach to finances, ";
    } else if (profile.financialCompatibility.saverSpender > 70) {
      recommendations += "balances your more spontaneous spending style, ";
    }

    // Add lifestyle recommendations
    if (profile.lifestylePreferences.socialVsPrivate > 70) {
      recommendations += "enjoys an active social life, ";
    } else if (profile.lifestylePreferences.socialVsPrivate < 30) {
      recommendations += "appreciates quiet time and privacy, ";
    }

    if (profile.lifestylePreferences.structuredVsSpontaneous > 70) {
      recommendations += "embraces spontaneity and flexibility, ";
    } else if (profile.lifestylePreferences.structuredVsSpontaneous < 30) {
      recommendations += "values structure and planning, ";
    }

    // Add religious recommendations if important
    if (
      profile.religiousImportance.importance > 70 &&
      profile.religiousImportance.partnerAlignmentNecessary
    ) {
      recommendations += "shares your spiritual or religious perspective, ";
    }

    // Clean up and finalize
    recommendations = recommendations.slice(0, -2); // Remove trailing comma and space
    recommendations +=
      ". Remember that while value alignment is important, complementary differences can also strengthen relationships.";

    return recommendations;
  };

  // Reset and close
  const handleClose = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setEngagementScore(0);
    setIsComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  // Get current question
  const currentQ = questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 z-50 flex items-center justify-center overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full h-auto max-h-[90vh] overflow-y-auto relative p-6">
        {/* Header with progress indicator */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-indigo-800">
              {isComplete ? "Your Values Profile" : "Understanding Your Values"}
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
                  {currentQ.question}
                </h3>

                {/* Question type: scale */}
                {currentQ.type === "scale" && (
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{currentQ.labels[0]}</span>
                      <span>{currentQ.labels[1]}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleScaleAnswer(value)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center"
                        >
                          <span className="text-xl font-bold text-indigo-600">
                            {value}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question type: options */}
                {currentQ.type === "options" && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQ.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(option)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-left transition-all"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
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
                Your Values Assessment is Complete!
              </h3>

              <p className="text-gray-600 mb-8">
                We've analyzed your responses to understand what matters most to
                you in relationships and life.
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

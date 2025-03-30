"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface PersonalityQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonalityQuiz({
  isOpen,
  onClose,
}: PersonalityQuizProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const personalityQuestions = [
    {
      id: 1,
      question: "How would you describe your personality?",
      options: ["Introvert", "Extrovert", "Ambivert"],
      description: "Helps define social compatibility and conversation flow.",
    },
    {
      id: 2,
      question: "Are you more emotional or logical in relationships?",
      options: ["Emotional", "Logical", "Balanced"],
      description:
        "Core trait for emotional connection and decision-making style.",
    },
    {
      id: 3,
      question: "How do you handle conflicts in a relationship?",
      options: ["Talk openly", "Need space", "Stay silent", "Avoid it"],
      description: "Reveals communication and conflict-resolution style.",
    },
    {
      id: 4,
      question: "What is your love language?",
      options: ["Words", "Quality Time", "Acts of Service", "Touch", "Gifts"],
      description: "Key to understanding how you give/receive love.",
    },
    {
      id: 5,
      question: "What type of relationship are you looking for?",
      options: ["Serious", "Casual", "Friendship", "Marriage"],
      description: "Filters match intent clearly.",
    },
    {
      id: 6,
      question: "How soon do you want to get married?",
      options: [
        "Within 1 year",
        "2–5 years",
        "No rush",
        "Not thinking about it",
      ],
      description: "Important for aligning long-term goals.",
    },
    {
      id: 7,
      question: "Do you want kids in the future?",
      options: ["Yes", "Maybe", "No"],
      description: "A major compatibility factor.",
    },
    {
      id: 8,
      question: "What are your dealbreakers in a relationship?",
      options: [
        "Cheating",
        "Lying",
        "No ambition",
        "No connection",
        "Different values",
      ],
      description: "Helps the system avoid bad matches.",
    },
    {
      id: 9,
      question: "How important is religion or spirituality in your life?",
      options: ["Very", "Somewhat", "Not at all"],
      description: "Aligns personal values and worldviews.",
    },
    {
      id: 10,
      question: "How do you view gender roles in a relationship?",
      options: ["Traditional", "Equal partnership", "Flexible"],
      description: "Important for cultural & value alignment.",
    },
    {
      id: 11,
      question: "What makes you feel most valued in a relationship?",
      options: [
        "Loyalty",
        "Support",
        "Passion",
        "Shared goals",
        "Understanding",
      ],
      description: "Reveals emotional needs.",
    },
    {
      id: 12,
      question: "What is your daily lifestyle like?",
      options: ["Early riser", "Night owl", "Flexible"],
      description: "Helps align habits and routines.",
    },
    {
      id: 13,
      question: "Do you prefer a healthy lifestyle?",
      options: ["Yes, very", "I try", "Not really"],
      description: "Useful for aligning health goals.",
    },
    {
      id: 14,
      question: "How important is physical fitness to you?",
      options: ["Very", "Somewhat", "Not important"],
      description: "Affects lifestyle and long-term habits.",
    },
    {
      id: 15,
      question: "Do you drink alcohol or smoke?",
      options: ["Yes", "Occasionally", "Never"],
      description: "Lifestyle habits that affect compatibility.",
    },
    {
      id: 16,
      question: "What do you do for a living?",
      options: ["Student", "Freelancer", "Business Owner", "Employee", "Other"],
      description: "Career status for ambition alignment.",
    },
    {
      id: 17,
      question: "How important is career success to you?",
      options: ["Very", "Somewhat", "Not a priority"],
      description: "Understands ambition level.",
    },
    {
      id: 18,
      question: "Would you relocate for love?",
      options: ["Yes", "Maybe", "No"],
      description: "Helps with geographic matching.",
    },
    {
      id: 19,
      question: "What kind of social time do you prefer?",
      options: ["Big groups", "One-on-one talks", "Both"],
      description: "Social energy and compatibility.",
    },
    {
      id: 20,
      question: "What do you value most in a partner?",
      options: [
        "Honesty",
        "Humor",
        "Intelligence",
        "Loyalty",
        "Ambition",
        "Family-focused",
      ],
      description: "Direct match with partner expectations.",
    },
  ];

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const closeModal = () => {
    onClose();
    setCurrentQuestion(0);
    setQuizStarted(false);
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers({
      ...answers,
      [personalityQuestions[currentQuestion].id]: answer,
    });

    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, mark as completed
      setQuizCompleted(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Function to determine personality type from quiz answers
  const determinePersonalityType = (
    answers: Record<string, string>
  ): string => {
    // Simple algorithm to determine MBTI type from answers
    const types = {
      E: 0,
      I: 0, // Extraversion vs Introversion
      S: 0,
      N: 0, // Sensing vs Intuition
      T: 0,
      F: 0, // Thinking vs Feeling
      J: 0,
      P: 0, // Judging vs Perceiving
    };

    // Map specific question answers to MBTI dimensions
    if (answers["1"] === "Introvert") types.I++;
    else types.E++;
    if (answers["2"] === "Emotional") types.F++;
    else types.T++;
    if (answers["3"] === "Avoid it") types.I++;
    else types.E++;
    if (answers["10"] === "Structured") types.J++;
    else types.P++;
    if (answers["12"] === "Early riser") types.J++;
    else types.P++;
    if (answers["13"] === "Yes, very") types.S++;
    else types.N++;
    if (answers["17"] === "Somewhat" || answers["17"] === "Yes") types.F++;
    else types.T++;

    // Determine each dimension by comparing scores
    const mbti = [
      types.E > types.I ? "E" : "I",
      types.S > types.N ? "S" : "N",
      types.T > types.F ? "T" : "F",
      types.J > types.P ? "J" : "P",
    ].join("");

    return mbti;
  };

  const submitQuiz = async () => {
    try {
      setIsSubmitting(true);
      setSubmissionError("");

      // Validate that all questions are answered
      const unansweredQuestions = personalityQuestions.filter(
        (q) => !answers[q.id] || answers[q.id] === ""
      );

      if (unansweredQuestions.length > 0) {
        setSubmissionError(
          `Please answer all questions. You have ${unansweredQuestions.length} unanswered question(s).`
        );
        setIsSubmitting(false);
        return;
      }

      // Store answers in localStorage for reference
      localStorage.setItem("personality_answers", JSON.stringify(answers));
      localStorage.setItem("quiz_completed", "true");

      // Set a flag that we're coming from the quiz - will be used in matches page
      sessionStorage.setItem("from_quiz", "true");

      // Calculate personality type based on answers
      const personalityType = determinePersonalityType(answers);
      localStorage.setItem("personality_type", personalityType);

      if (session) {
        // If user is logged in, store quiz results in database
        const response = await fetch("/api/users/quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers,
            personalityType,
            completedAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Something went wrong");
        }

        // Navigate to matches page to see matches
        router.push("/matches");
      } else {
        // For not logged in users, redirect to matches page
        router.push("/matches");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setSubmissionError(
        "Failed to submit your quiz. Please try again or contact support."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-purple-700">
              {!quizStarted && !quizCompleted && "Find Your Perfect Match"}
              {quizStarted && !quizCompleted && "Personality Match Quiz"}
              {quizCompleted && "Quiz Completed!"}
            </h3>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
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
          {/* Progress Bar - only show during quiz */}
          {quizStarted && !quizCompleted && (
            <div className="mt-4 flex items-center">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${
                        ((currentQuestion + 1) / personalityQuestions.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-gray-600 font-medium">
                Question {currentQuestion + 1} of {personalityQuestions.length}
              </span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Introduction Screen */}
          {!quizStarted && !quizCompleted && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-purple-600"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>

              <h4 className="text-xl font-semibold">
                Unlock Your Perfect Match!
              </h4>

              <p className="text-gray-600">
                Our AI-powered quiz analyzes your personality, preferences, and
                relationship style to find your most compatible matches.
              </p>

              <div className="bg-purple-50 p-4 rounded-lg">
                <ul className="text-left space-y-2">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                    <span className="text-gray-700">
                      Just 20 quick questions
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                    <span className="text-gray-700">Takes only 3 minutes</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5"
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
                    <span className="text-gray-700">
                      95% accuracy in matching
                    </span>
                  </li>
                </ul>
              </div>

              <div className="py-4">
                <button
                  onClick={startQuiz}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-10 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105 w-full md:w-auto"
                >
                  Start Quiz
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Answer honestly for the best results!
              </p>
            </div>
          )}

          {/* Quiz Questions */}
          {quizStarted && !quizCompleted && (
            <div className="space-y-6 relative">
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  {personalityQuestions[currentQuestion].question}
                </h4>
                <p className="text-gray-500 mb-6">
                  {personalityQuestions[currentQuestion].description}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {personalityQuestions[currentQuestion].options.map(
                    (option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className="flex items-center bg-white p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-transform hover:scale-[1.02]"
                      >
                        <span className="font-medium">{option}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Completion Screen */}
          {quizCompleted && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
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

              <h4 className="text-xl font-semibold">Amazing! Quiz Completed</h4>

              <p className="text-gray-600">
                Our AI is ready to analyze your answers and find your perfect
                matches.
              </p>

              {submissionError && (
                <div className="py-2 px-4 bg-red-50 text-red-600 rounded-lg">
                  {submissionError}
                </div>
              )}

              <div className="py-4">
                <button
                  onClick={submitQuiz}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-10 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105"
                >
                  {isSubmitting ? "Processing..." : "See Your Matches"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {quizStarted && !quizCompleted && (
          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={prevQuestion}
              className={`px-5 py-2 rounded-full font-medium ${
                currentQuestion === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-purple-600 hover:bg-purple-50"
              }`}
              disabled={currentQuestion === 0}
            >
              Back
            </button>
            <div className="text-gray-500">
              {currentQuestion + 1} of {personalityQuestions.length} questions
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

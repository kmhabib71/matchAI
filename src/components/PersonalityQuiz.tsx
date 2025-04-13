"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import axios from "axios";
import districtData from "../../data/district.json";

interface PersonalityQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define the QuestionType interface
interface QuestionType {
  id: number;
  question: string;
  type: string;
  description?: string;
  options?: string[];
  condition?: {
    field: string;
    showIf: string[];
  };
}

export default function PersonalityQuiz({
  isOpen,
  onClose,
}: PersonalityQuizProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{
    profile: Record<number, string | string[]>;
    preferences: Record<number, string | string[]>;
    personality: Record<number, string>;
  }>({
    profile: {},
    preferences: {},
    personality: {},
  });
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [streakCount, setStreakCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [characterMood, setCharacterMood] = useState<
    "happy" | "thinking" | "excited"
  >("happy");
  const [points, setPoints] = useState(0);
  const [quizSection, setQuizSection] = useState<
    "profile" | "personality" | "preferences"
  >("profile");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Extract districts from the JSON data
  const districts =
    districtData[2]?.data?.map((district) => ({
      name: district.name,
      bn_name: district.bn_name,
    })) || [];

  // The Bengali questions from note.text
  const profileQuestions = [
    {
      id: 2,
      question: "আপনার লিঙ্গ পরিচয় কী?",
      options: ["পুরুষ", "নারী", "অন্যান্য"],
      type: "emoji-radio",
      description: "এটি বৈচিত্র্যময় ম্যাচিং-এর ভিত্তি তৈরি করবে।",
    },
    {
      id: 3,
      question: "আপনার জন্ম সাল কোনটি?",
      options: Array.from({ length: 43 }, (_, i) => `${2025 - (18 + i)}`),
      type: "date-picker",
      description: "বয়সের সাথে উপযুক্ত ম্যাচিং পেতে।",
    },
    {
      id: 4,
      question: "বর্তমানে কোথায় বসবাস করছেন?",
      type: "location",
      description: "লোকেশন-ভিত্তিক ম্যাচিং এর জন্য গুরুত্বপূর্ণ।",
    },
    {
      id: 5,
      question: "বর্তমানে আপনি কোন পেশায় রয়েছেন?",
      options: [
        "ছাত্র/ছাত্রী",
        "চাকুরিজীবী",
        "ব্যবসায়ী",
        "ফ্রিল্যান্সার",
        "বেকার",
      ],
      type: "card-select",
      description: "জীবনধারা ও আগ্রহের সামঞ্জস্য নিশ্চিত করুন।",
    },
    {
      id: 7,
      question: "আপনার সর্বশেষ শিক্ষাগত যোগ্যতা কী?",
      options: [
        "এসএসসি",
        "এইচএসসি",
        "ডিপ্লোমা",
        "স্নাতক",
        "স্নাতকোত্তর",
        "অন্যান্য",
      ],
      type: "card-select",
      description: "আপনার চিন্তাধারা এবং মানসিকতা বুঝতে সাহায্য করে।",
    },
    {
      id: 8,
      question: "আপনার ধর্মীয় বিশ্বাস কী?",
      options: [
        "ইসলাম",
        "হিন্দু",
        "খ্রিস্টান",
        "বৌদ্ধ",
        "অন্যান্য",
        "নির্ধারিত নয়",
      ],
      type: "card-select",
      description: "ধর্মীয় ও সাংস্কৃতিক মিল খুঁজতে সহায়ক।",
    },
    {
      id: 9,
      question: "আপনার বৈবাহিক অবস্থা কী?",
      options: ["অবিবাহিত", "বিবাহবিচ্ছিন্ন", "বিধবা/বিপত্নীক"],
      type: "radio",
      description: "সম্পর্কের বর্তমান অবস্থা বুঝতে প্রয়োজন।",
    },
    {
      id: 12,
      question: "আপনার প্রধান শখ কী কী?",
      options: [
        "ভ্রমণ",
        "গান",
        "বই পড়া",
        "রান্না",
        "গেমিং",
        "ব্যবসা",
        "স্পোর্টস",
        "শিল্পকলা",
        "অন্যান্য",
      ],
      type: "multi-select",
      description: "সাধারণ আগ্রহে সম্পর্ক আরও আনন্দময় হয়।",
    },
    {
      id: 1,
      question: "আপনার পুরো নাম কী?",
      type: "text",
      description: "একটি সুন্দর পরিচয়ে শুরু হোক আপনার যাত্রা।",
    },
  ];

  const preferenceQuestions = [
    {
      id: 1,
      question: "কোন বয়সসীমার মানুষের সাথে পরিচিত হতে আগ্রহী?",
      options: [
        "১৮–২৩",
        "২৩–২৮",
        "২৮–৩৩",
        "৩৩–৩৮",
        "৩৮–৪৫",
        "৪৫+",
        "যে কোনো বয়সী",
      ],
      type: "slider-range",
      description: "বয়স পছন্দ অনুসারে নির্ধারণ করুন।",
    },
    {
      id: 2,
      question: "কোন ধরনের পেশার মানুষ পছন্দ করেন?",
      options: [
        "ছাত্র/ছাত্রী",
        "চাকুরিজীবী",
        "ব্যবসায়ী",
        "ফ্রিল্যান্সার",
        "বেকার",
      ],
      type: "multi-select",
      description: "জীবনধারা ও আগ্রহের সামঞ্জস্য নিশ্চিত করুন।",
    },
    {
      id: 4,
      question: "পছন্দের মানুষের শিক্ষাগত যোগ্যতা কেমন হতে চান?",
      options: [
        "এসএসসি",
        "এইচএসসি",
        "ডিপ্লোমা",
        "স্নাতক",
        "স্নাতকোত্তর",
        "অন্যান্য",
      ],
      type: "dropdown",
      description: "সঙ্গীর চিন্তাধারা বোঝার জন্য।",
    },
    {
      id: 5,
      question: "সঙ্গী কি একই শহরে হতে হবে?",
      options: ["হ্যাঁ", "না", "যে কোনো শহরে"],
      type: "radio",
      description: "দূরত্বের গুরুত্ব বোঝাতে।",
    },
  ];

  const personalityQuestions = [
    // Big Five personality traits (5 questions)
    {
      id: 1,
      question: "আমি কি নতুন রেসিপি ট্রাই করতে মজা পাই?",
      options: [
        "১: একদম না 😒",
        "২: না 😕",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😊",
        "৫: খুবই হ্যাঁ 😃",
      ],
      type: "radio",
      description:
        "Openness (O): আপনার নিজের ব্যক্তিত্ব বুঝতে এটি গুরুত্বপূর্ণ। নতুন জিনিস চেষ্টা করার প্রবণতা জানায় আপনি কতটা উন্মুক্ত মনের মানুষ।",
    },
    {
      id: 2,
      question: "আমি কি ডেস্ক অগোছালো হলে ঘাবড়ে যাই?",
      options: [
        "১: একদম না 🙂",
        "২: না 😌",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😟",
        "৫: খুবই হ্যাঁ 😣",
      ],
      type: "radio",
      description:
        "Conscientiousness (C): আপনার নিজের সংগঠিত মনোভাব বোঝাতে সাহায্য করে। সঠিক ম্যাচ খুঁজতে সত্যি উত্তর দিন।",
    },
    {
      id: 3,
      question: "আমি কি পার্টিতে হইচই করতে ভালোবাসি?",
      options: [
        "১: একদম না 😔",
        "২: না 🙂",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😄",
        "৫: খুবই হ্যাঁ 🎉",
      ],
      type: "radio",
      description:
        "Extraversion (E): আপনার সামাজিক আচরণের ধরন বোঝায়। আপনার আসল ব্যক্তিত্ব তুলে ধরুন, ভবিষ্যত সম্পর্কের সুখের জন্য।",
    },
    {
      id: 4,
      question: "আমি কি বন্ধু দেরি করলেও শান্ত থাকি?",
      options: [
        "১: একদম না 😠",
        "২: না 😒",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 🙂",
        "৫: খুবই হ্যাঁ 😌",
      ],
      type: "radio",
      description:
        "Agreeableness (A): আপনার সহনশীলতা ও মানিয়ে নেওয়ার ক্ষমতা। মনে রাখবেন, এই উত্তরের উপর ভিত্তি করে আপনার ম্যাচ নির্বাচিত হবে।",
    },
    {
      id: 5,
      question: "আমি কি কফি পড়ে গেলে দিন শেষ মনে করি?",
      options: [
        "১: একদম না 😎",
        "২: না 🙂",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😫",
        "৫: খুবই হ্যাঁ 😩",
      ],
      type: "radio",
      description:
        "Neuroticism (N): আপনার মানসিক চাপ সামলানোর ক্ষমতা। আপনার প্রকৃত প্রতিক্রিয়া জানানো গুরুত্বপূর্ণ, আদর্শ উত্তর নয়।",
    },

    // Attachment Style (3 Questions)
    {
      id: 6,
      question: "সঙ্গী রিপ্লাই দিতে দেরি করলে আমি কি টেনশন করি?",
      options: [
        "১: একদম না 😌",
        "২: না 🙂",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😟",
        "৫: খুবই হ্যাঁ 😰",
      ],
      type: "radio",
      description:
        "আপনার আসক্তির ধরন বুঝতে সাহায্য করে। সম্পর্কে আপনার আসল আচরণ তুলে ধরুন, আদর্শ আচরণ নয়।",
    },
    {
      id: 7,
      question: "সঙ্গী একটু দূরে থাকলে আমি কি শান্ত থাকি?",
      options: [
        "১: একদম না 😣",
        "২: না 😔",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 🙂",
        "৫: খুবই হ্যাঁ 😌",
      ],
      type: "radio",
      description:
        "সম্পর্কে স্বাধীনতা ও নিরাপত্তার অনুভূতি। আপনার সাথে মানানসই সঙ্গী খুঁজে সত্যি উত্তর দিন।",
    },
    {
      id: 8,
      question: "গভীর কথা হলে আমি কি পালাতে চাই?",
      options: [
        "১: একদম না 😃",
        "২: না 😊",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😓",
        "৫: খুবই হ্যাঁ 😅",
      ],
      type: "radio",
      description:
        "আবেগ প্রকাশে আপনার স্বাচ্ছন্দ্য। আমরা এখানে আপনার আসল ব্যক্তিত্ব বুঝতে চাই যাতে উপযুক্ত ম্যাচ খুঁজে দিতে পারি।",
    },

    // Values and Life Goals (4 Questions)
    {
      id: 9,
      question: "আমি কি বাচ্চার জন্য পাগল হয়ে যাই?",
      options: [
        "১: একদম না 😒",
        "২: না 🙂",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😊",
        "৫: খুবই হ্যাঁ 😍",
      ],
      type: "radio",
      description:
        "আপনার জীবনের লক্ষ্য ও পরিবারের প্রতি আগ্রহ। মনে রাখবেন, এটি আপনার যোগ্য সঙ্গী খোঁজার একটি গুরুত্বপূর্ণ মাপকাঠি।",
    },
    {
      id: 10,
      question: "কাজ ছাড়া আমি কি অস্থির হয়ে পড়ি?",
      options: [
        "১: একদম না 😌",
        "২: না 🙂",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😟",
        "৫: খুবই হ্যাঁ 😣",
      ],
      type: "radio",
      description:
        "আপনার কর্মজীবনের প্রতি মনোযোগ ও আগ্রহ। আপনার সত্যিকারের মনোভাব তুলে ধরুন, এটি ভবিষ্যত সম্পর্কের সাফল্যে সাহায্য করবে।",
    },
    {
      id: 11,
      question: "আমি কি ঘুরতে না গেলে মন খারাপ করি?",
      options: [
        "১: একদম না 😌",
        "২: না 🙂",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😊",
        "৫: খুবই হ্যাঁ 😃",
      ],
      type: "radio",
      description:
        "আপনার অভিজ্ঞতা সংগ্রহ ও নতুন জায়গা দেখার আগ্রহ। আপনার আসল পছন্দ জানান, এর উপর ভিত্তি করে আপনার ম্যাচিং করা হবে।",
    },
    {
      id: 12,
      question: "আমি কি টাকা জমাতে না পারলে ঘুম হারাম হয়?",
      options: [
        "১: একদম না 😌",
        "২: না 🙂",
        "৩: মাঝামাঝি 😐",
        "৪: হ্যাঁ 😟",
        "৫: খুবই হ্যাঁ 😖",
      ],
      type: "radio",
      description:
        "আপনার অর্থনৈতিক স্থিতিশীলতার প্রতি আগ্রহ। আপনার নিজের অনুভূতি প্রকাশ করুন, সঠিক ম্যাচিং-এর জন্য।",
    },
  ];

  // Helper function to check if a question should be shown based on conditions
  const shouldShowQuestion = useCallback(
    (question: QuestionType): boolean => {
      if (!question.condition) return true;

      const { field, showIf } = question.condition;

      // Map the field to the corresponding question
      let questionId: number | null = null;

      // Map condition fields to question IDs
      switch (field) {
        case "gender":
          questionId = 2; // Gender question
          break;
        case "marital_status":
          questionId = 9; // Marital status question
          break;
        case "profession":
          questionId = 5; // Profession question
          break;
        default:
          return true;
      }

      // Get the answer for this field
      const answer = answers.profile[questionId];

      // If there's no answer yet, don't show conditional question
      if (!answer) return false;

      // Check if the answer is in the showIf array
      return showIf.includes(String(answer));
    },
    [answers]
  );

  // Get visible questions for the current section
  const getVisibleQuestions = useCallback(() => {
    let questions =
      quizSection === "profile"
        ? profileQuestions
        : quizSection === "preferences"
        ? preferenceQuestions
        : personalityQuestions;

    return questions.filter(shouldShowQuestion);
  }, [quizSection, shouldShowQuestion]);

  // Get the current question object
  const currentQuestionObj = useMemo(() => {
    const visibleQuestions = getVisibleQuestions();
    return (
      visibleQuestions[currentQuestion] || { id: 0, question: "", type: "text" }
    );
  }, [currentQuestion, getVisibleQuestions]);

  // Function to create confetti celebration effect
  const triggerCelebration = () => {
    setShowCelebration(true);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setShowCelebration(false);
    }, 2000);
  };

  const startQuiz = () => {
    // Reset all quiz data when starting
    setQuizStarted(true);
    setCharacterMood("excited");
    setCurrentQuestion(0);
    setQuizSection("profile");
    setStreakCount(0);
    setPoints(0);
    // Clear all answers
    setAnswers({
      profile: {},
      preferences: {},
      personality: {},
    });
    // Clear localStorage
    localStorage.removeItem("quizAnswers");
    setTimeout(() => setCharacterMood("happy"), 1500);
  };

  const closeModal = () => {
    onClose();
    setCurrentQuestion(0);
    setQuizStarted(false);
    setQuizSection("profile");
    setStreakCount(0);
    setPoints(0);
    setQuizCompleted(false); // Reset the completed state when closing modal
  };

  // Handle progression between sections
  const goToNextSection = () => {
    // Reset question index and selected options
    setCurrentQuestion(0);
    setSelectedOptions([]);

    if (quizSection === "profile") {
      // Save current state to localStorage before transitioning
      localStorage.setItem("quizAnswers", JSON.stringify(answers));

      // Move to personality section
      setQuizSection("personality");
      triggerCelebration();
      setPoints((prev) => prev + 50);
      setCharacterMood("excited");
      setTimeout(() => setCharacterMood("happy"), 1000);
    } else if (quizSection === "personality") {
      // Save current state to localStorage before transitioning
      localStorage.setItem("quizAnswers", JSON.stringify(answers));

      // Move to preferences section
      setQuizSection("preferences");
      triggerCelebration();
      setPoints((prev) => prev + 50);
      setCharacterMood("excited");
      setTimeout(() => setCharacterMood("happy"), 1000);
    } else {
      // Completed all sections
      localStorage.setItem("quizAnswers", JSON.stringify(answers));
      setQuizCompleted(true);
      triggerCelebration();
      setPoints((prev) => prev + 100);
      setCharacterMood("excited");
    }
  };

  // Store answers in the format expected by the API
  const handleAnswerSelect = (answer: string | string[]) => {
    // Update answers based on question type
    const currentQuestionsArray = getVisibleQuestions();
    const currentQuestionObj = currentQuestionsArray[currentQuestion];

    // Create a copy of the current answers
    const updatedAnswers = { ...answers };
    const sectionKey = getSectionKey(quizSection);

    // Update the appropriate section
    updatedAnswers[sectionKey][currentQuestionObj.id] = answer;

    setAnswers(updatedAnswers);

    // Save answers to localStorage
    localStorage.setItem("quizAnswers", JSON.stringify(updatedAnswers));

    // Increment streak and points
    setStreakCount((prev) => prev + 1);
    setPoints((prev) => prev + 10);

    // Show character reaction
    setCharacterMood("happy");

    // If streak hits multiples of 5, trigger celebration
    if ((streakCount + 1) % 5 === 0) {
      triggerCelebration();
      setPoints((prev) => prev + 20); // Bonus points for streak
    }

    // For non-multi-select questions, automatically go to next question
    if (currentQuestionObj.type !== "multi-select") {
      if (currentQuestion < currentQuestionsArray.length - 1) {
        // Move to next question
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOptions([]); // Reset selected options when changing questions
        setCharacterMood("thinking");
        setTimeout(() => setCharacterMood("happy"), 800);
      } else {
        // End of current section
        goToNextSection();
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setCharacterMood("thinking");
      setTimeout(() => setCharacterMood("happy"), 800);
    }
  };

  // Function to determine personality type from quiz answers
  const determinePersonalityType = (
    answers: Record<string, string | string[]>
  ): string => {
    // Extract values without the numeric prefix and emoji
    const extractValue = (answer: string): string => {
      const match = answer.match(
        /\d+:\s*(.+?)\s*(?:😒|😐|😊|🙂|🙄|😃|😌|😣|🤗|😟|😫|😠|😄|🥳|😎|😩|😰|😔|😓|😅|🥰|😖|$)/
      );
      return match ? match[1].trim() : answer;
    };

    // For Big Five traits, process answers 1-5
    let openness = 0,
      conscientiousness = 0,
      extraversion = 0,
      agreeableness = 0,
      neuroticism = 0;

    if (answers[`1`]) {
      const value = extractValue(answers[`1`] as string);
      openness = parseInt(value.charAt(0)) || 3;
    }

    if (answers[`2`]) {
      const value = extractValue(answers[`2`] as string);
      conscientiousness = parseInt(value.charAt(0)) || 3;
    }

    if (answers[`3`]) {
      const value = extractValue(answers[`3`] as string);
      extraversion = parseInt(value.charAt(0)) || 3;
    }

    if (answers[`4`]) {
      const value = extractValue(answers[`4`] as string);
      agreeableness = parseInt(value.charAt(0)) || 3;
    }

    if (answers[`5`]) {
      const value = extractValue(answers[`5`] as string);
      neuroticism = parseInt(value.charAt(0)) || 3;
    }

    // Simple algorithm to convert Big Five to MBTI-like format for backward compatibility
    const types = {
      E: extraversion > 3 ? extraversion - 2 : 0,
      I: extraversion <= 3 ? 5 - extraversion : 0,
      S: openness <= 3 ? 5 - openness : 0,
      N: openness > 3 ? openness - 2 : 0,
      T: agreeableness <= 3 ? 5 - agreeableness : 0,
      F: agreeableness > 3 ? agreeableness - 2 : 0,
      J: conscientiousness > 3 ? conscientiousness - 2 : 0,
      P: conscientiousness <= 3 ? 5 - conscientiousness : 0,
    };

    // Determine each dimension by comparing scores
    const mbti = [
      types.E > types.I ? "E" : "I",
      types.S > types.N ? "S" : "N",
      types.T > types.F ? "T" : "F",
      types.J > types.P ? "J" : "P",
    ].join("");

    return mbti;
  };

  // Translation mappings for Bengali to English
  const bengaliToEnglishMap: Record<string, string> = {
    // Profile questions translations
    পুরুষ: "Male",
    নারী: "Female",
    অন্যান্য: "Other",

    ছাত্র: "Student",
    "ছাত্র/ছাত্রী": "Student",
    চাকুরিজীবী: "Employee",
    ব্যবসায়ী: "Business Owner",
    ফ্রিল্যান্সার: "Freelancer",
    বেকার: "Unemployed",

    এসএসসি: "SSC",
    এইচএসসি: "HSC",
    ডিপ্লোমা: "Diploma",
    স্নাতক: "Bachelor's",
    স্নাতকোত্তর: "Master's",
    other: "Other", // Changed duplicate key

    ইসলাম: "Islam",
    হিন্দু: "Hinduism",
    খ্রিস্টান: "Christianity",
    বৌদ্ধ: "Buddhism",
    "নির্ধারিত নয়": "Unspecified",

    অবিবাহিত: "Single",
    বিবাহবিচ্ছিন্ন: "Divorced",
    "বিধবা/বিপত্নীক": "Widowed",

    হ্যাঁ: "Yes",
    না: "No",
    মাঝেমধ্যে: "Occasionally",
    "ভবিষ্যতে ভাবছি": "Planning in future",

    // Hobbies
    ভ্রমণ: "Travel",
    গান: "Music",
    "বই পড়া": "Reading",
    রান্না: "Cooking",
    গেমিং: "Gaming",
    ব্যবসা: "Business",
    স্পোর্টস: "Sports",
    শিল্পকলা: "Art",

    // MBTI related
    "লাজুক ও চুপচাপ": "Shy and quiet",
    "মিশুক ও প্রাণবন্ত": "Social and energetic",
    "দুটোই একটু একটু": "A bit of both",

    "বন্ধুদের সাথে আড্ডা": "Hanging with friends",
    "বাসায় বিশ্রাম": "Relaxing at home",
    ব্যায়াম: "Exercise",
    "সিনেমা দেখা": "Watching movies",

    "প্রথম দর্শনেই ভালোবাসা হয়": "Love at first sight",
    "সময়ের সাথে ভালোবাসা গড়ে ওঠে": "Love develops over time",
    "নিশ্চিত নই": "Not sure",

    "রোমান্টিক ডিনার": "Romantic dinner",
    "অ্যাডভেঞ্চার ভ্রমণ": "Adventure trip",
    "একসাথে সিনেমা দেখা": "Watching movies together",
    "একসাথে রান্না করা": "Cooking together",

    "বেশি আবেগী": "More emotional",
    "বেশি বাস্তববাদী": "More practical",
    "দুটোর মিশ্রণ": "Mix of both",

    "আলোচনা করি": "Discuss openly",
    "কিছু সময় একা থাকি": "Need some alone time",
    "চুপচাপ থাকি": "Stay quiet",
    "এড়িয়ে চলি": "Avoid it",

    "সকালে উঠতে পছন্দ করি": "Prefer waking up early",
    "রাতে জেগে থাকতে পছন্দ করি": "Prefer staying up late",
    "যখন যেমন": "Depends on the situation",

    "মিষ্টি কথা বলা": "Speaking sweet words",
    "একসাথে সময় কাটানো": "Spending time together",
    "সাহায্য করা": "Helping out",
    "হাত ধরা ও আলিঙ্গন": "Physical touch and hugs",
    "উপহার দেওয়া": "Giving gifts",

    // Preference questions
    "১৮–২৩": "18-23",
    "২৩–২৮": "23-28",
    "২৮–৩৩": "28-33",
    "৩৩–৩৮": "33-38",
    "৩৮–৪৫": "38-45",
    "৪৫+": "45+",
    "যে কোনো বয়সী": "Any age",

    "প্রয়োজন নেই": "Optional",
    "৳০–৫,০০০": "BDT 0-5,000",
    "৳৫,০০১–১৫,০০০": "BDT 5,001-15,000",
    "৳১৫,০০১–৩০,০০০": "BDT 15,001-30,000",
    "৳৩০,০০১–৫০,০০০": "BDT 30,001-50,000",
    "৳৫০,০০০+": "BDT 50,000+",

    "যে কোনো শহরে": "Any city",

    "মনে নেই": "Don't care",
    "১: একদম না 😒": "1: Strongly disagree",
    "২: না 😕": "2: Disagree",
    "৩: মাঝামাঝি 😐": "3: Neutral",
    "৪: হ্যাঁ 😊": "4: Agree",
    "৫: খুবই হ্যাঁ 😃": "5: Strongly agree",
    "১: একদম না 🙂": "1: Strongly disagree",
    "২: না 😌": "2: Disagree",
    "১: একদম না 😌": "1: Strongly disagree",
    "৪: হ্যাঁ 😟": "4: Agree",
    "৫: খুবই হ্যাঁ 😣": "5: Strongly agree",
    "১: একদম না 😔": "1: Strongly disagree",
    "২: না 🙂": "2: Disagree",
    "৪: হ্যাঁ 😄": "4: Agree",
    "৫: খুবই হ্যাঁ 🎉": "5: Strongly agree",
    "১: একদম না 😠": "1: Strongly disagree",
    "২: না 😒": "2: Disagree",
    "৪: হ্যাঁ 🙂": "4: Agree",
    "৫: খুবই হ্যাঁ 😌": "5: Strongly agree",
    "১: একদম না 😎": "1: Strongly disagree",
    "৪: হ্যাঁ 😫": "4: Agree",
    "৫: খুবই হ্যাঁ 😩": "5: Strongly agree",
    "৫: খুবই হ্যাঁ 😰": "5: Strongly agree",
    "১: একদম না 😣": "1: Strongly disagree",
    "২: না 😔": "2: Disagree",
    "১: একদম না 😃": "1: Strongly disagree",
    "২: না 😊": "2: Disagree",
    "৪: হ্যাঁ 😓": "4: Agree",
    "৫: খুবই হ্যাঁ 😅": "5: Strongly agree",
    "৫: খুবই হ্যাঁ 😍": "5: Strongly agree",
    "৫: খুবই হ্যাঁ 😖": "5: Strongly agree",
  };

  // Function to translate Bengali answers to English
  const translateToEnglish = (
    answers: Record<string, string | string[]>
  ): Record<string, string> => {
    const translatedAnswers: Record<string, string> = {};

    Object.entries(answers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle array of answers (multi-select)
        const translatedArray = value.map(
          (item) => bengaliToEnglishMap[item] || item
        );
        translatedAnswers[key] = translatedArray.join(", ");
      } else if (typeof value === "string") {
        // Check if there's a translation, otherwise keep original
        translatedAnswers[key] = bengaliToEnglishMap[value] || value;
      } else {
        // Handle other types (though we shouldn't have any)
        translatedAnswers[key] = String(value);
      }
    });

    return translatedAnswers;
  };

  // Process all answers and update to English format
  const processAndCleanAnswer = (answer: string): string => {
    // Clean numberical values with emoji to return just the English value
    const valueMatch = answer.match(
      /^\d+:\s(.+?)(?:\s[😒😐😊🙂🙄😃😌😣🤗😟😫😠😄🥳😎😩😰😔😓😅🥰😖])?$/
    );
    if (valueMatch) {
      return valueMatch[1].toLowerCase();
    }

    // Translate if it's in Bengali
    return (bengaliToEnglishMap[answer] || answer).toLowerCase();
  };

  const submitQuiz = async () => {
    try {
      setIsSubmitting(true);
      setSubmissionError("");

      // First, save the final answers to localStorage before submission
      localStorage.setItem("quizAnswers", JSON.stringify(answers));
      console.log("Quiz answers saved to localStorage:", answers);

      // Create a properly formatted submission object that matches API expectations
      const submissionData: Record<string, any> = {
        email: session?.user?.email,
        profileCompleted: true, // Mark profile as completed
        // Initialize preferences object
        preferences: {
          minAge: 0,
          maxAge: 50,
          distance: 50,
          dealBreakers: [],
        },
        // Add personalityQuiz object in the format expected by the API
        personalityQuiz: {
          completed: true,
          completedAt: new Date(),
          answers: {},
          traits: [],
        },
      };

      // Prepare answers map for personalityQuiz
      const quizAnswers: Record<string, string> = {};

      // Map specific lifestyle fields
      if (answers.profile[11]) {
        // Smoking question
        submissionData.lifestyle = {
          smoking: processAndCleanAnswer(answers.profile[11] as string),
          drinking: "No", // Default values
          diet: "Any",
          religion: processAndCleanAnswer(
            (answers.profile[8] as string) || "Any"
          ),
        };
      }

      // Set the name directly
      if (answers.profile[1]) {
        submissionData.name = answers.profile[1];
      }

      // Set the gender directly
      if (answers.profile[2]) {
        submissionData.gender = processAndCleanAnswer(
          answers.profile[2] as string
        );
      }

      // Set the age directly (birth year -> age conversion)
      if (answers.profile[3]) {
        const birthYear = parseInt(answers.profile[3] as string);
        const currentYear = new Date().getFullYear();
        submissionData.age = currentYear - birthYear;
      }

      // Set location directly
      if (answers.profile[4]) {
        submissionData.location = answers.profile[4];
      }

      // Set relationship goals based on marital status
      if (answers.profile[9]) {
        submissionData.relationshipGoals = "Serious";
      }

      // Parse preference age ranges
      if (answers.preferences[1]) {
        const ageRange = answers.preferences[1] as string;
        if (ageRange.includes("–")) {
          const [min, max] = ageRange.split("–").map((s) => {
            // Convert Bengali numbers to integers
            return parseInt(
              s.replace(/[০-৯]/g, (match) =>
                String.fromCharCode(match.charCodeAt(0) - 2534 + 48)
              )
            );
          });
          if (!isNaN(min)) submissionData.preferences.minAge = min;
          if (!isNaN(max)) submissionData.preferences.maxAge = max;
        }
      }

      // Process all profile answers
      Object.entries(answers.profile).forEach(([key, value]) => {
        const prefixedKey = `profile_${key}`;

        if (Array.isArray(value)) {
          // Join multi-select options with commas and translate
          const translatedValue = value
            .map((item) => processAndCleanAnswer(item))
            .join(", ");
          // Add to quiz answers
          quizAnswers[prefixedKey] = translatedValue;
        } else {
          // Translate and clean single value
          const translatedValue = processAndCleanAnswer(value as string);
          // Add to quiz answers
          quizAnswers[prefixedKey] = translatedValue;
        }
      });

      // Process preference answers
      Object.entries(answers.preferences).forEach(([key, value]) => {
        const prefixedKey = `preferences_${key}`;

        if (Array.isArray(value)) {
          // Join multi-select options with commas and translate
          const translatedValue = value
            .map((item) => processAndCleanAnswer(item))
            .join(", ");
          // Add to quiz answers
          quizAnswers[prefixedKey] = translatedValue;
        } else {
          // Translate and clean single value
          const translatedValue = processAndCleanAnswer(value as string);
          // Add to quiz answers
          quizAnswers[prefixedKey] = translatedValue;
        }
      });

      // Process personality answers
      Object.entries(answers.personality).forEach(([key, value]) => {
        if (typeof value === "string") {
          const personalityKey = `personality_${key}`;
          const translatedValue = processAndCleanAnswer(value);
          // Add to quiz answers
          quizAnswers[personalityKey] = translatedValue;
        }
      });

      // Set answers in personalityQuiz
      submissionData.personalityQuiz.answers = quizAnswers;

      // Calculate personality type and add it to submission
      if (Object.keys(answers.personality).length > 0) {
        const personalityType = determinePersonalityType(answers.personality);
        submissionData.personalityType = personalityType;
        submissionData.personalityQuiz.personalityType = personalityType;
      }

      console.log("Submitting quiz data to database:", submissionData);
      debugger;
      // Call API to save quiz data
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("সার্ভার রেসপন্স পার্স করতে সমস্যা হয়েছে");
      }

      if (!res.ok) {
        console.error("Server returned error:", data);
        throw new Error(data?.message || "কোয়িজ জমা দিতে সমস্যা হয়েছে");
      }

      console.log("Database update successful:", data);

      // Show success message and close modal
      setQuizCompleted(true);
      triggerCelebration();
      setPoints(points + 100); // Bonus points for completing

      // Redirect to matches page with fromQuiz=true to trigger fetching new matches
      router.push("/matches?fromQuiz=true");

      // Don't auto-close the modal to allow user to retake the quiz if they want
      // setTimeout(() => {
      //   onClose();
      // }, 3000);
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      setSubmissionError(error.message || "অজানা সমস্যা দেখা দিয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to navigate to matches page
  // const navigateToMatches = () => {
  //   submitQuiz();
  //   router.push("/matches");
  //   onClose(); // Close the quiz modal
  // };

  // Character animations based on mood
  const getCharacterAnimation = () => {
    switch (characterMood) {
      case "happy":
        return {
          y: [0, -10, 0],
          transition: {
            y: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            },
          },
        };
      case "thinking":
        return {
          rotate: [-5, 5, -5],
          transition: {
            rotate: {
              repeat: 3,
              duration: 0.5,
              ease: "easeInOut",
            },
          },
        };
      case "excited":
        return {
          scale: [1, 1.2, 1],
          y: [0, -15, 0],
          transition: {
            scale: {
              duration: 0.5,
            },
            y: {
              duration: 0.5,
            },
          },
        };
      default:
        return {};
    }
  };

  // Component for rendering card-select questions
  const CardSelectQuestion: React.FC<{
    questionObj: QuestionType;
    selected: string | string[] | undefined;
    onSelect: (answer: string) => void;
  }> = ({ questionObj, selected, onSelect }) => {
    return (
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {questionObj.options?.map((option) => {
            const isSelected = selected === option;
            return (
              <div
                key={option}
                onClick={() => onSelect(option)}
                className={`p-4 border rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="text-center">
                  {option}
                  {isSelected && (
                    <div className="mt-2 text-blue-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mx-auto"
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Component for rendering emoji-radio questions
  const EmojiRadioQuestion: React.FC<{
    questionObj: QuestionType;
    selected: string | string[] | undefined;
    onSelect: (answer: string) => void;
  }> = ({ questionObj, selected, onSelect }) => {
    const emojiMap: Record<string, string> = {
      পুরুষ: "👨",
      নারী: "👩",
      অন্যান্য: "🧑",
    };

    return (
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        {questionObj.options?.map((option) => {
          const isSelected = selected === option;
          return (
            <div
              key={option}
              onClick={() => onSelect(option)}
              className={`p-5 rounded-full cursor-pointer transition-all transform hover:scale-110 text-center ${
                isSelected
                  ? "bg-blue-500 text-white shadow-lg scale-110"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <div className="text-4xl mb-2">{emojiMap[option] || "⭐"}</div>
              <div className="text-sm font-medium">{option}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Component for rendering date-picker questions
  const DatePickerQuestion: React.FC<{
    questionObj: QuestionType;
    selected: string | string[] | undefined;
    onSelect: (answer: string) => void;
  }> = ({ questionObj, selected, onSelect }) => {
    return (
      <div className="mb-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[250px] overflow-y-auto pb-2">
            {questionObj.options?.map((year) => {
              const isSelected = selected === year;
              return (
                <div
                  key={year}
                  onClick={() => onSelect(year)}
                  className={`p-3 border rounded-lg cursor-pointer text-center transition-transform ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 transform scale-105 shadow-md"
                      : "border-gray-200 hover:border-blue-300 hover:transform hover:scale-105"
                  }`}
                >
                  {year}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get the current section key for answers
  const getSectionKey = (
    section: string
  ): "profile" | "preferences" | "personality" => {
    if (section === "profile") return "profile";
    if (section === "preferences") return "preferences";
    return "personality";
  };

  // Update the useEffect to handle all multi-select questions
  useEffect(() => {
    // This code runs when the current question changes
    const currentQuestionType = currentQuestionObj.type;

    if (currentQuestionType === "multi-select") {
      // For any multi-select question, initialize selected options
      const sectionKey = getSectionKey(quizSection);
      const existingAnswer = answers[sectionKey][currentQuestionObj.id];

      // Set the selected options if we have any existing answers
      if (existingAnswer && Array.isArray(existingAnswer)) {
        setSelectedOptions(existingAnswer);
      } else {
        setSelectedOptions([]);
      }
    } else {
      // Reset selected options for non-multi-select questions
      setSelectedOptions([]);
    }
  }, [
    currentQuestion,
    quizSection,
    currentQuestionObj.id,
    currentQuestionObj.type,
    answers,
  ]);

  // Add a function to reset and restart the quiz
  const restartQuiz = () => {
    // Reset all quiz state
    setQuizCompleted(false);
    setSubmissionError("");
    setCurrentQuestion(0);
    setQuizSection("profile");
    setStreakCount(0);
    setPoints(0);
    // Clear all answers
    setAnswers({
      profile: {},
      preferences: {},
      personality: {},
    });
    // Clear localStorage
    localStorage.removeItem("quizAnswers");
    // Start the quiz again
    setQuizStarted(true);
    setCharacterMood("excited");
    setTimeout(() => setCharacterMood("happy"), 1500);
  };

  // Add district selection component
  const DistrictSelection: React.FC<{
    selected: string | string[] | undefined;
    onSelect: (district: string) => void;
  }> = ({ selected, onSelect }) => {
    // State for search input
    const [searchQuery, setSearchQuery] = useState("");

    // Filter districts based on search
    const filteredDistricts = districts.filter((district) =>
      district.bn_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="জেলার নাম খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pb-2">
          {filteredDistricts.map((district) => {
            const isSelected = selected === district.name; // Changed from bn_name to name
            return (
              <div
                key={district.bn_name} // Changed from bn_name to name
                onClick={() => onSelect(district.name)} // Changed from bn_name to name
                className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {district.bn_name} {/* Keep displaying Bengali name in UI */}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Component for rendering radio buttons in a horizontal layout
  const SingleRowRadioQuestion: React.FC<{
    questionObj: QuestionType;
    selected: string | string[] | undefined;
    onSelect: (answer: string) => void;
  }> = ({ questionObj, selected, onSelect }) => {
    return (
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 justify-between">
          {questionObj.options?.map((option) => {
            const isSelected = selected === option;
            const optionParts = option.split(" ");
            const emoji = optionParts[optionParts.length - 1];
            const text = optionParts.slice(0, -1).join(" ");

            return (
              <div
                key={option}
                onClick={() => onSelect(option)}
                className={`flex-1 min-w-[70px] p-2 border rounded-lg cursor-pointer transition-all text-center transform ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 scale-105 shadow-md"
                    : "border-gray-200 hover:border-blue-300 hover:scale-105"
                }`}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-xs font-medium">{text}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Function to get section introduction text
  const getSectionIntroText = (section: string): string => {
    switch (section) {
      case "profile":
        return "আপনার সম্পর্কে কিছু মৌলিক তথ্য দিন যা আপনার পরিচয় তুলে ধরবে।";
      case "mbti":
        return "আপনার আসল ব্যক্তিত্ব প্রকাশ করুন। মনে রাখবেন, এই উত্তরের উপর ভিত্তি করেই আপনার ম্যাচিং করা হবে - আদর্শ উত্তর নয়, আপনার সত্যিকারের আচরণের উত্তর দিন।";
      case "preferences":
        return "আপনার সত্যিকারের পছন্দ-অপছন্দ জানান। আমরা এর মাধ্যমে আপনার জন্য উপযুক্ত সঙ্গী খুঁজে বের করব।";
      default:
        return "";
    }
  };

  // Update the div that contains the quiz modal to limit its height
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-purple-50 z-50 flex items-center justify-center overflow-hidden">
          {/* Website logo in the modal background */}
          <div className="absolute top-4 left-4">
            <Link href="/" className="text-2xl font-bold text-purple-800">
              তালাদ্রু
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative m-2">
            {/* Points display at top */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full font-bold z-10">
              ✨ {points} পয়েন্ট
            </div>

            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-purple-700">
                  {!quizStarted &&
                    !quizCompleted &&
                    "আপনার পারফেক্ট ম্যাচ খুঁজুন!"}
                  {quizStarted &&
                    !quizCompleted &&
                    (quizSection === "profile"
                      ? "প্রোফাইল তথ্য"
                      : quizSection === "personality"
                      ? "ব্যক্তিত্ব কুইজ"
                      : "পছন্দের বিবরণ")}
                  {quizCompleted && "অভিনন্দন! কুইজ সম্পূর্ণ হয়েছে!"}
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
                <div className="mt-2 flex items-center">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-300 ease-in-out"
                        style={{
                          width: `${
                            ((currentQuestion + 1) /
                              getVisibleQuestions().length) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-4 text-gray-600 font-medium text-sm">
                    প্রশ্ন {currentQuestion + 1} /{" "}
                    {getVisibleQuestions().length}
                  </span>
                </div>
              )}

              {/* Section progress indicators */}
              {quizStarted && !quizCompleted && (
                <div className="flex justify-center mt-2 space-x-4">
                  <div
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      quizSection === "profile"
                        ? "bg-purple-600 text-white font-medium"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    আপনার পরিচয়
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      quizSection === "personality"
                        ? "bg-purple-600 text-white font-medium"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    ব্যাক্তিত্ব
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      quizSection === "preferences"
                        ? "bg-purple-600 text-white font-medium"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    পছন্দ
                  </div>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Animated Character */}
              <motion.div
                className="w-24 h-24 mx-auto mb-2"
                animate={getCharacterAnimation()}
              >
                {characterMood === "happy" && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="#A78BFA" />
                    <circle cx="35" cy="40" r="5" fill="#FFFFFF" />
                    <circle cx="65" cy="40" r="5" fill="#FFFFFF" />
                    <path
                      d="M 30 60 Q 50 80 70 60"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      fill="transparent"
                    />
                  </svg>
                )}
                {characterMood === "thinking" && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="#A78BFA" />
                    <circle cx="35" cy="40" r="5" fill="#FFFFFF" />
                    <circle cx="65" cy="40" r="5" fill="#FFFFFF" />
                    <path
                      d="M 30 65 Q 50 65 70 65"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      fill="transparent"
                    />
                    <path
                      d="M 75 30 Q 85 35 80 40"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      fill="transparent"
                    />
                  </svg>
                )}
                {characterMood === "excited" && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="#A78BFA" />
                    <circle cx="35" cy="40" r="5" fill="#FFFFFF" />
                    <circle cx="65" cy="40" r="5" fill="#FFFFFF" />
                    <path
                      d="M 30 60 Q 50 85 70 60"
                      stroke="#FFFFFF"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <path
                      d="M 20 25 L 35 15"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      fill="transparent"
                    />
                    <path
                      d="M 80 25 L 65 15"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      fill="transparent"
                    />
                  </svg>
                )}
              </motion.div>

              {/* Streak counter */}
              {quizStarted && !quizCompleted && streakCount > 0 && (
                <div className="absolute top-16 left-4 bg-amber-400 text-amber-900 px-2 py-1 rounded-lg font-bold flex items-center text-sm">
                  <span className="mr-1">🔥</span>
                  {streakCount} স্ট্রিক
                </div>
              )}

              {/* Introduction Screen */}
              {!quizStarted && !quizCompleted && (
                <div className="text-center space-y-6">
                  <h4 className="text-xl font-semibold">
                    আপনার পারফেক্ট ম্যাচ আনলক করুন!
                  </h4>

                  <p className="text-gray-600">
                    আমাদের AI-পাওয়ার্ড কুইজ আপনার ব্যক্তিত্ব, পছন্দ এবং
                    সম্পর্কের ধরন বিশ্লেষণ করে আপনার সবচেয়ে উপযুক্ত ম্যাচগুলি
                    খুঁজে বের করে।
                  </p>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-left mb-2 font-medium text-purple-800">
                      সত্যি উত্তর দিন, কারণ:
                    </div>
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
                          আমরা আপনাকে অন্যদের তাদের আসল স্বভাবের উপর ভিত্তি করে
                          পরিচয় করাই
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
                        <span className="text-gray-700">
                          আপনার ব্যক্তিত্ব, আসক্তির ধরন, ও মূল্যবোধ অনুযায়ী
                          ম্যাচ নির্বাচিত হয়
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
                        <span className="text-gray-700">
                          আদর্শ উত্তর নয়, আসল আপনার উত্তর দিন - এতেই সুখী
                          সম্পর্ক গড়া সম্ভব
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="py-4">
                    <button
                      onClick={startQuiz}
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-10 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105 w-full md:w-auto"
                    >
                      শুরু করুন
                    </button>
                  </div>

                  <p className="text-sm text-gray-500">
                    সেরা ফলাফলের জন্য সততার সাথে উত্তর দিন!
                  </p>
                </div>
              )}

              {/* Quiz Questions */}
              {quizStarted && !quizCompleted && (
                <div className="space-y-6 relative">
                  {/* Section introduction text */}
                  {currentQuestion === 0 && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg text-purple-800 text-sm">
                      {getSectionIntroText(quizSection)}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${quizSection}_${currentQuestion}`}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className="text-xl font-semibold mb-2">
                        {currentQuestionObj.question}
                      </h4>
                      <p className="text-gray-500 mb-6">
                        {currentQuestionObj.description}
                      </p>

                      {/* Different question types rendering */}
                      {(() => {
                        const type = currentQuestionObj.type || "radio";

                        // Text input
                        if (type === "text") {
                          return (
                            <div className="space-y-4">
                              <input
                                type="text"
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                onChange={(e) => {
                                  const updatedAnswers = { ...answers };
                                  const sectionKey = getSectionKey(quizSection);
                                  updatedAnswers[sectionKey][
                                    currentQuestionObj.id
                                  ] = e.target.value;
                                  setAnswers(updatedAnswers);
                                }}
                                value={
                                  (answers[getSectionKey(quizSection)][
                                    currentQuestionObj.id
                                  ] as string) || ""
                                }
                                placeholder="আপনার উত্তর লিখুন..."
                                onKeyDown={(e) => {
                                  // Proceed to next question on Enter if there's input
                                  if (
                                    e.key === "Enter" &&
                                    answers[getSectionKey(quizSection)][
                                      currentQuestionObj.id
                                    ]
                                  ) {
                                    handleAnswerSelect(
                                      answers[getSectionKey(quizSection)][
                                        currentQuestionObj.id
                                      ] as string
                                    );
                                  }
                                }}
                              />
                              <div className="flex justify-start">
                                <button
                                  onClick={() => {
                                    if (
                                      answers[getSectionKey(quizSection)][
                                        currentQuestionObj.id
                                      ]
                                    ) {
                                      handleAnswerSelect(
                                        answers[getSectionKey(quizSection)][
                                          currentQuestionObj.id
                                        ] as string
                                      );
                                    }
                                  }}
                                  disabled={
                                    !answers[getSectionKey(quizSection)][
                                      currentQuestionObj.id
                                    ]
                                  }
                                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                                    answers[getSectionKey(quizSection)][
                                      currentQuestionObj.id
                                    ]
                                      ? "bg-purple-600 text-white hover:bg-purple-700"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                >
                                  পরবর্তী
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Location input (district selection with cards)
                        if (type === "location") {
                          return (
                            <DistrictSelection
                              selected={
                                answers[getSectionKey(quizSection)][
                                  currentQuestionObj.id
                                ]
                              }
                              onSelect={(district) =>
                                handleAnswerSelect(district)
                              }
                            />
                          );
                        }

                        // Date-picker (showing options in a grid)
                        if (
                          type === "date-picker" &&
                          currentQuestionObj.options
                        ) {
                          return (
                            <DatePickerQuestion
                              questionObj={currentQuestionObj}
                              selected={
                                answers[getSectionKey(quizSection)][
                                  currentQuestionObj.id
                                ]
                              }
                              onSelect={(value) => handleAnswerSelect(value)}
                            />
                          );
                        }

                        // Dropdown
                        if (type === "dropdown" && currentQuestionObj.options) {
                          return (
                            <div className="grid grid-cols-1 gap-3">
                              {currentQuestionObj.options.map(
                                (option, index) => (
                                  <motion.button
                                    key={index}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                      // Select the option and proceed automatically
                                      handleAnswerSelect(option);
                                    }}
                                    className={`flex items-center bg-white p-4 border rounded-lg cursor-pointer transition-all ${
                                      answers[getSectionKey(quizSection)][
                                        currentQuestionObj.id
                                      ] === option
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-blue-300"
                                    }`}
                                  >
                                    <span className="font-medium">
                                      {option}
                                    </span>
                                    {answers[getSectionKey(quizSection)][
                                      currentQuestionObj.id
                                    ] === option && (
                                      <svg
                                        className="ml-auto h-5 w-5 text-blue-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </motion.button>
                                )
                              )}
                            </div>
                          );
                        }

                        // Multi-select
                        if (
                          type === "multi-select" &&
                          currentQuestionObj.options
                        ) {
                          return (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pb-2">
                                {currentQuestionObj.options.map(
                                  (option, index) => {
                                    const isSelected =
                                      selectedOptions.includes(option);

                                    return (
                                      <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                          const updatedOptions = isSelected
                                            ? selectedOptions.filter(
                                                (item) => item !== option
                                              )
                                            : [...selectedOptions, option];

                                          setSelectedOptions(updatedOptions);
                                          const updatedAnswers = { ...answers };
                                          const sectionKey =
                                            getSectionKey(quizSection);
                                          updatedAnswers[sectionKey][
                                            currentQuestionObj.id
                                          ] = updatedOptions;
                                          setAnswers(updatedAnswers);

                                          // Save to localStorage
                                          localStorage.setItem(
                                            "quizAnswers",
                                            JSON.stringify(updatedAnswers)
                                          );
                                        }}
                                        className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                                          isSelected
                                            ? "bg-purple-100 border-purple-500 text-purple-700"
                                            : "bg-white border-gray-300 text-gray-700"
                                        }`}
                                      >
                                        <span className="font-medium">
                                          {option}
                                        </span>
                                        {isSelected && (
                                          <svg
                                            className="ml-2 w-5 h-5 text-purple-600"
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
                                        )}
                                      </motion.button>
                                    );
                                  }
                                )}
                              </div>
                              <div className="flex justify-start sticky bottom-0 mt-4 pt-2 bg-white">
                                <button
                                  onClick={() => {
                                    if (selectedOptions.length > 0) {
                                      // Special handling for key multi-select questions
                                      if (
                                        (quizSection === "profile" &&
                                          currentQuestionObj.id === 12) ||
                                        (quizSection === "preferences" &&
                                          currentQuestionObj.id === 2)
                                      ) {
                                        // Save the selected options
                                        const updatedAnswers = { ...answers };
                                        const sectionKey =
                                          getSectionKey(quizSection);
                                        updatedAnswers[sectionKey][
                                          currentQuestionObj.id
                                        ] = selectedOptions;
                                        setAnswers(updatedAnswers);

                                        // Save to localStorage
                                        localStorage.setItem(
                                          "quizAnswers",
                                          JSON.stringify(updatedAnswers)
                                        );

                                        // Increment streak and points
                                        setStreakCount((prev) => prev + 1);
                                        setPoints((prev) => prev + 10);

                                        // If streak hits multiples of 5, trigger celebration
                                        if ((streakCount + 1) % 5 === 0) {
                                          triggerCelebration();
                                          setPoints((prev) => prev + 20); // Bonus points for streak
                                        }

                                        // Check if we're at the end of a section
                                        const currentQuestionsArray =
                                          getVisibleQuestions();
                                        if (
                                          currentQuestion <
                                          currentQuestionsArray.length - 1
                                        ) {
                                          // Go to next question
                                          setCurrentQuestion(
                                            currentQuestion + 1
                                          );
                                          setSelectedOptions([]);
                                          setCharacterMood("thinking");
                                          setTimeout(
                                            () => setCharacterMood("happy"),
                                            800
                                          );
                                        } else {
                                          // Go to next section if we're at the last question
                                          goToNextSection();
                                        }
                                      } else {
                                        // Normal handling for other multi-select questions
                                        handleAnswerSelect(selectedOptions);
                                      }
                                    }
                                  }}
                                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                                  disabled={selectedOptions.length === 0}
                                >
                                  পরবর্তী
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Default radio buttons
                        if (currentQuestionObj.options) {
                          if (currentQuestionObj.type === "card-select") {
                            return (
                              <CardSelectQuestion
                                questionObj={currentQuestionObj}
                                selected={
                                  answers[getSectionKey(quizSection)][
                                    currentQuestionObj.id
                                  ]
                                }
                                onSelect={(value) => handleAnswerSelect(value)}
                              />
                            );
                          } else if (
                            currentQuestionObj.type === "emoji-radio"
                          ) {
                            return (
                              <EmojiRadioQuestion
                                questionObj={currentQuestionObj}
                                selected={
                                  answers[getSectionKey(quizSection)][
                                    currentQuestionObj.id
                                  ]
                                }
                                onSelect={(value) => handleAnswerSelect(value)}
                              />
                            );
                          } else if (
                            quizSection === "personality" &&
                            currentQuestionObj.type === "radio"
                          ) {
                            // Use our horizontal radio layout for personality questions
                            return (
                              <SingleRowRadioQuestion
                                questionObj={currentQuestionObj}
                                selected={
                                  answers[getSectionKey(quizSection)][
                                    currentQuestionObj.id
                                  ]
                                }
                                onSelect={(value) => handleAnswerSelect(value)}
                              />
                            );
                          } else {
                            // Default radio buttons for other sections
                            return (
                              <div className="grid grid-cols-1 gap-3">
                                {currentQuestionObj.options.map(
                                  (option, index) => (
                                    <motion.button
                                      key={index}
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => {
                                        // Select the option and proceed automatically
                                        handleAnswerSelect(option);
                                      }}
                                      className={`flex items-center bg-white p-4 border rounded-lg cursor-pointer transition-all ${
                                        answers[getSectionKey(quizSection)][
                                          currentQuestionObj.id
                                        ] === option
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-blue-300"
                                      }`}
                                    >
                                      <span className="font-medium">
                                        {option}
                                      </span>
                                      {answers[getSectionKey(quizSection)][
                                        currentQuestionObj.id
                                      ] === option && (
                                        <svg
                                          className="ml-auto h-5 w-5 text-blue-500"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </motion.button>
                                  )
                                )}
                              </div>
                            );
                          }
                        }

                        return (
                          <div className="text-center py-4">
                            <p>
                              সমস্যা হয়েছে। পরবর্তী প্রশ্নে যাওয়ার জন্য ক্লিক
                              করুন।
                            </p>
                            <button
                              onClick={() => {
                                setCurrentQuestion(currentQuestion + 1);
                              }}
                              className="mt-3 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                              পরবর্তী প্রশ্নে যান
                            </button>
                          </div>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* Completion Screen */}
              {quizCompleted && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <svg
                      className="w-16 h-16 text-green-600"
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
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h4 className="text-2xl font-semibold">
                      অভিনন্দন! কুইজ সম্পূর্ণ হয়েছে
                    </h4>

                    <p className="text-gray-600 mt-4">
                      আপনি সফলভাবে {points} পয়েন্ট অর্জন করেছেন!
                    </p>

                    <div className="bg-purple-50 p-4 rounded-lg mt-4 mb-6 inline-block">
                      <div className="text-2xl font-bold text-purple-700">
                        🎁 পুরস্কার অর্জিত
                      </div>
                      <p className="text-purple-700">
                        আপনার ব্যক্তিত্ব প্রোফাইল তৈরি হয়েছে!
                      </p>
                    </div>

                    <p className="text-gray-600">
                      আমাদের AI আপনার উত্তর বিশ্লেষণ করতে এবং আপনার পারফেক্ট
                      ম্যাচ খুঁজে বের করতে প্রস্তুত।
                    </p>

                    {submissionError && (
                      <div className="py-2 px-4 bg-red-50 text-red-600 rounded-lg mt-4">
                        {submissionError}
                      </div>
                    )}

                    <div className="py-6 flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={submitQuiz}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-10 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105"
                      >
                        {isSubmitting ? "প্রসেসিং..." : "আপনার ম্যাচগুলি দেখুন"}
                      </button>

                      <button
                        onClick={restartQuiz}
                        disabled={isSubmitting}
                        className="bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-10 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105"
                      >
                        কুইজ পুনরায় শুরু করুন
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Celebration overlay */}
              {showCelebration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 8 }}
                    className="bg-purple-600 text-white font-bold text-2xl px-8 py-4 rounded-xl"
                  >
                    +{streakCount % 5 === 0 ? "20" : "10"} পয়েন্ট!
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* Modal Footer */}
            {quizStarted && !quizCompleted && (
              <div className="p-6 border-t border-gray-200 flex justify-between sticky bottom-0 bg-white z-10">
                <button
                  onClick={prevQuestion}
                  className={`px-5 py-2 rounded-full font-medium ${
                    currentQuestion === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-purple-600 hover:bg-purple-50"
                  }`}
                  disabled={currentQuestion === 0}
                >
                  পেছনে
                </button>
                <div className="text-gray-500">
                  {currentQuestion + 1} / {getVisibleQuestions().length} প্রশ্ন
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

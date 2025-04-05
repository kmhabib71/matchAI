"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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
    mbti: Record<number, string>;
  }>({
    profile: {},
    preferences: {},
    mbti: {},
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
    "profile" | "mbti" | "preferences"
  >("profile");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

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
      options: ["ছাত্র", "চাকুরিজীবী", "ব্যবসায়ী", "ফ্রিল্যান্সার", "বেকার"],
      type: "card-select",
      description: "জীবনধারা ও আগ্রহের সামঞ্জস্য নিশ্চিত করুন।",
    },
    {
      id: 6,
      question: "আপনার মাসিক আয় কত?",
      options: [
        "৳০–৫,০০০",
        "৳৫,০০১–১৫,০০০",
        "৳১৫,০০১–৩০,০০০",
        "৳৩০,০০১–৫০,০০০",
        "৳৫০,০০০+",
      ],
      type: "card-select",
      description: "অর্থনৈতিক সামঞ্জস্য নির্ধারণে সহায়ক।",
      condition: {
        field: "profession",
        showIf: ["চাকুরিজীবী", "ব্যবসায়ী", "ফ্রিল্যান্সার", "বেকার"],
      },
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
      id: 10,
      question: "আপনার কি সন্তান রয়েছে?",
      options: ["হ্যাঁ", "না", "ভবিষ্যতে ভাবছি"],
      type: "radio",
      description: "পরিবার পরিকল্পনা সম্পর্কে ধারণা পেতে।",
      condition: {
        field: "marital_status",
        showIf: ["অবিবাহিত", "বিধবা/বিপত্নীক"],
      },
    },
    {
      id: 11,
      question: "আপনি ধূমপান করেন?",
      options: ["হ্যাঁ", "না", "মাঝেমধ্যে"],
      type: "radio",
      description: "জীবনধারার সামঞ্জস্য বোঝার জন্য।",
      condition: {
        field: "gender",
        showIf: ["পুরুষ"],
      },
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
      options: ["ছাত্র", "চাকুরিজীবী", "ব্যবসায়ী", "ফ্রিল্যান্সার", "বেকার"],
      type: "multi-select",
      description: "জীবনধারা ও আগ্রহের সামঞ্জস্য নিশ্চিত করুন।",
    },
    {
      id: 3,
      question: "সঙ্গীর মাসিক আয় সম্পর্কে আপনার প্রত্যাশা কী?",
      options: [
        "ঐচ্ছিক",
        "৳০–৫,০০০",
        "৳৫,০০১–১৫,০০০",
        "৳১৫,০০১–৩০,০০০",
        "৳৩০,০০১–৫০,০০০",
        "৳৫০,০০০+",
      ],
      type: "dropdown",
      description: "অর্থনৈতিক সামঞ্জস্য সম্পর্কে ধারণা দিন।",
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

  const mbtiFriendlyQuestions = [
    // I vs E
    {
      id: 1,
      question: "আপনি নিজেকে কিভাবে বর্ণনা করবেন?",
      options: ["লাজুক ও চুপচাপ", "মিশুক ও প্রাণবন্ত", "দুটোই একটু একটু"],
      type: "radio",
      description: "আপনার সামাজিক আচরণ ও শক্তি পুনরুদ্ধারের ধরন বোঝাতে সহায়ক।",
    },
    {
      id: 2,
      question: "আপনার ছুটির দিন কিভাবে কাটাতে পছন্দ করেন?",
      options: [
        "ভ্রমণ",
        "বন্ধুদের সাথে আড্ডা",
        "বাসায় বিশ্রাম",
        "ব্যায়াম",
        "সিনেমা দেখা",
      ],
      type: "radio",
      description: "আপনার আনন্দ নেওয়ার ধরন ও সামাজিক পছন্দ প্রকাশ করে।",
    },
    // S vs N
    {
      id: 3,
      question:
        "আপনি কি ভালোবাসার প্রথম দর্শনে বিশ্বাস করেন নাকি সময়ের সাথে তৈরি হয়?",
      options: [
        "প্রথম দর্শনেই ভালোবাসা হয়",
        "সময়ের সাথে ভালোবাসা গড়ে ওঠে",
        "নিশ্চিত নই",
      ],
      type: "radio",
      description: "বাস্তবতা বনাম ধারণাশক্তির উপর নির্ভর করে সম্পর্কের ধারণা।",
    },
    {
      id: 4,
      question: "আপনার কাছে পারফেক্ট ডেট কেমন?",
      options: [
        "রোমান্টিক ডিনার",
        "অ্যাডভেঞ্চার ভ্রমণ",
        "একসাথে সিনেমা দেখা",
        "একসাথে রান্না করা",
      ],
      type: "radio",
      description: "আপনার কল্পনা ও বাস্তব অভিজ্ঞতার প্রতি ঝোঁক প্রকাশ করে।",
    },
    // T vs F
    {
      id: 5,
      question: "সম্পর্কে আপনি বেশি আবেগী নাকি বাস্তববাদী?",
      options: ["বেশি আবেগী", "বেশি বাস্তববাদী", "দুটোর মিশ্রণ"],
      type: "radio",
      description: "আপনার সিদ্ধান্ত গ্রহণের ধরন ও আবেগের গুরুত্ব বোঝায়।",
    },
    {
      id: 6,
      question: "আপনি ঝগড়া কিভাবে সামলান?",
      options: [
        "আলোচনা করি",
        "কিছু সময় একা থাকি",
        "চুপচাপ থাকি",
        "এড়িয়ে চলি",
      ],
      type: "radio",
      description:
        "সংঘর্ষ মোকাবিলায় যুক্তি বনাম আবেগের ভূমিকা নির্ধারণে সহায়ক।",
    },
    // J vs P
    {
      id: 7,
      question: "আপনি সকালবেলা মানুষ নাকি রাতজাগা?",
      options: [
        "সকালে উঠতে পছন্দ করি",
        "রাতে জেগে থাকতে পছন্দ করি",
        "যখন যেমন",
      ],
      type: "radio",
      description: "আপনার রুটিন ও সময় ব্যবস্থাপনার ধরন প্রকাশ করে।",
    },
    {
      id: 8,
      question: "আপনি কিভাবে ভালোবাসা প্রকাশ করেন?",
      options: [
        "মিষ্টি কথা বলা",
        "একসাথে সময় কাটানো",
        "সাহায্য করা",
        "হাত ধরা ও আলিঙ্গন",
        "উপহার দেওয়া",
      ],
      type: "radio",
      description: "আপনার ব্যক্তিগত পছন্দ ও সম্পর্কের অগ্রাধিকার দেখায়।",
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
        : mbtiFriendlyQuestions;

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
      mbti: {},
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

      // Move to MBTI section
      setQuizSection("mbti");
      triggerCelebration();
      setPoints((prev) => prev + 50);
      setCharacterMood("excited");
      setTimeout(() => setCharacterMood("happy"), 1000);
    } else if (quizSection === "mbti") {
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
    if (answers[`mbti_1`] === "লাজুক ও চুপচাপ") types.I += 2;
    else if (answers[`mbti_1`] === "মিশুক ও প্রাণবন্ত") types.E += 2;
    else if (answers[`mbti_1`] === "দুটোই একটু একটু") {
      types.I++;
      types.E++;
    }

    if (answers[`mbti_2`] === "বাসায় বিশ্রাম") types.I++;
    else if (answers[`mbti_2`] === "বন্ধুদের সাথে আড্ডা") types.E++;

    if (answers[`mbti_3`] === "প্রথম দর্শনেই ভালোবাসা হয়") types.N++;
    else if (answers[`mbti_3`] === "সময়ের সাথে ভালোবাসা গড়ে ওঠে") types.S++;

    if (answers[`mbti_4`] === "অ্যাডভেঞ্চার ভ্রমণ") types.N++;
    else if (
      answers[`mbti_4`] === "রোমান্টিক ডিনার" ||
      answers[`mbti_4`] === "একসাথে রান্না করা"
    )
      types.S++;

    if (answers[`mbti_5`] === "বেশি আবেগী") types.F += 2;
    else if (answers[`mbti_5`] === "বেশি বাস্তববাদী") types.T += 2;
    else if (answers[`mbti_5`] === "দুটোর মিশ্রণ") {
      types.F++;
      types.T++;
    }

    if (answers[`mbti_6`] === "আলোচনা করি") types.T++;
    else if (
      answers[`mbti_6`] === "কিছু সময় একা থাকি" ||
      answers[`mbti_6`] === "চুপচাপ থাকি"
    )
      types.F++;

    if (answers[`mbti_7`] === "সকালে উঠতে পছন্দ করি") types.J++;
    else if (answers[`mbti_7`] === "রাতে জেগে থাকতে পছন্দ করি") types.P++;
    else if (answers[`mbti_7`] === "যখন যেমন") {
      types.J += 0.5;
      types.P += 0.5;
    }

    if (
      answers[`mbti_8`] === "উপহার দেওয়া" ||
      answers[`mbti_8`] === "হাত ধরা ও আলিঙ্গন"
    )
      types.F++;
    else if (answers[`mbti_8`] === "সাহায্য করা") types.T++;

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
    "১৮–২২": "18-22",
    "২৩–২৭": "23-27",
    "২৮–৩২": "28-32",
    "৩৩–৩৭": "33-37",
    "৩৮–৪৫": "38-45",
    "৪৫+": "45+",

    ঐচ্ছিক: "Optional",
    "৳০–৫,০০০": "BDT 0-5,000",
    "৳৫,০০১–১৫,০০০": "BDT 5,001-15,000",
    "৳১৫,০০১–৩০,০০০": "BDT 15,001-30,000",
    "৳৩০,০০১–৫০,০০০": "BDT 30,001-50,000",
    "৳৫০,০০০+": "BDT 50,000+",

    "মনে নেই": "Don't care",
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
          minAge: 18,
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
          smoking:
            bengaliToEnglishMap[answers.profile[11] as string] ||
            answers.profile[11],
          drinking: "No", // Default values
          diet: "Any",
          religion: bengaliToEnglishMap[answers.profile[8] as string] || "Any",
        };
      }

      // Set the name directly
      if (answers.profile[1]) {
        submissionData.name = answers.profile[1];
      }

      // Set the gender directly
      if (answers.profile[2]) {
        submissionData.gender =
          bengaliToEnglishMap[answers.profile[2] as string] ||
          answers.profile[2];
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
            .map((item) => bengaliToEnglishMap[item] || item)
            .join(", ");
          // Add to quiz answers
          quizAnswers[prefixedKey] = translatedValue;
        } else {
          // Translate single value if it exists in the map
          const translatedValue =
            bengaliToEnglishMap[value as string] || (value as string);
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
            .map((item) => bengaliToEnglishMap[item] || item)
            .join(", ");
          // Add to quiz answers
          quizAnswers[prefixedKey] = translatedValue;
        } else {
          // Translate single value if it exists in the map
          const translatedValue =
            bengaliToEnglishMap[value as string] || (value as string);
          // Add to quiz answers
          quizAnswers[prefixedKey] = translatedValue;
        }
      });

      // Process mbti answers
      Object.entries(answers.mbti).forEach(([key, value]) => {
        if (typeof value === "string") {
          const mbtiKey = `mbti_${key}`;
          const translatedValue = bengaliToEnglishMap[value] || value;
          // Add to quiz answers
          quizAnswers[mbtiKey] = translatedValue;
        }
      });

      // Set answers in personalityQuiz
      submissionData.personalityQuiz.answers = quizAnswers;

      // Calculate MBTI personality type and add it to submission
      if (Object.keys(answers.mbti).length > 0) {
        const personalityType = determinePersonalityType(answers.mbti);
        submissionData.personalityType = personalityType;
        submissionData.personalityQuiz.personalityType = personalityType;
      }

      console.log("Submitting quiz data to database:", submissionData);

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
  const navigateToMatches = () => {
    router.push("/matches");
    onClose(); // Close the quiz modal
  };

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
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
  ): "profile" | "preferences" | "mbti" => {
    if (section === "profile") return "profile";
    if (section === "preferences") return "preferences";
    return "mbti";
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
      mbti: {},
    });
    // Clear localStorage
    localStorage.removeItem("quizAnswers");
    // Start the quiz again
    setQuizStarted(true);
    setCharacterMood("excited");
    setTimeout(() => setCharacterMood("happy"), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-purple-50 z-50 flex items-center justify-center">
      {/* Website logo in the modal background */}
      <div className="absolute top-4 left-4">
        <h1 className="text-2xl font-bold text-purple-800">তালাদ্রু</h1>
      </div>

      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto relative">
        {/* Points display at top */}
        <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full font-bold">
          ✨ {points} পয়েন্ট
        </div>

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-purple-700">
              {!quizStarted && !quizCompleted && "আপনার পারফেক্ট ম্যাচ খুঁজুন!"}
              {quizStarted &&
                !quizCompleted &&
                (quizSection === "profile"
                  ? "প্রোফাইল তথ্য"
                  : quizSection === "mbti"
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
            <div className="mt-4 flex items-center">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${
                        ((currentQuestion + 1) / getVisibleQuestions().length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-gray-600 font-medium">
                প্রশ্ন {currentQuestion + 1} / {getVisibleQuestions().length}
              </span>
            </div>
          )}

          {/* Section progress indicators */}
          {quizStarted && !quizCompleted && (
            <div className="flex justify-center mt-4 space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  quizSection === "profile" ? "bg-purple-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full ${
                  quizSection === "mbti" ? "bg-purple-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full ${
                  quizSection === "preferences"
                    ? "bg-purple-600"
                    : "bg-gray-300"
                }`}
              ></div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Animated Character */}
          <motion.div
            className="w-32 h-32 mx-auto mb-4"
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
                আমাদের AI-পাওয়ার্ড কুইজ আপনার ব্যক্তিত্ব, পছন্দ এবং সম্পর্কের
                ধরন বিশ্লেষণ করে আপনার সবচেয়ে উপযুক্ত ম্যাচগুলি খুঁজে বের করে।
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
                    <span className="text-gray-700">মাত্র ৩টি কুইজ সেকশন</span>
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
                      মাত্র ৫ মিনিট সময় লাগবে
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
                    <span className="text-gray-700">৯৫% নির্ভুল ম্যাচিং</span>
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

                    // Location input (similar to text)
                    if (type === "location") {
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
                            placeholder="আপনার শহর/অঞ্চল লিখুন..."
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

                    // Date-picker (showing options in a grid)
                    if (type === "date-picker" && currentQuestionObj.options) {
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
                          {currentQuestionObj.options.map((option, index) => (
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
                              <span className="font-medium">{option}</span>
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
                          ))}
                        </div>
                      );
                    }

                    // Multi-select
                    if (type === "multi-select" && currentQuestionObj.options) {
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            {currentQuestionObj.options.map((option, index) => {
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
                                  <span className="font-medium">{option}</span>
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
                            })}
                          </div>
                          <div className="flex justify-start">
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
                                      setCurrentQuestion(currentQuestion + 1);
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

                    // Emoji-radio or radio (default case)
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
                      } else if (currentQuestionObj.type === "emoji-radio") {
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
                      } else {
                        // Default radio buttons
                        return (
                          <div className="grid grid-cols-1 gap-3">
                            {currentQuestionObj.options.map((option, index) => (
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
                                <span className="font-medium">{option}</span>
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
                            ))}
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
                  আমাদের AI আপনার উত্তর বিশ্লেষণ করতে এবং আপনার পারফেক্ট ম্যাচ
                  খুঁজে বের করতে প্রস্তুত।
                </p>

                {submissionError && (
                  <div className="py-2 px-4 bg-red-50 text-red-600 rounded-lg mt-4">
                    {submissionError}
                  </div>
                )}

                <div className="py-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={navigateToMatches}
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
              পেছনে
            </button>
            <div className="text-gray-500">
              {currentQuestion + 1} / {getVisibleQuestions().length} প্রশ্ন
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

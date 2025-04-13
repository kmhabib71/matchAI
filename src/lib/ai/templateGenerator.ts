import { IUser } from "@/models/User";
import {
  CompatibilityScore as ImportedCompatibilityScore,
  getPersonalityTraits,
} from "./matchingAlgorithm";

// Extend imported CompatibilityScore
interface ExtendedCompatibilityScore extends ImportedCompatibilityScore {
  personalityScore?: number;
  attachmentScore?: number;
  valuesScore?: number;
  hobbiesScore?: number;
  demographicsScore?: number;
  preferencesScore?: number;
}

// Type alias for convenience
type CompatibilityScore = ExtendedCompatibilityScore;

// Convert number to Bengali numerals
function toBengaliNumber(num: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (m) => bengaliDigits[parseInt(m)]);
}

// Convert decimal number (like 75.5) to Bengali format
function toBengaliDecimal(num: number): string {
  const parts = num.toFixed(1).split(".");
  return `${toBengaliNumber(parseInt(parts[0]))}.${toBengaliNumber(
    parseInt(parts[1])
  )}`;
}

// Get a random item from an array
function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Generate trait descriptions based on the score
function getTraitDescription(
  trait: string,
  userScore: number,
  candidateScore: number
): string {
  const bengUserScore = toBengaliNumber(userScore);
  const bengCandidateScore = toBengaliNumber(candidateScore);

  // Different description formats for variety
  const formats = [
    // Format 1: Standard
    () => {
      const difference = Math.abs(userScore - candidateScore);

      if (difference === 0) {
        return `${trait} এর ক্ষেত্রে আপনি (${bengUserScore}/৫) এবং তিনি (${bengCandidateScore}/৫) একই মাত্রায় রয়েছে, যা আপনাদের একে অপরকে সহজেই বুঝতে সাহায্য করবে।`;
      } else if (difference <= 1) {
        return `${trait} এর ক্ষেত্রে আপনি (${bengUserScore}/৫) এবং তিনি (${bengCandidateScore}/৫) খুব কাছাকাছি, সম্পর্কের ভারসাম্য তৈরি করতে এমন মিল বেশ গুরুত্বপূর্ণ।`;
      } else {
        return `${trait} এর ক্ষেত্রে আপনি (${bengUserScore}/৫) এবং তিনি (${bengCandidateScore}/৫) ভিন্ন, যা আপনাদের নিজেকে নতুনভাবে দেখার সুযোগ এনে দিতে পারে।`;
      }
    },

    // Format 2: Trait-specific
    () => {
      const traitBenefits: { [key: string]: string } = {
        উন্মুক্ততা: "যা আপনাদের নতুন অভিজ্ঞতা গ্রহণে উৎসাহ দেবে",
        সচেতনতা: "যা আপনাদের পরিকল্পনা ও লক্ষ্য পূরণে সাহায্য করবে",
        বহির্মুখিতা: "যা আপনাদের সামাজিক সম্পর্ককে প্রাণবন্ত করবে",
        সহমর্মিতা: "যা আপনাদের কথোপকথন ও সংঘর্ষ নিরসনে সহায়তা করবে",
        উদ্বেগপ্রবণতা: "যা আপনাদের আবেগের প্রতি আরও সচেতন হতে শেখাবে",
      };

      const benefit =
        traitBenefits[trait] ||
        "যা আপনাদের সম্পর্ককে আরও গভীর ও অর্থবহ করে তুলবে";

      return `আপনার ${trait} (${bengUserScore}/৫) এবং তাঁর ${trait} (${bengCandidateScore}/৫) একে অপরের পরিপূরক, ${benefit}।`;
    },

    // Format 3: Concise with comparison
    () => {
      if (userScore === candidateScore) {
        return `আপনাদের উভয়ের ${trait} একই (${bengUserScore}/৫), যা আপনাদের দৃষ্টিভঙ্গিতে মিল আনবে।`;
      } else if (userScore > candidateScore) {
        return `আপনার ${trait} (${bengUserScore}/৫) তাঁর থেকে (${bengCandidateScore}/৫) বেশি, যা সম্পর্ককে ভারসাম্য আনতে পারে।`;
      } else {
        return `আপনার ${trait} (${bengUserScore}/৫) তাঁর তুলনায় (${bengCandidateScore}/৫) কম, যা আপনাদের পরিপূরক করবে।`;
      }
    },
  ];

  // Select a random format
  return formats[Math.floor(Math.random() * formats.length)]();
}

// Get a description of shared hobbies
function getSharedHobbiesDescription(
  userHobbies: string[],
  candidateHobbies: string[]
): string {
  // Find shared hobbies
  const sharedHobbies = userHobbies.filter((hobby) =>
    candidateHobbies.some(
      (candidateHobby) =>
        candidateHobby.toLowerCase().includes(hobby.toLowerCase()) ||
        hobby.toLowerCase().includes(candidateHobby.toLowerCase())
    )
  );

  if (sharedHobbies.length === 0) {
    const phrases = [
      "আপনাদের বিভিন্ন আগ্রহ একে অপরকে নতুন অভিজ্ঞতার দিকে নিয়ে যাবে।",
      "আপনাদের ভিন্ন ভিন্ন শখ আপনাদের জীবনে বৈচিত্র্য আনবে।",
      "আপনাদের পৃথক আগ্রহগুলি আপনাদের একে অপরের কাছ থেকে নতুন বিষয়ে শেখার সুযোগ করে দেবে।",
    ];
    return getRandomItem(phrases);
  } else {
    const sharedInterests = sharedHobbies.slice(0, 2).join(" এবং ");
    const phrases = [
      `আপনাদের উভয়ের ${sharedInterests} এর প্রতি আগ্রহ একটি শক্তিশালী বন্ধন তৈরি করবে।`,
      `আপনাদের দুজনই ${sharedInterests} পছন্দ করেন, যা একসাথে আনন্দদায়ক সময় কাটানোর সুযোগ করে দেবে।`,
      `${sharedInterests} এর প্রতি আপনাদের উভয়ের আগ্রহ আপনাদের মধ্যে যোগাযোগের সেতু তৈরি করে দেবে।`,
    ];
    return getRandomItem(phrases);
  }
}

// Get a conclusion based on overall compatibility
function getConclusion(score: number): string {
  if (score >= 85) {
    const phrases = [
      "সামগ্রিকভাবে, আপনাদের মধ্যে একটি গভীর এবং দীর্ঘস্থায়ী সম্পর্ক গড়ে ওঠার সম্ভাবনা অত্যন্ত উজ্জ্বল।",
      "আপনাদের সম্পর্কের সম্ভাবনা অত্যন্ত আশাব্যঞ্জক, যেখানে আপনারা একে অপরের জীবনকে সমৃদ্ধ করতে পারবেন।",
      "আপনাদের উচ্চ মাত্রার মিল একটি অসাধারণ সম্পর্কের ইঙ্গিত দেয়, যেখানে আপনারা উভয়েই সুখী হতে পারবেন।",
    ];
    return getRandomItem(phrases);
  } else if (score >= 70) {
    const phrases = [
      "সামগ্রিকভাবে, আপনাদের মধ্যে একটি সুখী ও ভারসাম্যপূর্ণ সম্পর্ক গড়ে তোলার সুযোগ রয়েছে।",
      "আপনাদের মিল দেখে মনে হয় আপনারা একসাথে একটি সুন্দর ভবিষ্যত গড়তে পারবেন।",
      "আপনাদের সামঞ্জস্যপূর্ণ বৈশিষ্ট্যগুলি একটি স্থিতিশীল ও সন্তোষজনক সম্পর্কের ভিত্তি স্থাপন করবে।",
    ];
    return getRandomItem(phrases);
  } else {
    const phrases = [
      "আপনাদের মধ্যে কিছু মিল এবং কিছু পার্থক্য রয়েছে, যা একে অপরকে নতুনভাবে বুঝতে সাহায্য করতে পারে।",
      "আপনাদের বৈচিত্র্যময় বৈশিষ্ট্যগুলি একে অপরকে নতুন দৃষ্টিকোণ থেকে দেখতে সহায়তা করবে।",
      "আপনাদের মধ্যে পার্থক্যগুলি আপনাদের সম্পর্ককে আরও সমৃদ্ধ করতে পারে, যদি আপনারা একে অপরের বৈশিষ্ট্যগুলিকে সম্মান করেন। সফল সম্পর্কের জন্য বোঝাপড়া, ধৈর্য এবং পারস্পরিক শ্রদ্ধা গুরুত্বপূর্ণ।",
    ];
    return getRandomItem(phrases);
  }
}

/**
 * Generate a modern English template with emojis and personalized insights
 * This matches the examples provided in the format "Hi [name], [match] is a X% match for you..."
 */
function generateModernEnglishTemplate(
  user: UserProfile,
  candidate: UserProfile,
  score: CompatibilityScore
): string {
  // Get name or username
  const userName = user.name || user.username || "there";
  const candidateName = candidate.name || candidate.username || "Your match";

  // Round score to nearest integer
  const matchPercentage = Math.round(score.score);

  // Get personality match percentage
  const personalityPercent = Math.round((score.personalityScore || 0) * 100);

  // Get top matching personality traits
  const topTraits = getTopMatchingTraits(
    user.personalityTraits,
    candidate.personalityTraits,
    3
  );
  const trait1 = humanizeTraitName(topTraits[0]?.trait || "openness");
  const trait2 = humanizeTraitName(topTraits[1]?.trait || "empathy");

  // Get attachment style scores
  // Note: In a real implementation, you would extract this from user/candidate data
  const userAttachment = Math.round(
    (user.personalityTraits?.agreeableness || 0) * 1.25
  );
  const candidateAttachment = Math.round(
    (candidate.personalityTraits?.agreeableness || 0) * 1.25
  );

  // Get values - simplified approach
  // In a real implementation, you would extract shared values from user data
  const sharedValues = generateSharedValues(user, candidate);

  // Intro line
  let template = `Hi ${userName}, ${candidateName} is a ${matchPercentage}% match for you — and here's why it feels real.\n\n`;

  // Personality insight
  template += `🧠 Both of you scored high on ${trait1.toLowerCase()} and ${trait2.toLowerCase()} (${personalityPercent}% personality alignment). That means deeper chats and less "small talk" — the connection starts real.\n\n`;

  // Attachment style insight
  template += `💬 You value emotional security and so does ${
    candidate.gender === "female" ? "she" : "he"
  } (secure attachment: ${userAttachment}/5 each). That's a solid base for trust without overthinking.\n\n`;

  // Values insight
  template += `🎯 Shared values like "${sharedValues[0]}" and "${sharedValues[1]}" mean your priorities are built to last together.\n\n`;

  // Conclusion
  template += `✨ You're not just compatible — you're looking in the same direction.`;

  return template;
}

// Helper function to humanize trait names for better readability
function humanizeTraitName(trait: string): string {
  const humanizedNames: Record<string, string> = {
    "নতুন অভিজ্ঞতার প্রতি উন্মুক্ততা": "Openness",
    কর্তব্যপরায়ণতা: "Conscientiousness",
    বহির্মুখিতা: "Extraversion",
    "সহমত হওয়ার প্রবণতা": "Agreeableness",
    "উদ্বেগ প্রবণতা": "Neuroticism",
    openness: "Openness",
    conscientiousness: "Conscientiousness",
    extraversion: "Extraversion",
    agreeableness: "Empathy",
    neuroticism: "Emotional stability",
  };

  return humanizedNames[trait] || trait;
}

// Helper function to generate shared values based on personality traits
function generateSharedValues(
  user: UserProfile,
  candidate: UserProfile
): string[] {
  // In a real implementation, you would extract this from actual user data
  // For now, we'll infer likely values based on personality traits
  const valueOptions = [
    "family-first",
    "career-driven",
    "personal growth",
    "adventure-seeking",
    "community-focused",
    "intellectual curiosity",
    "creativity",
    "tradition",
    "independence",
    "spiritual growth",
    "health-conscious",
    "loyalty",
  ];

  // Use personality traits to "select" values
  const selectedValues: string[] = [];

  // High conscientiousness often correlates with career focus
  if (
    ((user.personalityTraits?.conscientiousness || 3) +
      (candidate.personalityTraits?.conscientiousness || 3)) /
      2 >
    3.5
  ) {
    selectedValues.push("career-driven");
  }

  // High agreeableness often correlates with family focus
  if (
    ((user.personalityTraits?.agreeableness || 3) +
      (candidate.personalityTraits?.agreeableness || 3)) /
      2 >
    3.5
  ) {
    selectedValues.push("family-first");
  }

  // High openness correlates with intellectual curiosity
  if (
    ((user.personalityTraits?.openness || 3) +
      (candidate.personalityTraits?.openness || 3)) /
      2 >
    3.5
  ) {
    selectedValues.push("intellectual curiosity");
  }

  // Fill remaining spots with random values
  while (selectedValues.length < 3) {
    const randomValue =
      valueOptions[Math.floor(Math.random() * valueOptions.length)];
    if (!selectedValues.includes(randomValue)) {
      selectedValues.push(randomValue);
    }
  }

  return selectedValues;
}

/**
 * Generate a modern Bangla template with emojis and personalized insights
 * This matches the examples provided in the format "হাই [name], [match] তোমার সাথে X% মিল"
 */
function generateModernBanglaTemplate(
  user: UserProfile,
  candidate: UserProfile,
  score: CompatibilityScore
): string {
  // Get name or username
  const userName = user.name || user.username || "বন্ধু";
  const candidateName = candidate.name || candidate.username || "এই ব্যক্তি";

  // Round score to nearest integer
  const matchPercentage = Math.round(score.score);

  // Get personality match percentage
  const personalityPercent = Math.round((score.personalityScore || 0) * 100);

  // Get top matching personality traits
  const topTraits = getTopMatchingTraits(
    user.personalityTraits,
    candidate.personalityTraits,
    3
  );
  const trait1 = getBanglaTraitName(topTraits[0]?.trait || "openness");
  const trait2 = getBanglaTraitName(topTraits[1]?.trait || "empathy");

  // Get attachment style scores
  // Simulated attachment scores based on agreeableness
  const attachmentScore = Math.round(
    ((user.personalityTraits?.agreeableness || 3) +
      (candidate.personalityTraits?.agreeableness || 3)) /
      2
  );

  // Get shared values and hobbies
  const sharedValues = generateBanglaSharedValues(user, candidate);
  const hobbyMatch = Math.round((score.hobbiesScore || 0) * 100);

  // Randomly choose a template style from our examples
  const templateStyles = [
    "personal",
    "fun",
    "deep",
    "career",
    "emotional",
    "music",
    "practical",
    "distance",
  ];
  const style =
    templateStyles[Math.floor(Math.random() * templateStyles.length)];

  // Base template with intro
  let template = `হাই ${userName}, ${candidateName} তোমার সাথে ${matchPercentage}% মিল`;

  // Add different message endings based on style
  switch (style) {
    case "personal":
      template += ` — এবং এর পেছনে একটা বাস্তব অনুভব আছে।\n\n`;
      break;
    case "fun":
      template += ` — তোমাদের হাসির রসায়ন তৈরি হতেই পারে!\n\n`;
      break;
    case "deep":
      template += ` — মন-দেখা সম্পর্ক গড়তে এমন মিলই লাগে।\n\n`;
      break;
    case "career":
      template += ` — কারণ তোমরা জানো কী চাও, এবং সেটার জন্য কাজ করো।\n\n`;
      break;
    case "emotional":
      template += ` — এই সংযোগটা শুধু অঙ্ক নয়, অনুভবও।\n\n`;
      break;
    case "music":
      template += ` — এবং এই ম্যাচে সুর বাজছে!\n\n`;
      break;
    case "practical":
      template += ` — যেখানে বাস্তবতা আর রোমান্স একসাথে চলে।\n\n`;
      break;
    case "distance":
      template += ` — দূরত্বও এই সংযোগের সামনে কিছুই না।\n\n`;
      break;
    default:
      template += ` — এখানে কিছু বিশেষ আছে।\n\n`;
  }

  // Add personality insights with emoji
  if (style === "fun" || style === "music") {
    template += `🧩 দুজনেই চটপটে ও মজার স্বভাবের (${attachmentScore}/৫), হুটহাট ট্রিপ বা সারপ্রাইজে ভরপুর!\n\n`;
  } else if (style === "deep" || style === "emotional") {
    template += `🧠 দুজনেই গভীর চিন্তাভাবনা আর বিশ্লেষণী মানসিকতায় বিশ্বাসী (${personalityPercent}%)।\n\n`;
  } else if (style === "distance") {
    template += `🔐 দুজনেই নিরাপদ অ্যাটাচমেন্ট টাইপ (${attachmentScore}/৫), মানে ভরসা থাকবে, সন্দেহ নয়।\n\n`;
  } else if (style === "career") {
    template += `💼 দুজনেই ক্যারিয়ার নিয়ে সিরিয়াস — অথচ সময় পেলে প্রিয়জনের পাশে থাকো (${personalityPercent}% ভ্যালু ম্যাচ)।\n\n`;
  } else {
    template += `🧠 তোমরা দুজনেই ${trait1} ও ${trait2} জন্য পরিচিত।\n\n`;
  }

  // Add relationship/attachment style insights
  if (style === "personal" || style === "emotional") {
    template += `💬 দুজনেই নিরাপদ সম্পর্ক পছন্দ করো (${attachmentScore}/৫ স্কোর), মানে কথা হবে মন খুলে।\n\n`;
  } else if (style === "fun") {
    template += `📚 সিনেমা আর বই পড়ার প্রতি ভালোবাসা (${hobbyMatch}%) তোমাদের কথোপকথন জমিয়ে তুলবে।\n\n`;
  } else if (style === "music") {
    template += `🎶 দুজনেই মিউজিক ছাড়া একটা দিন ভাবতে পারো না (${hobbyMatch}% হবি)।\n\n`;
  } else if (style === "practical") {
    template += `💘 একই রকম সেন্স অব হিউমার, একে অপরের চোখে হাসি এনে দেবে।\n\n`;
  } else {
    template += `💬 তুমি ${getBanglaAttachmentStyle(
      user
    )} পছন্দ করো, সেও তাই — কথাবার্তা হবে আন্তরিক ও নির্ভার।\n\n`;
  }

  // Add values or hobby insights
  if (style === "personal" || style === "career") {
    template += `🎯 "${sharedValues[0]}" আর "${sharedValues[1]}" — দুজনের মূল্যবোধ একরকম।\n\n`;
  } else if (style === "fun" || style === "music") {
    template += `📍 একই শহর, একই টাইমজোন — মানে একসাথে ${
      style === "music" ? "কনসার্ট" : "আড্ডা"
    } প্ল্যানও করা যায়।\n\n`;
  } else if (style === "deep") {
    template += `🎯 "তুমি কাকে ভালোবাসো?"-র বদলে "তুমি কেন ভালোবাসো?" — এমন প্রশ্নের উত্তর খোঁজো তোমরা।\n\n`;
  } else if (style === "distance") {
    template += `🌍 শহর আলাদা হলেও, মন আর লক্ষ্য কিন্তু একে অপরকে টানে।\n\n`;
  } else {
    template += `📚 দুজনেই ${sharedValues[0]} আর ${sharedValues[1]} আগ্রহী — এত বিষয় নিয়ে আলোচনা শেষ হবে না।\n\n`;
  }

  // Add conclusion and question suggestion
  if (style === "personal") {
    template += `✨ শুধু মিল নয়, তোমরা একই দিকেই এগোচ্ছো।\nতুমি যদি ওকে জিজ্ঞেস করো, "সবচেয়ে বড় পারিবারিক শিক্ষা কী?", ও কী বলবে বলে তোমার মনে হয়?`;
  } else if (style === "fun") {
    template += `✨ এটা শুধুই একটা ম্যাচ নয় — একটা মুহূর্ত যা শুরু হতে যাচ্ছে।\nপ্রথম কথায় কোন সিনেমা নিয়ে তর্কে জড়াবে তোমরা?`;
  } else if (style === "deep") {
    template += `✨ তুমি যদি ${candidateName}কে জিজ্ঞেস করো, "তোমার জীবনের দর্শন কী?", হয়তো এক নতুন ভাবনার দরজা খুলে যাবে।`;
  } else if (style === "career") {
    template += `✨ যদি ${candidateName}কে জিজ্ঞেস করো, "তুমি কোন সিদ্ধান্তে সবচেয়ে গর্বিত?", হয়তো ওর গল্প তোমার নিজের পথকেও আলো দেখাবে।`;
  } else if (style === "distance") {
    template += `✨ যদি ওকে জিজ্ঞেস করো "জীবনের সবচেয়ে অর্থপূর্ণ সিদ্ধান্ত কী ছিল?" — ওর উত্তর শুনে তুমি থমকে যেতে পারো।`;
  } else if (style === "music") {
    template += `✨ তুমি যদি ওকে বলো "তোমার জীবনের থিম সং কোনটা?", ও কী বলবে?`;
  } else if (style === "practical") {
    template += `✨ যদি ওকে জিজ্ঞেস করো, "পরবর্তী ৫ বছরে নিজেকে কোথায় দেখতে চাও?" — উত্তরে একরকম দৃষ্টিভঙ্গি পাবে।`;
  } else {
    template += `✨ ওকে জিজ্ঞেস করো, "সবচেয়ে প্রভাবিত বই কোনটা ছিল তোমার জীবনে?"`;
  }

  return template;
}

// Helper function to get personality trait name in Bangla
function getBanglaTraitName(trait: string): string {
  const banglaTraits: Record<string, string> = {
    openness: "খোলামেলা মনোভাব",
    উন্মুক্ততা: "খোলামেলা মনোভাব",
    conscientiousness: "দায়িত্ববোধ",
    কর্তব্যপরায়ণতা: "দায়িত্ববোধ",
    extraversion: "বহির্মুখিতা",
    বহির্মুখিতা: "বহির্মুখিতা",
    agreeableness: "সহমর্মিতা",
    "সহমত হওয়ার প্রবণতা": "সহমর্মিতা",
    neuroticism: "উদ্বেগপ্রবণতা",
    "উদ্বেগ প্রবণতা": "উদ্বেগপ্রবণতা",
    empathy: "সহানুভূতি",
  };

  return banglaTraits[trait] || trait;
}

// Helper function to get attachment style in Bangla
function getBanglaAttachmentStyle(user: UserProfile): string {
  // Simulated attachment styles based on personality traits
  const agreeableness = user.personalityTraits?.agreeableness || 3;
  const neuroticism = user.personalityTraits?.neuroticism || 3;

  if (agreeableness > 3.5 && neuroticism < 3) {
    return "নিরাপদ সম্পর্ক";
  } else if (neuroticism > 3.5) {
    return "উদ্বিগ্ন সম্পর্ক";
  } else if (agreeableness < 2.5) {
    return "এড়িয়ে চলা";
  } else {
    return "সিকিউর অ্যাটাচমেন্ট";
  }
}

// Helper function to generate shared values in Bangla
function generateBanglaSharedValues(
  user: UserProfile,
  candidate: UserProfile
): string[] {
  // In a real implementation, you would extract this from actual user data
  const valueOptions = [
    "পরিবার আগে",
    "ক্যারিয়ার দরকার",
    "ব্যক্তিগত বিকাশ",
    "দায়িত্ববোধ",
    "সৎ থাকা",
    "অধ্যবসায়",
    "মানবিকতা",
    "শিক্ষা",
    "স্বাধীনতা",
    "আধ্যাত্মিকতা",
    "স্বাস্থ্য-সচেতনতা",
    "একনিষ্ঠতা",
  ];

  // Use personality traits to "select" values
  const selectedValues: string[] = [];

  // High conscientiousness often correlates with career focus
  if (
    ((user.personalityTraits?.conscientiousness || 3) +
      (candidate.personalityTraits?.conscientiousness || 3)) /
      2 >
    3.5
  ) {
    selectedValues.push("ক্যারিয়ার দরকার");
  }

  // High agreeableness often correlates with family focus
  if (
    ((user.personalityTraits?.agreeableness || 3) +
      (candidate.personalityTraits?.agreeableness || 3)) /
      2 >
    3.5
  ) {
    selectedValues.push("পরিবার আগে");
  }

  // High openness correlates with intellectual curiosity
  if (
    ((user.personalityTraits?.openness || 3) +
      (candidate.personalityTraits?.openness || 3)) /
      2 >
    3.5
  ) {
    selectedValues.push("শিক্ষা");
  }

  // Fill remaining spots with random values
  while (selectedValues.length < 3) {
    const randomValue =
      valueOptions[Math.floor(Math.random() * valueOptions.length)];
    if (!selectedValues.includes(randomValue)) {
      selectedValues.push(randomValue);
    }
  }

  return selectedValues;
}

/**
 * Generate a reason template based on personality traits and compatibility score
 * This mimics AI-generated match explanations without using OpenAI
 */
export function generateTemplateReason(
  user: UserProfile,
  candidate: UserProfile,
  score: CompatibilityScore,
  preferredStyle?: TemplateStyle
): string {
  // Add basic gender property if not present
  if (!user.gender) user.gender = "male";
  if (!candidate.gender) candidate.gender = "male";

  // Get the selected template style
  const style = preferredStyle || selectTemplateStyle();

  // Always use English template if style is "english"
  if (style === "english") {
    return generateModernEnglishTemplate(user, candidate, score);
  }

  // Always use Bangla template if style is "bangla" or language is set to Bengali
  if (style === "bangla" || user.language === "bn") {
    return generateModernBanglaTemplate(user, candidate, score);
  }

  // Get name or username
  const candidateName = candidate.name || candidate.username || "এই ব্যক্তি";

  // Format score percentage in Bengali
  const matchPercentage = toBengaliDecimal(Math.round(score.score));

  // Intro based on score
  let intro = "";
  if (score.score >= 90) {
    intro = `আপনি এবং ${candidateName} ${matchPercentage}% মিলেছে! এটি একটি অসাধারণ মিল!`;
  } else if (score.score >= 80) {
    intro = `আপনি এবং ${candidateName} ${matchPercentage}% মিলেছে! এটি একটি খুব ভালো মিল!`;
  } else if (score.score >= 70) {
    intro = `আপনি এবং ${candidateName} ${matchPercentage}% মিলেছে! এটি একটি ভালো মিল!`;
  } else if (score.score >= 60) {
    intro = `আপনি এবং ${candidateName} ${matchPercentage}% মিলেছে! এটি একটি আশাপ্রদ মিল।`;
  } else {
    intro = `আপনি এবং ${candidateName} ${matchPercentage}% মিলেছে।`;
  }

  // Generate template based on style
  switch (style) {
    case "concise":
      return generateConciseTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "focused":
      return generateFocusedTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "detailed":
      return generateDetailedTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "motivational":
      return generateMotivationalTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "statistical":
      return generateStatisticalTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "personalized":
      return generatePersonalizedTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies,
        candidateName
      );
    case "insightful":
      return generateInsightfulTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "actionable":
      return generateActionableTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "comparative":
      return generateComparativeTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "enthusiastic":
      return generateEnthusiasticTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "analytical":
      return generateAnalyticalTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "romantic":
      return generateRomanticTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "practical":
      return generatePracticalTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "future-oriented":
      return generateFutureOrientedTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies
      );
    case "balanced":
    default:
      return generateBalancedTemplate(
        intro,
        user.personalityTraits,
        candidate.personalityTraits,
        score,
        user.hobbies,
        candidate.hobbies,
        candidateName
      );
  }
}

// Template style options
type TemplateStyle =
  | "concise"
  | "focused"
  | "balanced"
  | "detailed"
  | "motivational"
  | "statistical"
  | "personalized"
  | "insightful"
  | "actionable"
  | "comparative"
  | "enthusiastic"
  | "analytical"
  | "romantic"
  | "practical"
  | "future-oriented"
  | "english"
  | "bangla"; // Add Bangla style

// Function to select a template style randomly
function selectTemplateStyle(): TemplateStyle {
  const styles: TemplateStyle[] = [
    "concise",
    "focused",
    "balanced",
    "detailed",
    "motivational",
    "statistical",
    "personalized",
    "insightful",
    "actionable",
    "comparative",
    "enthusiastic",
    "analytical",
    "romantic",
    "practical",
    "future-oriented",
    "english",
    "bangla", // Add Bangla style
  ];

  const randomIndex = Math.floor(Math.random() * styles.length);
  return styles[randomIndex];
}

// Helper function for trait comparison
function getTopMatchingTraits(
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  limit: number = 3
): { trait: string; score: number }[] {
  const traitDiffs: { trait: string; score: number }[] = [];

  for (const trait in userTraits) {
    if (
      Object.prototype.hasOwnProperty.call(userTraits, trait) &&
      Object.prototype.hasOwnProperty.call(candidateTraits, trait)
    ) {
      const diff =
        5 -
        Math.abs(
          userTraits[trait as keyof PersonalityTraits] -
            candidateTraits[trait as keyof PersonalityTraits]
        );
      traitDiffs.push({
        trait: translateTraitToBengali(trait),
        score: diff,
      });
    }
  }

  // Sort by highest similarity score
  return traitDiffs.sort((a, b) => b.score - a.score).slice(0, limit);
}

// Helper function to get common hobbies
function getCommonHobbies(
  userHobbies: string[] = [],
  candidateHobbies: string[] = [],
  limit: number = 3
): string[] {
  if (!userHobbies || !candidateHobbies) return [];

  const common = userHobbies.filter((hobby) =>
    candidateHobbies.some(
      (candidateHobby) => candidateHobby.toLowerCase() === hobby.toLowerCase()
    )
  );

  return common.slice(0, limit);
}

// Function to translate trait names to Bengali
function translateTraitToBengali(trait: string): string {
  const translations: Record<string, string> = {
    openness: "নতুন অভিজ্ঞতার প্রতি উন্মুক্ততা",
    conscientiousness: "কর্তব্যপরায়ণতা",
    extraversion: "বহির্মুখিতা",
    agreeableness: "সহমত হওয়ার প্রবণতা",
    neuroticism: "উদ্বেগ প্রবণতা",
  };

  return translations[trait] || trait;
}

// Format a score to Bengali text
function formatScoreToBengali(score: number): string {
  if (score >= 4.5) return "খুব বেশি";
  if (score >= 3.5) return "বেশ ভালো";
  if (score >= 2.5) return "মাঝারি";
  if (score >= 1.5) return "কম";
  return "খুব কম";
}

// Template generation functions
function generateConciseTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTrait = getTopMatchingTraits(userTraits, candidateTraits, 1)[0];
  const commonHobbies = getCommonHobbies(userHobbies, candidateHobbies, 1);

  let template = `${intro} আপনাদের ${topTrait?.trait} খুব মিলে যায়।`;

  if (commonHobbies && commonHobbies.length > 0) {
    template += ` উভয়েই ${commonHobbies[0]} পছন্দ করেন, যা একটি সুন্দর সম্পর্কের ভিত্তি হতে পারে।`;
  }

  return template;
}

function generateFocusedTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTraits = getTopMatchingTraits(userTraits, candidateTraits, 2);

  let template = `${intro} আপনাদের দুজনের মধ্যে ${topTraits[0]?.trait} এবং ${topTraits[1]?.trait} এর মিল উল্লেখযোগ্য।`;

  if ((score.personalityScore || 0) > 0.7) {
    template += ` আপনাদের ব্যক্তিত্বগত মিল অসাধারণ, যা একটি দীর্ঘস্থায়ী সম্পর্কের ভিত্তি হতে পারে।`;
  }

  return template;
}

function generateBalancedTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = [],
  candidateName: string
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTraits = getTopMatchingTraits(userTraits, candidateTraits, 2);
  const commonHobbies = getCommonHobbies(userHobbies, candidateHobbies, 2);

  let template = `${intro} আপনারা দুজনেই ${topTraits[0]?.trait} এবং ${topTraits[1]?.trait} এ সমান, যা আপনাদের একে অপরকে গভীরভাবে বুঝতে সাহায্য করবে।`;

  if (commonHobbies && commonHobbies.length > 0) {
    template += ` ${commonHobbies.join(
      " এবং "
    )} এ উভয়ের আগ্রহ রয়েছে, যা আপনাদের একসাথে উপভোগ্য সময় কাটাতে সাহায্য করবে।`;
  }

  return template;
}

function generateDetailedTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTraits = getTopMatchingTraits(userTraits, candidateTraits, 3);
  const commonHobbies = getCommonHobbies(userHobbies, candidateHobbies, 3);

  let template = `${intro} আপনাদের ব্যক্তিত্বের বিশ্লেষণে দেখা যায় যে ${topTraits[0]?.trait}, ${topTraits[1]?.trait}, এবং ${topTraits[2]?.trait} এই তিনটি গুণাবলীতে উল্লেখযোগ্য মিল রয়েছে।`;

  if (commonHobbies && commonHobbies.length > 0) {
    template += ` আপনাদের শখ হিসেবে ${commonHobbies.join(
      ", "
    )} রয়েছে, যা একসাথে আনন্দদায়ক সময় কাটানোর সুযোগ দেবে।`;
  }

  if ((score.attachmentScore || 0) > 0.7) {
    template += ` আপনাদের সম্পর্কে যুক্ত হওয়ার ধরণে ভালো সামঞ্জস্য রয়েছে, যা দীর্ঘমেয়াদী সফলতার জন্য গুরুত্বপূর্ণ।`;
  }

  return template;
}

function generateMotivationalTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTrait = getTopMatchingTraits(userTraits, candidateTraits, 1)[0];

  let template = `${intro} আপনাদের মধ্যে ${topTrait?.trait} একটি শক্তিশালী মিল খুঁজে পেয়েছি! এমন মিল খুব কমই দেখা যায়।`;

  if (score.score > 75) {
    template += ` এই মিল আপনাদের জন্য একটি অসাধারণ সুযোগ তৈরি করেছে! আপনারা একে অপরের জীবনকে সমৃদ্ধ করতে পারবেন।`;
  }

  return template;
}

function generateStatisticalTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const personalityScore = Math.round((score.personalityScore || 0) * 100);
  const valueScore = Math.round((score.valuesScore || 0) * 100);

  let template = `${intro} আমাদের বিশ্লেষণে আপনাদের ব্যক্তিত্ব মিল ${toBengaliDecimal(
    personalityScore
  )}% এবং মূল্যবোধের মিল ${toBengaliDecimal(
    valueScore
  )}%, যা একটি সুন্দর সম্পর্কের লক্ষণ।`;

  if ((score.hobbiesScore || 0) > 0) {
    const hobbyScore = Math.round((score.hobbiesScore || 0) * 100);
    template += ` আপনাদের শখ এবং আগ্রহের ক্ষেত্রে ${toBengaliDecimal(
      hobbyScore
    )}% মিল, যা আপনাদের একসাথে সময় কাটাতে সহায়তা করবে।`;
  }

  return template;
}

function generatePersonalizedTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = [],
  candidateName: string
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTrait = getTopMatchingTraits(userTraits, candidateTraits, 1)[0];
  const commonHobbies = getCommonHobbies(userHobbies, candidateHobbies, 2);

  let template = `${intro} আপনি এবং ${candidateName} দুজনেই ${topTrait?.trait} এ উচ্চমানের, যা আপনাদের মধ্যে একটি বিশেষ বন্ধন তৈরি করতে পারে।`;

  if (commonHobbies && commonHobbies.length > 0) {
    template += ` আপনারা দুজনেই ${commonHobbies.join(
      " এবং "
    )} পছন্দ করেন, যা একসাথে সময় কাটানোর জন্য দারুণ কার্যকলাপ হতে পারে।`;
  }

  return template;
}

function generateInsightfulTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;

  let template = `${intro} আমাদের গভীর বিশ্লেষণে দেখা যায় যে আপনাদের মধ্যে যে সাদৃশ্য রয়েছে তা কেবল উপরিভাগে নয়, বরং চরিত্রের গভীরে রয়েছে।`;

  if (
    (score.personalityScore || 0) > 0.7 &&
    (score.attachmentScore || 0) > 0.7
  ) {
    template += ` আপনাদের ব্যক্তিত্ব এবং সম্পর্কে যুক্ত হওয়ার ধরণের মিল পারস্পরিক বোঝাপড়া এবং সহযোগিতার একটি শক্তিশালী ভিত্তি তৈরি করে।`;
  }

  return template;
}

function generateActionableTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const commonHobbies = getCommonHobbies(userHobbies, candidateHobbies, 1);

  let template = `${intro} এই উচ্চ মিলের সুযোগ নিন! আপনাদের বৈশিষ্ট্যগুলি একে অপরকে খুব ভালোভাবে পরিপূরক করে।`;

  if (commonHobbies && commonHobbies.length > 0) {
    template += ` আপনাদের ${commonHobbies[0]} এর প্রতি ভালোবাসা একটি সম্পর্কের সূচনার জন্য দারুণ একটি বিষয় হতে পারে।`;
  }

  return template;
}

function generateComparativeTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTraits = getTopMatchingTraits(userTraits, candidateTraits, 2);

  let template = `${intro} আপনার ${topTraits[0]?.trait} এবং তার ${topTraits[1]?.trait} একে অপরকে পরিপূরক করে, যা একটি সুষম সম্পর্কের ইঙ্গিত দেয়।`;

  if ((score.attachmentScore || 0) > 0.6) {
    template += ` আপনাদের সম্পর্কে যুক্ত হওয়ার ধরণগুলি একে অপরকে ভালোভাবে সমর্থন করে, যা একটি স্থায়ী সম্পর্কের লক্ষণ।`;
  }

  return template;
}

function generateEnthusiasticTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;

  let template = `${intro} এটা অবিশ্বাস্য! আপনাদের মধ্যে আমরা যে মিল খুঁজে পেয়েছি তা অসাধারণ!`;

  if ((score.personalityScore || 0) > 0.7) {
    template += ` আপনাদের ব্যক্তিত্বের মিল এমন একটি যোগসূত্র যা দুর্লভ! এই সুন্দর সম্পর্কের সম্ভাবনাটি উপভোগ করুন।`;
  }

  return template;
}

function generateAnalyticalTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const personalityScore = Math.round((score.personalityScore || 0) * 100);
  const valueScore = Math.round((score.valuesScore || 0) * 100);
  const attachmentScore = Math.round((score.attachmentScore || 0) * 100);

  let template = `${intro} বিশ্লেষণে দেখা যায়: ব্যক্তিত্ব মিল ${toBengaliDecimal(
    personalityScore
  )}%, মূল্যবোধ মিল ${toBengaliDecimal(
    valueScore
  )}%, এবং সম্পর্কের ধরণ মিল ${toBengaliDecimal(attachmentScore)}%।`;

  if ((score.hobbiesScore || 0) > 0) {
    const hobbyScore = Math.round((score.hobbiesScore || 0) * 100);
    template += ` আগ্রহের ক্ষেত্রে ${toBengaliDecimal(
      hobbyScore
    )}% মিল। এই উচ্চ মিল আপনাদের জন্য সুন্দর একটি সম্পর্কের ইঙ্গিত দেয়।`;
  }

  return template;
}

function generateRomanticTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;

  let template = `${intro} কখনো কখনো দুটি আত্মা এমনভাবে মিলে যায় যেন তারা হাজার বছর ধরে একে অপরকে চেনে।`;

  if ((score.personalityScore || 0) > 0.7) {
    template += ` আপনাদের মধ্যকার সংযোগ গভীর এবং অর্থপূর্ণ হতে পারে। এই সুন্দর যাত্রাটি উপভোগ করুন।`;
  }

  return template;
}

function generatePracticalTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;
  const topTrait = getTopMatchingTraits(userTraits, candidateTraits, 1)[0];

  let template = `${intro} আপনাদের উভয়ের ${topTrait?.trait} একটি শক্তিশালী ভিত্তি তৈরি করে যা দৈনন্দিন চ্যালেঞ্জগুলি একসাথে মোকাবেলা করতে সহায়তা করবে।`;

  if ((score.valuesScore || 0) > 0.7) {
    template += ` আপনাদের মূল্যবোধের মিল দীর্ঘমেয়াদী সম্পর্কের জন্য ইতিবাচক লক্ষণ। এই সম্পর্কে আপনারা পরস্পরকে সমর্থন করতে পারবেন।`;
  }

  return template;
}

function generateFutureOrientedTemplate(
  intro: string,
  userTraits: PersonalityTraits,
  candidateTraits: PersonalityTraits,
  score: CompatibilityScore,
  userHobbies: string[] = [],
  candidateHobbies: string[] = []
): string {
  const hobbiesScore = score.hobbiesScore || 0;

  let template = `${intro} আপনাদের মিল ভবিষ্যতে একটি শক্তিশালী সম্পর্কের ভিত্তি তৈরি করতে পারে।`;

  if ((score.valuesScore || 0) > 0.7) {
    template += ` আপনাদের একই মূল্যবোধ একসাথে দীর্ঘকাল থাকার জন্য গুরুত্বপূর্ণ যা ভবিষ্যতে একটি স্থিতিশীল সম্পর্কের ইঙ্গিত দেয়।`;
  }

  return template;
}

// Define UserProfile interface to fix type errors
interface UserProfile {
  name?: string;
  username?: string;
  personalityTraits: PersonalityTraits;
  hobbies: string[];
  gender?: string;
  language?: string;
}

// Define PersonalityTraits interface to fix type errors
interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  [key: string]: number;
}

/**
 * Analyze top matches using the template system instead of OpenAI
 * This is a drop-in replacement for the OpenAI version
 */
export function analyzeTopMatchesWithTemplate(
  currentUser: any,
  candidates: Array<{ user: any; score: CompatibilityScore }>
): Array<{
  userId: string;
  score: number;
  reason: string;
  matchDetails?: any;
}> {
  // Limit to top 3 candidates
  const top3Candidates = candidates.slice(0, 3);

  // Generate template reasons for each match
  return top3Candidates.map(({ user, score }) => ({
    userId: user._id?.toString() || "",
    score: score.score,
    reason: generateTemplateReason(currentUser, user, score, "bangla"), // Force Bangla style
    matchDetails: score.matchDetails, // Include matchDetails in the response
  }));
}

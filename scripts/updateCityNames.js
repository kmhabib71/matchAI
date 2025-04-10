const { MongoClient } = require("mongodb");

// MongoDB connection string from the mongodb.ts file
const MONGODB_URI =
  "mongodb+srv://kmhabib:khurshida71@cluster0.qqlnw.mongodb.net/strangerchat?retryWrites=true&w=majority";

// District mapping from Bengali to English
const cityMapping = {
  ঢাকা: "Dhaka",
  চট্টগ্রাম: "Chattogram",
  কুমিল্লা: "Comilla",
  সিলেট: "Sylhet",
  রাজশাহী: "Rajshahi",
  খুলনা: "Khulna",
  বরিশাল: "Barisal",
  রংপুর: "Rangpur",
  ময়মনসিংহ: "Mymensingh",
  দিনাজপুর: "Dinajpur",
  গাজীপুর: "Gazipur",
  নারায়ণগঞ্জ: "Narayanganj",
  ফেনী: "Feni",
  ব্রাহ্মণবাড়িয়া: "Brahmanbaria",
  রাঙ্গামাটি: "Rangamati",
  নোয়াখালী: "Noakhali",
  চাঁদপুর: "Chandpur",
  লক্ষ্মীপুর: "Lakshmipur",
  কক্সবাজার: "Coxsbazar",
  খাগড়াছড়ি: "Khagrachhari",
  বান্দরবান: "Bandarban",
};

// Connect to MongoDB
async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("Connected to MongoDB");
  return client.db("strangerchat");
}

// Function to update city names from Bengali to English
async function updateCityNames() {
  try {
    const db = await connectToMongoDB();
    const usersCollection = db.collection("users");

    console.log("Finding users with Bengali city names...");

    // Find all users with personalityQuiz.answers.profile_4 in Bengali
    const users = await usersCollection
      .find({
        "personalityQuiz.answers.profile_4": { $exists: true },
      })
      .toArray();

    console.log(`Found ${users.length} users to potentially update`);

    let updatedCount = 0;

    // Update each user one by one
    for (const user of users) {
      const bengaliCityName = user.personalityQuiz?.answers?.profile_4;

      // If the city name is in Bengali, update it to English
      if (bengaliCityName && cityMapping[bengaliCityName]) {
        const englishCityName = cityMapping[bengaliCityName];

        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { "personalityQuiz.answers.profile_4": englishCityName } }
        );

        console.log(
          `Updated ${bengaliCityName} to ${englishCityName} for user ${user.name}`
        );
        updatedCount++;
      }
    }

    console.log(`Total users updated: ${updatedCount}`);
    console.log("City name update completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating city names:", error);
    process.exit(1);
  }
}

// Run the script
updateCityNames();

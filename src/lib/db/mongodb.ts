import mongoose from "mongoose";

// Log environment variable for debugging
console.log("Environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
});

// Hardcode the MongoDB Atlas connection string directly to ensure it works
const MONGODB_URI =
  "mongodb+srv://kmhabib:khurshida71@cluster0.qqlnw.mongodb.net/strangerchat?retryWrites=true&w=majority";

// Skip MongoDB connection on the client side
const isServer = typeof window === "undefined";

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Define the global mongoose type
declare global {
  // eslint-disable-next-line no-var
  var mongoose: any;
}

// Initialize the cached connection
let cached = isServer
  ? global.mongoose || { conn: null, promise: null }
  : { conn: null, promise: null };

// Set the global mongoose cache if it doesn't exist and we're on the server
if (isServer && !global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  // Return early with a mock connection on the client side
  if (!isServer) {
    return { connection: {} };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("Attempting MongoDB connection to Atlas...");

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB Atlas connected successfully");
        return mongoose;
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("Failed to establish MongoDB connection:", error);
    throw error;
  }
}

export default dbConnect;

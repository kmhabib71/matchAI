import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/matchmaking";

// Skip MongoDB connection on the client side
const isServer = typeof window === "undefined";

if (!MONGODB_URI && isServer) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

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

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

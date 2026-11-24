const mongoose = require("mongoose");

let cached = global.__lifelineMongoose;
if (!cached) {
  cached = global.__lifelineMongoose = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  // Vercel has no local MongoDB — block accidental localhost URIs early.
  if (process.env.VERCEL && /127\.0\.0\.1|localhost/i.test(uri)) {
    throw new Error(
      "MONGODB_URI points to localhost on Vercel. Set an Atlas mongodb+srv:// URI in Vercel Environment Variables."
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        console.log("MongoDB connected");
        return mongooseInstance;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;

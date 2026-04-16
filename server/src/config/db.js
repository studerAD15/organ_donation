import mongoose from "mongoose";
import config from "./env.js";

const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 5;

const connectDatabase = async (retries = 0) => {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB runtime error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Reconnecting...");
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${retries + 1}/${MAX_RETRIES}): ${error.message}`);

    if (retries < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase(retries + 1);
    }

    console.error("💀 Could not connect to MongoDB after maximum retries.");
    process.exit(1);
  }
};

export default connectDatabase;

const mongoose = require("mongoose");
const logger = require("../utils/logger");
const config = require("./config");

const connectDB = async () => {
  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(config.MONGODB_URI, {});
    logger.info("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

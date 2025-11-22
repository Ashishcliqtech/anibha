console.log("src/server.js is being executed");

const config = require("./config/config");
console.log("config.js loaded successfully");

const logger = require("./utils/logger");
console.log("logger.js loaded successfully");

const app = require("./app");
console.log("app.js loaded successfully");

const connectDB = require("./config/db");
console.log("db.js loaded successfully");

const setupCronJobs = require('./cron');

// Override the default process handlers to prevent silent exits
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const PORT = config.PORT || 3000;


const startServer = async () => {
  try {
    logger.info("Connecting to database...");
    await connectDB();
    logger.info("Database connected successfully.");

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${config.NODE_ENV} mode`);
      logger.info("Server started successfully and is working perfectly.");
      setupCronJobs();
    });
  } catch (error) {
    // Use the fallback logger to report the error
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

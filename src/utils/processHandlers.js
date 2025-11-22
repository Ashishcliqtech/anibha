const logger = require("./logger");

const unhandledRejectionHandler = (err) => {
  logger.error("💥 UNHANDLED PROMISE REJECTION! Shutting down...");
  logger.error(err.stack || err.message);
  process.exit(1);
};

const uncaughtExceptionHandler = (err) => {
  logger.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(err.stack || err.message);
  process.exit(1);
};

module.exports = {
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
};

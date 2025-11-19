process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.stack || err.message);
  process.exit(1);
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const config = require("./config/config");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const eventRoutes = require("./routes/eventRoutes");
const blogRoutes = require("./routes/blogRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cookieParser = require("cookie-parser");
const adminRoutes = require("./routes/adminRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const logger = require("./utils/logger");

const app = express();
app.set("trust proxy", 1);
// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());

// Expose custom headers to client JavaScript
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Expose-Headers",
    "x-access-token, x-user-id, x-user-role, x-refresh-token"
  );
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Logging
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection
const connectDB = async () => {
  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
connectDB();

process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED PROMISE REJECTION! Shutting down...");
  console.error(err.stack || err.message);
  process.exit(1);
});
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("Welcome to the Edunova! Use /api/v1/auth or /health");
});
// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", courseRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", eventRoutes);
app.use("/api/v1", blogRoutes);
app.use("/api/v1", certificateRoutes);
app.use("/api/v1/", enquiryRoutes);
app.use("/api/v1/", testimonialRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1/employee", employeeRoutes);

// Ecommerce routes
app.use('/api/v1', cartRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', wishlistRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1', paymentRoutes);

app.get("/favicon.ico", (req, res) => res.status(204).end());
// Error handling middleware
app.all("*", notFound);
app.use(errorHandler);

const PORT = config.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${config.NODE_ENV} mode`);
});

module.exports = app;

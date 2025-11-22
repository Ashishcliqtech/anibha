const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");

const config = require("./config/config");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
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
const adminRoutes = require("./routes/adminRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

// Security middleware
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());

// Expose custom headers
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
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Logging
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Welcome to the Edunova! Use /api/v1/auth or /health");
});

// API routes
app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", eventRoutes);
app.use("/api/v1", blogRoutes);
app.use("/api/v1", certificateRoutes);
app.use("/api/v1/", enquiryRoutes);
app.use("/api/v1/", testimonialRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', wishlistRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1', paymentRoutes);


app.get("/favicon.ico", (req, res) => res.status(204).end());

// Error handling
app.all("*", notFound);
app.use(errorHandler);

module.exports = app;

// middleware/authMiddleware.js (UPDATED)
const { verifyAccessToken } = require("../utils/jwtUtils");
const User = require("../models/User");
const Employee = require("../models/Employee");
const config = require("../config/config");
const { AppError } = require("../utils/errorUtils");
const redisClient = require("../utils/redisClient/redisclient");

const protect = async (req, res, next) => {
  try {
    let accessToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    } else if (req.headers["x-access-token"]) {
      accessToken = req.headers["x-access-token"];
    }

    if (!accessToken) {
      return next(new AppError("Access denied. No token provided.", 401));
    }

    const decoded = verifyAccessToken(accessToken);

    const isBlacklisted = await redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
      return next(
        new AppError("Access token is blacklisted. Please log in again.", 401)
      );
    }

    // Try to find user in User collection
    let user = await User.findById(decoded.id).select("-password");
    if (!user) {
      // If not found, try Employee collection
      user = await Employee.findById(decoded.id);
      if (!user) {
        return next(
          new AppError("User or Employee belonging to this token no longer exists.", 401)
        );
      }
      // Attach employee info and set role
      req.user = { _id: user._id, employeeId: user.employeeId, name: user.name, role: "employee" };
      req.isAuthenticated = true;
      // If token is sent in body, also support it for backward compatibility
      if (!req.headers["x-access-token"] && req.body.token) {
        req.headers["x-access-token"] = req.body.token;
      }
      return next();
    }
    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated.", 401));
    }
    req.user = user;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.message.includes("No access token found")
    ) {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError(
          "Access token expired. Please refresh your token or log in again.",
          401
        )
      );
    }
    console.error("Authentication Error:", error.message);
    next(new AppError("Authentication failed. Please try again.", 401));
  }
};

const adminOnly = async (req, res, next) => {
  if (!req.user?.id) {
    return next(new AppError("Authentication required.", 401));
  }

  try {
    const userInDB = await User.findById(req.user.id).select("role isActive");

    if (!userInDB) return next(new AppError("User not found.", 404));
    if (!userInDB.isActive)
      return next(new AppError("Account deactivated.", 401));
    if (userInDB.role !== "admin") {
      return next(new AppError("Admin privileges required.", 403));
    }

    req.user.role = userInDB.role;
    next();
  } catch (error) {
    next(new AppError("Authorization error", 500));
  }
};

const userOnly = async (req, res, next) => {
  if (!req.user?.id) {
    return next(new AppError("Authentication required.", 401));
  }

  try {
    const userInDB = await User.findById(req.user.id).select("role isActive");

    if (!userInDB) return next(new AppError("User not found.", 404));
    if (!userInDB.isActive)
      return next(new AppError("Account deactivated.", 401));
    if (userInDB.role !== "user") {
      return next(new AppError("User privileges required.", 403));
    }

    req.user.role = userInDB.role;
    next();
  } catch (error) {
    next(new AppError("Authorization error", 500));
  }
};

const employeeOnly = async (req, res, next) => {
  if (!req.user?._id) {
    return next(new AppError("Authentication required.", 401));
  }
  try {
    const employeeInDB = await Employee.findById(req.user._id);
    if (!employeeInDB) return next(new AppError("Employee not found.", 404));
    if (req.user.role !== "employee") {
      return next(new AppError("Employee privileges required.", 403));
    }
    next();
  } catch (error) {
    next(new AppError("Authorization error", 500));
  }
};

module.exports = { protect, adminOnly, userOnly, employeeOnly };

const express = require("express");
const {
  signup,
  login,
  getMe,
  verifyOtp,
  logout,
  forgotPassword,
  changePassword,
  verifyForgotOtp,
  resetPassword,
  refreshAccessToken,
  resendOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateSendOtp,
  validateChangePasswordDto,
  resetPasswordDto,
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/signup", validateSignup, signup);
// Helpful GET handler for accidental GET requests (returns instruction)
router.get("/signup", (req, res) => {
  return res.status(405).json({
    success: false,
    message:
      "Use POST /api/v1/auth/signup with JSON body { name, email, password } to create an account."
  });
});
router.post("/verify-otp", validateVerifyOtp, verifyOtp);
router.post("/resend-otp", validateSendOtp, resendOtp);
router.post("/login", validateLogin, login);
router.get("/refresh-token", refreshAccessToken);
router.post("/logout", protect, logout);
router.post("/forgot-password", validateSendOtp, forgotPassword);
router.post("/reset-password", resetPasswordDto, resetPassword);
router.post("/verify-forgot-otp", validateVerifyOtp, verifyForgotOtp);
router.post(
  "/change-password",
  protect,
  validateChangePasswordDto,
  changePassword
);
router.get("/me", protect, getMe);

module.exports = router;

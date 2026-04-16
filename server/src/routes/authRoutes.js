import { Router } from "express";
import { logout, refreshSession, register, sendLoginOtp, verifyLoginOtp } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { registerSchema, sendOtpSchema, verifyOtpSchema, refreshSessionSchema } from "../validators/authValidator.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimitMiddleware.js";

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

router.post("/register", validate(registerSchema), register);
// Stricter limiter specifically for OTP sends
router.post("/send-otp", otpLimiter, validate(sendOtpSchema), sendLoginOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyLoginOtp);
router.post("/refresh", validate(refreshSessionSchema), refreshSession);
// BUG FIX: logout requires authentication — prevents any userId from being invalidated
router.post("/logout", protect, logout);

export default router;

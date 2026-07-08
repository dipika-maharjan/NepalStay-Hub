import { Router } from "express";
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/auth.controller";
import {
  authRateLimiter,
  loginRateLimiter,
} from "../middleware/rateLimiter.middleware";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/verify-email", authRateLimiter, verifyEmail);
router.post("/resend-otp", authRateLimiter, resendOTP);
router.post("/login", loginRateLimiter, login);
router.post("/logout", requireAuth, logout);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);
router.get("/me", requireAuth, getMe);

export default router;

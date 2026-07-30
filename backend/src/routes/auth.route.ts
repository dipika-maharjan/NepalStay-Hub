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
  googleCallback,
} from "../controllers/auth.controller";
import passport from "passport";
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

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    session: false,
  }),
  googleCallback,
);

export default router;

import { Request, Response } from "express";
import crypto from "crypto";
import { UserModel } from "../models/user.model";
import { AuditLogModel } from "../models/auditLog.model";
import {
  validatePassword,
  hashPassword,
  comparePassword,
  isPasswordReused,
  PASSWORD_RULES,
} from "../utils/password.util";
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  generateSecureToken,
} from "../utils/otp.util";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountLockedEmail,
} from "../utils/email.util";
import { generateToken, COOKIE_OPTIONS } from "../utils/jwt.util";
import { AuthRequest } from "../middleware/auth.middleware";

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const getClientIP = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
  req.ip ||
  "unknown";

const logAction = async (
  userId: string | null,
  action: string,
  req: Request,
  metadata: Record<string, unknown> = {},
) => {
  try {
    await AuditLogModel.create({
      userId,
      action,
      ipAddress: getClientIP(req),
      userAgent: req.headers["user-agent"] || null,
      metadata,
      timestamp: new Date(),
    });
  } catch {
    // Logging failure must not break the request
  }
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res
        .status(400)
        .json({ message: "Name, email and password are required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const passwordValidation = validatePassword(password, name);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        message: "Password does not meet requirements",
        errors: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
      return;
    }

    const existingUser = await UserModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      res
        .status(409)
        .json({ message: "An account with this email already exists" });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "traveler",
      previousPasswords: [hashedPassword],
      emailOTP: hashedOTP,
      emailOTPExpiry: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    await sendVerificationEmail(email, otp);
    await logAction(user._id.toString(), "USER_REGISTER", req, { email });

    res.status(201).json({
      message:
        "Account created. Please check your email for the verification code.",
      userId: user.uuid,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/verify-email
export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user || !user.emailOTP || !user.emailOTPExpiry) {
      res.status(400).json({ message: "Invalid or expired verification code" });
      return;
    }

    if (new Date() > user.emailOTPExpiry) {
      res
        .status(400)
        .json({
          message: "Verification code expired. Please request a new one.",
        });
      return;
    }

    const isValid = await verifyOTP(otp, user.emailOTP);
    if (!isValid) {
      res.status(400).json({ message: "Invalid verification code" });
      return;
    }

    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpiry = null;
    await user.save();

    await logAction(user._id.toString(), "USER_LOGIN", req, {
      action: "email_verified",
    });

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/resend-otp
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Always return same message to prevent user enumeration
    const genericMsg =
      "If your email is registered and unverified, a new code has been sent.";

    if (!email) {
      res.status(200).json({ message: genericMsg });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || user.isEmailVerified) {
      res.status(200).json({ message: genericMsg });
      return;
    }

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    user.emailOTP = hashedOTP;
    user.emailOTPExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();

    await sendVerificationEmail(email, otp);
    res.status(200).json({ message: genericMsg });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    // Generic message — prevents user enumeration
    if (!user) {
      await logAction(null, "USER_LOGIN_FAILED", req, {
        email,
        reason: "user_not_found",
      });
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Check lockout
    if (user.lockoutUntil && new Date() < user.lockoutUntil) {
      const remainingMins = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000,
      );
      await logAction(user._id.toString(), "USER_LOGIN_FAILED", req, {
        reason: "account_locked",
      });
      res.status(423).json({
        message: `Account locked. Try again in ${remainingMins} minute(s).`,
        lockedUntil: user.lockoutUntil,
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= LOCKOUT_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        user.failedLoginAttempts = 0;
        await user.save();
        await sendAccountLockedEmail(user.email, 15);
        await logAction(user._id.toString(), "USER_LOCKED", req, {});
        res
          .status(423)
          .json({
            message:
              "Account locked due to too many failed attempts. Try again in 15 minutes.",
          });
        return;
      }

      await user.save();
      await logAction(user._id.toString(), "USER_LOGIN_FAILED", req, {
        reason: "invalid_password",
        attemptsRemaining: LOCKOUT_ATTEMPTS - user.failedLoginAttempts,
      });

      res.status(401).json({
        message: "Invalid email or password",
        attemptsRemaining: LOCKOUT_ATTEMPTS - user.failedLoginAttempts,
      });
      return;
    }

    if (!user.isEmailVerified) {
      res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
      return;
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // MFA check — handled in feature/mfa branch
    if (user.mfaEnabled) {
      res.status(200).json({
        message: "MFA verification required",
        requiresMFA: true,
        tempUserId: user.uuid,
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      uuid: user.uuid,
    });

    res.cookie("token", token, COOKIE_OPTIONS);
    await logAction(user._id.toString(), "USER_LOGIN", req, {
      role: user.role,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
        isHostVerified: user.isHostVerified,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/logout
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ message: "Logged out successfully" });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    const genericMsg =
      "If an account with that email exists, a reset link has been sent.";

    if (!email) {
      res.status(200).json({ message: genericMsg });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(200).json({ message: genericMsg });
      return;
    }

    const resetToken = generateSecureToken();
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetTokenExpiry = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MS,
    );
    await user.save();

    await sendPasswordResetEmail(email, resetToken);
    await logAction(user._id.toString(), "PASSWORD_RESET_REQUEST", req, {
      email,
    });

    res.status(200).json({ message: genericMsg });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: "Token and new password are required" });
      return;
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const validation = validatePassword(newPassword, user.name);
    if (!validation.isValid) {
      res
        .status(400)
        .json({
          message: "Password does not meet requirements",
          errors: validation.errors,
        });
      return;
    }

    const isReused = await isPasswordReused(
      newPassword,
      user.previousPasswords,
    );
    if (isReused) {
      res.status(400).json({
        message: `You cannot reuse your last ${PASSWORD_RULES.maxPreviousPasswords} passwords`,
      });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.previousPasswords = [hashedPassword, ...user.previousPasswords].slice(
      0,
      PASSWORD_RULES.maxPreviousPasswords,
    );
    user.passwordChangedAt = new Date();
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    await logAction(user._id.toString(), "PASSWORD_CHANGE", req, {
      method: "reset",
    });

    res
      .status(200)
      .json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ user });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

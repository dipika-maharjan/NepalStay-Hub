import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { AuditLogModel } from "../models/auditLog.model";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  hashPassword,
  comparePassword,
  isPasswordReused,
  validatePassword,
  PASSWORD_RULES,
} from "../utils/password.util";

const logAction = async (
  userId: string,
  action: string,
  req: Request,
  metadata: Record<string, unknown> = {},
) => {
  try {
    await AuditLogModel.create({
      userId,
      action,
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || null,
      metadata,
      timestamp: new Date(),
    });
  } catch {
    // ignore logging failures
  }
};

// GET /api/profile
export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await UserModel.findById(authReq.user?.userId).select(
      "-password -mfaSecret -previousPasswords -emailOTP -emailOTPExpiry -passwordResetToken -passwordResetTokenExpiry -failedLoginAttempts -lockoutUntil",
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ user });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/profile
// Explicit whitelist — prevents mass assignment attacks
export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    // Whitelist only safe fields — role/isHostVerified/mfaEnabled cannot be set here
    const { name, phone, bio, profileImage } = req.body;

    const allowedUpdates: Record<string, unknown> = {};
    if (name !== undefined) allowedUpdates.name = String(name).trim().slice(0, 100);
    if (phone !== undefined) allowedUpdates.phone = String(phone).trim();
    if (bio !== undefined) allowedUpdates.bio = String(bio).trim().slice(0, 500);
    if (profileImage !== undefined) allowedUpdates.profileImage = String(profileImage);

    if (Object.keys(allowedUpdates).length === 0) {
      res.status(400).json({ message: "No valid fields provided for update" });
      return;
    }

    // findByIdAndUpdate with explicit userId — IDOR protection
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true },
    ).select("-password -mfaSecret -previousPasswords -failedLoginAttempts -lockoutUntil");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await logAction(userId!, "PROFILE_UPDATE", req, { updatedFields: Object.keys(allowedUpdates) });

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/profile/change-password
export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Current and new password are required" });
      return;
    }

    const user = await UserModel.findById(authReq.user?.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isCurrentValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentValid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    const validation = validatePassword(newPassword, user.name);
    if (!validation.isValid) {
      res.status(400).json({ message: "Password does not meet requirements", errors: validation.errors });
      return;
    }

    const isReused = await isPasswordReused(newPassword, user.previousPasswords);
    if (isReused) {
      res.status(400).json({
        message: `Cannot reuse your last ${PASSWORD_RULES.maxPreviousPasswords} passwords`,
      });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.previousPasswords = [hashedPassword, ...user.previousPasswords].slice(0, PASSWORD_RULES.maxPreviousPasswords);
    user.passwordChangedAt = new Date();
    await user.save();

    await logAction(user._id.toString(), "PASSWORD_CHANGE", req, { method: "profile" });

    res.status(200).json({ message: "Password changed successfully" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/profile/export
// GDPR-style data export — user can download their own data
export const exportProfileData = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await UserModel.findById(authReq.user?.userId).select(
      "-password -mfaSecret -previousPasswords -emailOTP -emailOTPExpiry -passwordResetToken -passwordResetTokenExpiry -failedLoginAttempts -lockoutUntil",
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await logAction(user._id.toString(), "PROFILE_UPDATE", req, { action: "data_export" });

    res.setHeader("Content-Disposition", "attachment; filename=my-nepalstayhub-data.json");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      exportedAt: new Date().toISOString(),
      data: user.toJSON(),
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { AuditLogModel } from "../models/auditLog.model";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  generateMFASecret,
  generateQRCode,
  encryptSecret,
  verifyTOTP,
} from "../utils/mfa.util";
import { generateToken, COOKIE_OPTIONS } from "../utils/jwt.util";

const logAction = async (
  userId: string,
  action: string,
  req: Request,
  metadata: Record<string, unknown> = {}
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
    // Logging must not break the request
  }
};

// POST /api/mfa/setup
// Generates secret and QR code — user must verify before MFA is enabled
export const setupMFA = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await UserModel.findById(authReq.user?.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.mfaEnabled) {
      res.status(400).json({ message: "MFA is already enabled" });
      return;
    }

    const secret = generateMFASecret();
    const qrCode = await generateQRCode(user.email, secret);

    // Store encrypted secret temporarily — not enabled until verified
    user.mfaSecret = encryptSecret(secret);
    await user.save();

    res.status(200).json({
      message: "Scan the QR code with your authenticator app, then verify to enable MFA",
      qrCode,
      // Return plain secret for manual entry in authenticator app
      manualEntryKey: secret,
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/mfa/verify-setup
// Confirms the user can generate valid codes before enabling MFA
export const verifyMFASetup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: "Authenticator code is required" });
      return;
    }

    const user = await UserModel.findById(authReq.user?.userId);
    if (!user || !user.mfaSecret) {
      res.status(400).json({ message: "MFA setup not initiated" });
      return;
    }

    const isValid = verifyTOTP(token, user.mfaSecret);
    if (!isValid) {
      await logAction(user._id.toString(), "MFA_FAILED", req, {
        step: "setup_verification",
      });
      res.status(400).json({ message: "Invalid authenticator code" });
      return;
    }

    user.mfaEnabled = true;
    await user.save();

    await logAction(user._id.toString(), "MFA_ENABLED", req, {});

    res.status(200).json({ message: "MFA enabled successfully" });
  } catch (error) {
    console.error("MFA verify setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/mfa/validate
// Called during login flow when user has MFA enabled
export const validateMFA = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, tempUserId } = req.body;

    if (!token || !tempUserId) {
      res.status(400).json({ message: "Token and user ID are required" });
      return;
    }

    const user = await UserModel.findOne({ uuid: tempUserId });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const isValid = verifyTOTP(token, user.mfaSecret);
    if (!isValid) {
      await logAction(user._id.toString(), "MFA_FAILED", req, {
        step: "login",
      });
      res.status(401).json({ message: "Invalid authenticator code" });
      return;
    }

    // MFA passed — issue JWT same as normal login
    const jwtToken = generateToken({
      userId: user._id.toString(),
      role: user.role,
      uuid: user.uuid,
    });

    res.cookie("token", jwtToken, COOKIE_OPTIONS);
    await logAction(user._id.toString(), "USER_LOGIN", req, {
      method: "mfa",
      role: user.role,
    });

    res.status(200).json({
      message: "MFA verified. Login successful",
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
    console.error("MFA validate error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/mfa/disable
export const disableMFA = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: "Authenticator code required to disable MFA" });
      return;
    }

    const user = await UserModel.findById(authReq.user?.userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      res.status(400).json({ message: "MFA is not enabled" });
      return;
    }

    const isValid = verifyTOTP(token, user.mfaSecret);
    if (!isValid) {
      res.status(401).json({ message: "Invalid authenticator code" });
      return;
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    await logAction(user._id.toString(), "MFA_DISABLED", req, {});

    res.status(200).json({ message: "MFA disabled successfully" });
  } catch (error) {
    console.error("MFA disable error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { AuditLogModel } from "../models/auditLog.model";

export const getSecurityStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as Request & {
      user?: { userId: string; role: string };
    };

    if (!authReq.user?.userId) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }

    const userId = authReq.user.userId;

    // Retrieve the authenticated user's profile
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Retrieve the latest successful authentication event
    const lastLoginEvent = await AuditLogModel.findOne({
      userId,
      action: "USER_LOGIN",
    }).sort({ timestamp: -1 });

    let lastLogin = null;
    if (lastLoginEvent) {
      lastLogin = {
        timestamp: lastLoginEvent.timestamp,
        ip: lastLoginEvent.ipAddress,
        browser: lastLoginEvent.userAgent,
      };
    }

    // Query for failed login events today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const failedLoginsToday = await AuditLogModel.countDocuments({
      userId,
      action: "USER_LOGIN_FAILED",
      timestamp: { $gte: startOfDay },
    });

    // Determine booleans for scoring
    const isEmailVerified = user.isEmailVerified;
    const isMfaEnabled = user.mfaEnabled;
    const isPasswordChanged = user.passwordChangedAt !== null;
    const passwordAgeDays = user.passwordChangedAt 
      ? Math.floor((new Date().getTime() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const strongPasswordPolicy = true; 
    const noFailedLoginToday = failedLoginsToday === 0;
    const isAccountLocked = user.lockoutUntil !== null && user.lockoutUntil > new Date();

    // Calculate score
    let securityScore = 0;
    if (isEmailVerified) securityScore += 20;
    if (isMfaEnabled) securityScore += 25;
    if (isPasswordChanged) securityScore += 15;
    if (strongPasswordPolicy) securityScore += 10;
    if (noFailedLoginToday) securityScore += 10;
    if (!isAccountLocked) securityScore += 20;

    // Generate recommendations
    const recommendations: string[] = [];
    if (!isEmailVerified) {
      recommendations.push("Verify your email address.");
    }
    if (!isMfaEnabled) {
      recommendations.push("Enable Multi-Factor Authentication.");
    }
    if (passwordAgeDays > 90) {
      recommendations.push("Consider changing your password.");
    }

    // Fetch Recent Activity (deduplicated by action type)
    const recentEvents = await AuditLogModel.aggregate([
      { 
        $match: { 
          userId, 
          action: { $in: ["USER_LOGIN", "PASSWORD_CHANGE", "MFA_ENABLED", "SECURITY_CENTER_VIEWED", "USER_UPDATED"] } 
        } 
      },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$action", event: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$event" } },
      { $sort: { timestamp: -1 } },
      { $limit: 5 }
    ]);

    const recentActivity = recentEvents.map(event => {
      let actionLabel: string = event.action;
      if (event.action === "USER_LOGIN") actionLabel = "Login Successful";
      if (event.action === "PASSWORD_CHANGE") actionLabel = "Password Changed";
      if (event.action === "MFA_ENABLED") actionLabel = "MFA Enabled";
      if (event.action === "SECURITY_CENTER_VIEWED") actionLabel = "Security Center Viewed";
      if (event.action === "USER_UPDATED") actionLabel = "Profile Updated";
      return {
        action: actionLabel,
        timestamp: event.timestamp
      };
    });

    // Log access
    await AuditLogModel.create({
      userId,
      action: "SECURITY_CENTER_VIEWED",
      targetType: "User",
      targetId: userId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
      metadata: {},
    });

    res.status(200).json({
      securityScore,
      emailVerified: isEmailVerified,
      mfaEnabled: isMfaEnabled,
      passwordChanged: isPasswordChanged,
      accountLocked: isAccountLocked,
      failedLoginsToday,
      lastLogin,
      recentActivity,
      recommendations,
    });
  } catch (error) {
    console.error("Get Security Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

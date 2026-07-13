import { Request, Response } from "express";
import { UserModel } from "../../models/user.model";
import { AuditLogModel } from "../../models/auditLog.model";
import { AuthRequest } from "../../middleware/auth.middleware";

// GET /api/admin/users
export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await UserModel.find()
      .select(
        "-password -mfaSecret -previousPasswords -emailOTP -passwordResetToken",
      )
      .sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/users/:id
export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await UserModel.findById(req.params.id).select(
      "-password -mfaSecret -previousPasswords -emailOTP -passwordResetToken",
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

// PUT /api/admin/users/:id/role
// Only admins can change roles — explicit endpoint, not part of general update
export const updateUserRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { role } = req.body;
    const validRoles = ["traveler", "host", "admin"];

    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    // Prevent admin from changing their own role
    if (req.params.id === authReq.user?.userId) {
      res.status(403).json({ message: "Cannot change your own role" });
      return;
    }

    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true },
    ).select("-password -mfaSecret -previousPasswords");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await AuditLogModel.create({
      userId: authReq.user?.userId,
      action: "ADMIN_ACTION",
      targetType: "User",
      targetId: req.params.id,
      ipAddress: req.ip || "unknown",
      metadata: { action: "role_change", newRole: role },
      timestamp: new Date(),
    });

    res.status(200).json({ message: "User role updated", user });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (req.params.id === authReq.user?.userId) {
      res.status(403).json({ message: "Cannot delete your own account" });
      return;
    }

    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await AuditLogModel.create({
      userId: authReq.user?.userId,
      action: "ADMIN_ACTION",
      targetType: "User",
      targetId: req.params.id,
      ipAddress: req.ip || "unknown",
      metadata: { action: "user_deleted", deletedEmail: user.email },
      timestamp: new Date(),
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const logs = await AuditLogModel.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email role");

    const total = await AuditLogModel.countDocuments();

    res.status(200).json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

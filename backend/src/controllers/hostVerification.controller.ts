import { Response } from "express";
import { HostVerificationModel } from "../models/hostVerification.model";
import { UserModel } from "../models/user.model";
import { AuditLogModel } from "../models/auditLog.model";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/host-verification/submit
export const submitVerification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { documentType } = req.body;
    const file = req.file;

    if (!file || !documentType) {
      res.status(400).json({ message: "Document type and file are required" });
      return;
    }

    const validTypes = ["citizenship", "passport", "license"];
    if (!validTypes.includes(documentType)) {
      res.status(400).json({ message: "Invalid document type" });
      return;
    }

    const existing = await HostVerificationModel.findOne({ userId });
    if (existing && existing.status === "pending") {
      res
        .status(409)
        .json({ message: "Verification already submitted and pending review" });
      return;
    }

    const verification = await HostVerificationModel.findOneAndUpdate(
      { userId },
      {
        userId,
        documentType,
        documentUrl: `/uploads/verification/${file.filename}`,
        status: "pending",
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        submittedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    await UserModel.findByIdAndUpdate(userId, { role: "host" });

    await AuditLogModel.create({
      userId,
      action: "HOST_VERIFICATION_SUBMITTED",
      targetType: "HostVerification",
      targetId: verification._id.toString(),
      ipAddress: req.ip || "unknown",
      metadata: { documentType },
      timestamp: new Date(),
    });

    res.status(201).json({
      message:
        "Verification submitted successfully. Admin will review shortly.",
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/host-verification/status
export const getVerificationStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const verification = await HostVerificationModel.findOne({
      userId: req.user?.userId,
    }).select("-documentUrl");

    if (!verification) {
      res.status(404).json({ message: "No verification record found" });
      return;
    }

    res.status(200).json({ verification });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/host-verifications
export const getAllVerifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const verifications = await HostVerificationModel.find(filter)
      .populate("userId", "name email")
      .sort({ submittedAt: -1 });

    res.status(200).json({ verifications });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/admin/host-verifications/:id/approve
export const approveVerification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const verification = await HostVerificationModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        reviewedBy: req.user?.userId,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    if (!verification) {
      res.status(404).json({ message: "Verification not found" });
      return;
    }

    await UserModel.findByIdAndUpdate(verification.userId, {
      isHostVerified: true,
    });

    await AuditLogModel.create({
      userId: req.user?.userId,
      action: "HOST_VERIFICATION_APPROVED",
      targetType: "HostVerification",
      targetId: verification._id.toString(),
      ipAddress: req.ip || "unknown",
      metadata: {},
      timestamp: new Date(),
    });

    res.status(200).json({ message: "Host verified successfully" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/admin/host-verifications/:id/reject
export const rejectVerification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ message: "Rejection reason is required" });
      return;
    }

    const verification = await HostVerificationModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: req.user?.userId,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    if (!verification) {
      res.status(404).json({ message: "Verification not found" });
      return;
    }

    await AuditLogModel.create({
      userId: req.user?.userId,
      action: "HOST_VERIFICATION_REJECTED",
      targetType: "HostVerification",
      targetId: verification._id.toString(),
      ipAddress: req.ip || "unknown",
      metadata: { reason },
      timestamp: new Date(),
    });

    res.status(200).json({ message: "Verification rejected" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

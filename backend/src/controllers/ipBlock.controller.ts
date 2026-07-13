import { Request, Response } from "express";
import { IPBlockModel } from "../models/ipBlock.model";

// GET /api/admin/ip-blocks
export const getBlockedIPs = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const blocks = await IPBlockModel.find().sort({ blockedAt: -1 });
    res.status(200).json({ blocks });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/admin/ip-blocks
export const blockIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ipAddress, reason, permanent, durationHours } = req.body;

    if (!ipAddress || !reason) {
      res.status(400).json({ message: "IP address and reason are required" });
      return;
    }

    const expiresAt = permanent
      ? null
      : new Date(Date.now() + (durationHours || 24) * 60 * 60 * 1000);

    const block = await IPBlockModel.findOneAndUpdate(
      { ipAddress },
      {
        ipAddress,
        reason,
        permanent: !!permanent,
        expiresAt,
        blockedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    res.status(201).json({ message: "IP blocked successfully", block });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/ip-blocks/:ip
export const unblockIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip } = req.params;
    await IPBlockModel.findOneAndDelete({ ipAddress: ip });
    res.status(200).json({ message: "IP unblocked successfully" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import { UserModel } from "../models/user.model";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    uuid: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const payload = verifyToken(token);

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      res.status(401).json({ message: "User no longer exists" });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };
};

export const requireHostVerified = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const user = await UserModel.findById(req.user.userId);
  if (!user?.isHostVerified) {
    res.status(403).json({ message: "Host verification required" });
    return;
  }
  next();
};

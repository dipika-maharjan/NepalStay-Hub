import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import { UserModel } from "../models/user.model";

export interface AuthUser {
  userId: string;
  role: string;
  uuid: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const asAuthRequest = (req: Request): AuthRequest => req as AuthRequest;

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authReq = asAuthRequest(req);

  try {
    const token =
      authReq.headers.authorization?.replace("Bearer ", "") || authReq.cookies?.token;

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

    authReq.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = asAuthRequest(req);

    if (!authReq.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };
};


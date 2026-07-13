import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { Request, Response, NextFunction } from "express";
import { IPBlockModel } from "../models/ipBlock.model";

const getClientIP = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
  req.ip ||
  "unknown";

// IP block check middleware — runs before all routes
export const ipBlockMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ip = getClientIP(req);
    const blocked = await IPBlockModel.findOne({
      ipAddress: ip,
      $or: [{ permanent: true }, { expiresAt: { $gt: new Date() } }],
    });

    if (blocked) {
      res.status(403).json({
        message: "Access denied",
      });
      return;
    }
    next();
  } catch {
    // If block check fails, allow request through
    next();
  }
};

// Slow down repeated requests before blocking
export const loginSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => hits * 500,
});

// Strict limit for login endpoint
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIP(req),
  handler: async (req, res) => {
    // Auto-block IP after sustained attack
    const ip = getClientIP(req);
    try {
      await IPBlockModel.findOneAndUpdate(
        { ipAddress: ip },
        {
          ipAddress: ip,
          reason: "Automated block: exceeded login rate limit",
          blockedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          permanent: false,
        },
        { upsert: true },
      );
    } catch {
      // Block creation failure should not affect response
    }
    res.status(429).json({
      message: "Too many login attempts. Your IP has been temporarily blocked.",
    });
  },
});

// Auth endpoints general limiter
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many requests, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIP(req),
});

// General API limiter
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIP(req),
});

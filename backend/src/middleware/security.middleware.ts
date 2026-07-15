import { Request, Response, NextFunction } from "express";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";

// Sanitize all string inputs against XSS
export const xssSanitizer = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === "string") return xss(value);
    if (typeof value === "object" && value !== null) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          sanitizeValue(v),
        ]),
      );
    }
    return value;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as Record<string, string>;
  next();
};

// SSRF protection — validate URLs before any server-side fetch
export const ssrfProtection = (allowedDomains: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const urlFields = ["url", "imageUrl", "documentUrl", "callbackUrl"];
    for (const field of urlFields) {
      const url = req.body?.[field] || req.query?.[field];
      if (url) {
        try {
          const parsed = new URL(url as string);
          const isAllowed = allowedDomains.some((domain) =>
            parsed.hostname.endsWith(domain),
          );
          if (!isAllowed) {
            res.status(400).json({ message: "Invalid or disallowed URL" });
            return;
          }
        } catch {
          res.status(400).json({ message: "Invalid URL format" });
          return;
        }
      }
    }
    next();
  };
};

export { mongoSanitize };

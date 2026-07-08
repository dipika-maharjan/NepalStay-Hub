import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "24h";

export interface JWTPayload {
  userId: string;
  role: string;
  uuid: string;
}

export const generateToken = (payload: JWTPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const verifyToken = (token: string): JWTPayload =>
  jwt.verify(token, JWT_SECRET) as JWTPayload;

// httpOnly cookie — not accessible via JavaScript (XSS protection)
// sameSite strict — CSRF protection
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

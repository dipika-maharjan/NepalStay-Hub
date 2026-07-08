import crypto from "crypto";
import bcrypt from "bcryptjs";

// Cryptographically secure 6-digit OTP
export const generateOTP = (): string => {
  const buffer = crypto.randomBytes(3);
  return (parseInt(buffer.toString("hex"), 16) % 1000000)
    .toString()
    .padStart(6, "0");
};

export const hashOTP = async (otp: string): Promise<string> =>
  bcrypt.hash(otp, 10);

export const verifyOTP = async (
  otp: string,
  hashedOTP: string,
): Promise<boolean> => bcrypt.compare(otp, hashedOTP);

// For password reset tokens
export const generateSecureToken = (): string =>
  crypto.randomBytes(32).toString("hex");

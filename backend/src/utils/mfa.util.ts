import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-cbc";

// Encrypt MFA secret before storing in DB
export const encryptSecret = (secret: string): string => {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSecret = (encryptedSecret: string): string => {
  const [ivHex, encryptedHex] = encryptedSecret.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString();
};

export const generateMFASecret = (): string => generateSecret();

export const generateQRCode = async (
  email: string,
  secret: string,
): Promise<string> => {
  const otpAuthUrl = generateURI({
    label: email,
    issuer: "NepalStayHub",
    secret,
  });
  return QRCode.toDataURL(otpAuthUrl);
};

export const verifyTOTP = (token: string, encryptedSecret: string): boolean => {
  try {
    const secret = decryptSecret(encryptedSecret);
    const result = verifySync({ token, secret });
    return result.valid;
  } catch {
    return false;
  }
};

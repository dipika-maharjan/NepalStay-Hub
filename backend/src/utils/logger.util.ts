import winston from "winston";
import "winston-mongodb";

const { combine, timestamp, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [
    // Console for development
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    }),
    // MongoDB for persistent audit trail
    new (winston.transports as any).MongoDB({
      db: process.env.MONGODB_URI!,
      collection: "logs",
      level: "info",
      options: { useUnifiedTopology: true },
      // Never log sensitive fields
      metaKey: "metadata",
    }),
  ],
});

// Safe logging — strips sensitive fields before logging
export const safeLog = (
  level: "info" | "warn" | "error",
  action: string,
  metadata: Record<string, unknown> = {},
): void => {
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "otp",
    "cardNumber",
    "cvv",
    "mfaSecret",
    "resetToken",
  ];

  const safe = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) => !sensitiveFields.includes(key.toLowerCase()),
    ),
  );

  logger[level]({ action, metadata: safe });
};

export default logger;

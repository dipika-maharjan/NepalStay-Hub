import mongoose, { Schema, Document } from "mongoose";

export type AuditAction =
  | "USER_REGISTER"
  | "USER_LOGIN"
  | "USER_LOGIN_FAILED"
  | "USER_LOGOUT"
  | "USER_LOCKED"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET_REQUEST"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "MFA_FAILED"
  | "PROFILE_UPDATE"
  | "HOST_VERIFICATION_SUBMITTED"
  | "HOST_VERIFICATION_APPROVED"
  | "HOST_VERIFICATION_REJECTED"
  | "ACCOMMODATION_CREATED"
  | "ACCOMMODATION_UPDATED"
  | "ACCOMMODATION_DELETED"
  | "BOOKING_CREATED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "REVIEW_CREATED"
  | "ADMIN_ACTION";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | null;
  action: AuditAction;
  targetType: string | null;
  targetId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  // Generic metadata — never log passwords/tokens/card data
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema<IAuditLog>(
  {
    // Nullable — some actions happen before auth (e.g. failed login)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      default: null,
    },
    targetId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // No updatedAt needed — logs are immutable
    timestamps: false,
  },
);

// TTL index — auto-delete logs older than 90 days
AuditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

export const AuditLogModel = mongoose.model<IAuditLog>(
  "AuditLog",
  AuditLogSchema,
);

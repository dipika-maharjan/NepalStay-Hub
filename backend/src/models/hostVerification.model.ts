import mongoose, { Schema, Document } from "mongoose";

export interface IHostVerification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentType: "citizenship" | "passport" | "license";
  documentUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  reviewedBy: mongoose.Types.ObjectId | null;
  reviewedAt: Date | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HostVerificationSchema: Schema = new Schema<IHostVerification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One verification record per user
      index: true,
    },
    documentType: {
      type: String,
      enum: ["citizenship", "passport", "license"],
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    // Admin who reviewed this — for audit trail
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent sensitive document URLs appearing in general API responses
HostVerificationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.__v;
    return document;
  },
});

export const HostVerificationModel = mongoose.model<IHostVerification>(
  "HostVerification",
  HostVerificationSchema,
);

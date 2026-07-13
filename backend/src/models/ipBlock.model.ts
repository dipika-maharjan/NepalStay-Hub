import mongoose, { Schema, Document } from "mongoose";

export interface IIPBlock extends Document {
  _id: mongoose.Types.ObjectId;
  ipAddress: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date | null;
  permanent: boolean;
}

const IPBlockSchema: Schema = new Schema<IIPBlock>(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
    // null means permanent block
    expiresAt: {
      type: Date,
      default: null,
    },
    permanent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: false },
);

// Auto-remove expired blocks
IPBlockSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { permanent: false } },
);

export const IPBlockModel = mongoose.model<IIPBlock>("IPBlock", IPBlockSchema);

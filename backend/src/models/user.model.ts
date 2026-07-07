import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  uuid: string;
  name: string;
  email: string;
  password: string;
  role: "traveler" | "host" | "admin";
  isHostVerified: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  profileImage: string | null;
  phone: string | null;
  bio: string | null;
  // Password security
  passwordChangedAt: Date | null;
  previousPasswords: string[];
  // Brute force protection
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["traveler", "host", "admin"],
      default: "traveler",
    },
    isHostVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    // Stored encrypted — never plaintext
    mfaSecret: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      maxlength: 500,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    // Stores hashed previous passwords for reuse prevention
    previousPasswords: {
      type: [String],
      default: [],
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Never expose sensitive fields in API responses
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.mfaSecret;
    delete ret.previousPasswords;
    delete ret.failedLoginAttempts;
    delete ret.lockoutUntil;
    delete ret.__v;
    return ret;
  },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);

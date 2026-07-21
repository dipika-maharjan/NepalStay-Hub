import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  uuid: string;
  name: string;
  email: string;
  password: string;
  role: "traveler" | "admin";
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
  emailOTP: string | null;
  emailOTPExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiry: Date | null;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    uuid: {
      type: String,
      default: () => uuidv4(),
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
      enum: ["traveler", "admin"],
      default: "traveler",
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
    emailOTP: {
      type: String,
      default: null,
    },
    emailOTPExpiry: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetTokenExpiry: {
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
    const document = ret as Record<string, unknown>;

    delete document.password;
    delete document.mfaSecret;
    delete document.previousPasswords;
    delete document.failedLoginAttempts;
    delete document.lockoutUntil;
    delete document.emailOTP;
    delete document.emailOTPExpiry;
    delete document.passwordResetToken;
    delete document.passwordResetTokenExpiry;
    delete document.__v;

    return document;
  },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  travelerId: mongoose.Types.ObjectId;
  // Stripe references only — never store card data
  stripePaymentIntentId: string;
  stripeClientSecret: string | null;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema<IPayment>(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    // Only stored temporarily for frontend confirmation — cleared after use
    stripeClientSecret: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Never expose Stripe secrets in API responses
PaymentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.stripeClientSecret;
    delete document.__v;
    return document;
  },
});

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);

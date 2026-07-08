import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  travelerId: mongoose.Types.ObjectId;
  accommodationId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  nights: number;
  pricePerNight: number;
  extrasTotal: number;
  totalPrice: number;
  specialRequest: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema<IBooking>(
  {
    // travelerId replaces generic userId — explicit for IDOR checks
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accommodationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    // Stored directly for quick host dashboard queries without join
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Which room type was booked
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
      index: true,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    // Stored separately for clear price breakdown
    extrasTotal: { type: Number, required: true, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    specialRequest: { type: String, default: null, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for double-booking prevention checks
BookingSchema.index({ roomTypeId: 1, checkIn: 1, checkOut: 1 });
// IDOR ownership checks
BookingSchema.index({ travelerId: 1, status: 1 });
// Host dashboard queries
BookingSchema.index({ hostId: 1, status: 1 });

BookingSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.__v;
    return document;
  },
});

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);

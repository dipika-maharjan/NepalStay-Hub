import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accommodationId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  roomsBooked: number;
  nights: number;
  basePriceTotal: number;
  extrasTotal: number;
  tax: number;
  serviceFee: number;
  totalPrice: number;
  specialRequest: string | null;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentId: mongoose.Types.ObjectId | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema<IBooking>(
  {
    // User ownership for booking access checks
    userId: {
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
    roomsBooked: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 1 },
    basePriceTotal: { type: Number, required: true, min: 0 },
    // Stored separately for clear price breakdown
    extrasTotal: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    serviceFee: { type: Number, required: true, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    specialRequest: { type: String, default: null, maxlength: 500 },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for double-booking prevention checks
BookingSchema.index({ roomTypeId: 1, checkIn: 1, checkOut: 1 });
// IDOR ownership checks
BookingSchema.index({ userId: 1, bookingStatus: 1 });
// Host dashboard queries
BookingSchema.index({ hostId: 1, bookingStatus: 1 });

BookingSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.__v;
    return document;
  },
});

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IBookingExtra extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  extraId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookingExtraSchema: Schema = new Schema<IBookingExtra>(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    extraId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OptionalExtra",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Store price at time of booking — protects against price changes later
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

BookingExtraSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.__v;
    return document;
  },
});

export const BookingExtraModel = mongoose.model<IBookingExtra>(
  "BookingExtra",
  BookingExtraSchema,
);

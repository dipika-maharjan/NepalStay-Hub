import mongoose, { Schema, Document } from "mongoose";

export interface IOptionalExtra extends Document {
  _id: mongoose.Types.ObjectId;
  accommodationId: mongoose.Types.ObjectId;
  name: string;
  description: string | null;
  price: number;
  priceType: "per_person" | "per_booking";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OptionalExtraSchema: Schema = new Schema<IOptionalExtra>(
  {
    accommodationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: null,
      maxlength: 300,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    priceType: {
      type: String,
      enum: ["per_person", "per_booking"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

OptionalExtraSchema.index({ accommodationId: 1, isActive: 1 });

OptionalExtraSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.__v;
    return document;
  },
});

export const OptionalExtraModel = mongoose.model<IOptionalExtra>(
  "OptionalExtra",
  OptionalExtraSchema,
);

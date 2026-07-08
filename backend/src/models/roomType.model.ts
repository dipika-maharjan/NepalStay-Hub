import mongoose, { Schema, Document } from "mongoose";

export interface IRoomType extends Document {
  _id: mongoose.Types.ObjectId;
  accommodationId: mongoose.Types.ObjectId;
  name: string;
  description: string | null;
  pricePerNight: number;
  maxGuests: number;
  totalRooms: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema: Schema = new Schema<IRoomType>(
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
      maxlength: 500,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    totalRooms: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

RoomTypeSchema.index({ accommodationId: 1, isActive: 1 });

RoomTypeSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.__v;
    return document;
  },
});

export const RoomTypeModel = mongoose.model<IRoomType>(
  "RoomType",
  RoomTypeSchema,
);

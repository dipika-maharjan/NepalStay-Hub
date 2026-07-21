import mongoose, { Schema, Document } from "mongoose";

export interface IAccommodation extends Document {
  _id: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: "homestay" | "guesthouse" | "lodge" | "farmstay";
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  isApprovedByAdmin: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const AccommodationSchema: Schema = new Schema<IAccommodation>(
  {
    // hostId replaces generic createdBy — explicit ownership for IDOR protection
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ["homestay", "guesthouse", "lodge", "farmstay"],
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
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
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    // Only active listings appear in search results
    isActive: {
      type: Boolean,
      default: true,
    },
    // Admin-created listings should be visible by default for public browsing
    isApprovedByAdmin: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for geolocation queries
AccommodationSchema.index({ "location.lat": 1, "location.lng": 1 });
// Index for host ownership lookups (IDOR checks)
AccommodationSchema.index({ hostId: 1, isActive: 1 });

AccommodationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const document = ret as Record<string, unknown>;
    delete document.__v;
    return document;
  },
});

export const AccommodationModel = mongoose.model<IAccommodation>(
  "Accommodation",
  AccommodationSchema,
);

import mongoose from "mongoose";
import { AccommodationModel } from "../models/accommodation.model";

describe("Accommodation visibility defaults", () => {
  it("marks new accommodations as approved by default for public visibility", () => {
    const accommodation = new AccommodationModel({
      hostId: new mongoose.Types.ObjectId(),
      title: "Test stay",
      description: "A test stay",
      type: "homestay",
      address: "Kathmandu",
      location: { lat: 27.7172, lng: 85.324 },
      pricePerNight: 1500,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
    });

    expect(accommodation.isApprovedByAdmin).toBe(true);
  });
});

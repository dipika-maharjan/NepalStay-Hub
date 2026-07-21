import { Request, Response } from "express";
import { ReviewModel } from "../models/review.model";
import { BookingModel } from "../models/booking.model";
import { AccommodationModel } from "../models/accommodation.model";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/reviews
export const createReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const travelerId = authReq.user?.userId;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      res
        .status(400)
        .json({ message: "Booking ID, rating and comment are required" });
      return;
    }

    const booking = await BookingModel.findOne({
      _id: bookingId,
      userId: travelerId,
      bookingStatus: "completed",
    });

    if (!booking) {
      res
        .status(403)
        .json({
          message: "You can only review accommodations after a completed stay",
        });
      return;
    }

    const existing = await ReviewModel.findOne({ bookingId });
    if (existing) {
      res
        .status(409)
        .json({ message: "You have already reviewed this booking" });
      return;
    }

    const review = await ReviewModel.create({
      bookingId,
      userId: travelerId,
      accommodationId: booking.accommodationId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const reviews = await ReviewModel.find({
      accommodationId: booking.accommodationId,
    });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await AccommodationModel.findByIdAndUpdate(booking.accommodationId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });

    res.status(201).json({ message: "Review submitted", review });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/reviews/:accommodationId
export const getReviewsByAccommodation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const reviews = await ReviewModel.find({
      accommodationId: req.params.accommodationId,
    })
      .populate("userId", "name profileImage")
      .sort({ createdAt: -1 });
    res.status(200).json({ reviews });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/reviews
export const getAllReviewsAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    let filter: any = {};
    if (req.query.accommodationId) {
      filter.accommodationId = req.query.accommodationId;
    }
    const reviews = await ReviewModel.find(filter)
      .populate("userId", "name profileImage")
      .populate("accommodationId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ reviews });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/reviews/:id — traveler own review or admin
export const deleteReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const role = authReq.user?.role;

    const filter =
      role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId };

    const review = await ReviewModel.findOneAndDelete(filter);
    if (!review) {
      res.status(404).json({ message: "Review not found or access denied" });
      return;
    }

    const reviews = await ReviewModel.find({
      accommodationId: review.accommodationId,
    });
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    await AccommodationModel.findByIdAndUpdate(review.accommodationId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });

    res.status(200).json({ message: "Review deleted" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

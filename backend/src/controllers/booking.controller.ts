import { Request, Response } from "express";
import { BookingModel } from "../models/booking.model";
import { AccommodationModel } from "../models/accommodation.model";
import { RoomTypeModel } from "../models/roomType.model";
import { AuditLogModel } from "../models/auditLog.model";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/bookings
export const createBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const travelerId = authReq.user?.userId;
    const {
      accommodationId,
      roomTypeId,
      checkIn,
      checkOut,
      guests,
      specialRequest,
      extrasTotal,
    } = req.body;

    if (!accommodationId || !roomTypeId || !checkIn || !checkOut || !guests) {
      res.status(400).json({ message: "Required fields missing" });
      return;
    }

    const accommodation = await AccommodationModel.findOne({
      _id: accommodationId,
      isActive: true,
      isApprovedByAdmin: true,
    });
    if (!accommodation) {
      res.status(404).json({ message: "Accommodation not found" });
      return;
    }

    const roomType = await RoomTypeModel.findOne({
      _id: roomTypeId,
      accommodationId,
      isActive: true,
    });
    if (!roomType) {
      res.status(404).json({ message: "Room type not found" });
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const roomsBooked = Number(req.body.roomsBooked || 1);

    if (checkInDate >= checkOutDate) {
      res.status(400).json({ message: "Check-out must be after check-in" });
      return;
    }

    if (checkInDate < new Date()) {
      res.status(400).json({ message: "Check-in cannot be in the past" });
      return;
    }

    if (Number(guests) > roomType.maxGuests) {
      res
        .status(400)
        .json({
          message: `Maximum ${roomType.maxGuests} guests allowed for this room`,
        });
      return;
    }

    const conflict = await BookingModel.findOne({
      roomTypeId,
      bookingStatus: { $in: ["pending", "confirmed"] },
      $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
    });

    if (conflict) {
      res
        .status(409)
        .json({ message: "Room not available for selected dates" });
      return;
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice =
      roomType.pricePerNight * nights + Number(extrasTotal || 0);

    const booking = await BookingModel.create({
      userId: travelerId,
      accommodationId,
      hostId: accommodation.hostId,
      roomTypeId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Number(guests),
      roomsBooked,
      nights,
      basePriceTotal: roomType.pricePerNight * nights,
      extrasTotal: Number(extrasTotal || 0),
      tax: 0,
      serviceFee: 0,
      totalPrice,
      specialRequest: specialRequest?.trim() || null,
      bookingStatus: "pending",
      paymentStatus: "pending",
    });

    const bookingDoc = booking as any;
    await AuditLogModel.create({
      userId: travelerId,
      action: "BOOKING_CREATED",
      targetType: "Booking",
      targetId: bookingDoc._id.toString(),
      ipAddress: req.ip || "unknown",
      metadata: { accommodationId, checkIn, checkOut, totalPrice },
      timestamp: new Date(),
    });

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/bookings/my — traveler's own bookings only (IDOR protected)
export const getMyBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const bookings = await BookingModel.find({ userId: authReq.user?.userId })
      .populate("accommodationId", "title images address")
      .populate("roomTypeId", "name pricePerNight")
      .sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/bookings/host — host's incoming bookings
export const getHostBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const bookings = await BookingModel.find({ hostId: authReq.user?.userId })
      .populate("userId", "name email")
      .populate("accommodationId", "title")
      .populate("roomTypeId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/bookings/:id — IDOR: only traveler or host of this booking
export const getBookingById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const booking = await BookingModel.findOne({
      _id: req.params.id,
      $or: [{ userId: userId }, { hostId: userId }],
    })
      .populate("accommodationId", "title images address location")
      .populate("roomTypeId", "name pricePerNight")
      .populate("userId", "name email");

    if (!booking) {
      res.status(404).json({ message: "Booking not found or access denied" });
      return;
    }
    res.status(200).json({ booking });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/bookings/:id/cancel
export const cancelBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const booking = await BookingModel.findOne({
      _id: req.params.id,
      $or: [{ userId: userId }, { hostId: userId }],
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found or access denied" });
      return;
    }

    const bookingDoc = booking as any;
    if (!["pending", "confirmed"].includes(bookingDoc.bookingStatus)) {
      res
        .status(400)
        .json({ message: "Booking cannot be cancelled in its current state" });
      return;
    }

    bookingDoc.bookingStatus = "cancelled";
    await bookingDoc.save();

    await AuditLogModel.create({
      userId,
      action: "BOOKING_CANCELLED",
      targetType: "Booking",
      targetId: bookingDoc._id.toString(),
      ipAddress: req.ip || "unknown",
      metadata: {},
      timestamp: new Date(),
    });

    res.status(200).json({ message: "Booking cancelled", booking: bookingDoc });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/bookings — admin view all
export const adminGetAllBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bookings = await BookingModel.find()
      .populate("userId", "name email")
      .populate("accommodationId", "title")
      .populate("hostId", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

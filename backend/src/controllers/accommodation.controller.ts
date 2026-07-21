import { Request, Response } from "express";
import { AccommodationModel } from "../models/accommodation.model";
import { RoomTypeModel } from "../models/roomType.model";
import { OptionalExtraModel } from "../models/optionalExtra.model";
import { AuditLogModel } from "../models/auditLog.model";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/accommodations — public
export const getAccommodations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { type, minPrice, maxPrice } = req.query;

    const filter: Record<string, unknown> = {
      isActive: true,
      isApprovedByAdmin: true,
    };

    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice)
        (filter.pricePerNight as Record<string, unknown>).$gte =
          Number(minPrice);
      if (maxPrice)
        (filter.pricePerNight as Record<string, unknown>).$lte =
          Number(maxPrice);
    }

    const accommodations = await AccommodationModel.find(filter)
      .populate("hostId", "name profileImage")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AccommodationModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Accommodations fetched successfully",
      data: accommodations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error in getAccommodations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/accommodations/:id — public
export const getAccommodationById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const accommodation = await AccommodationModel.findOne({
      _id: req.params.id,
      isActive: true,
      isApprovedByAdmin: true,
    }).populate("hostId", "name profileImage bio");

    if (!accommodation) {
      res.status(404).json({ message: "Accommodation not found" });
      return;
    }

    const roomTypes = await RoomTypeModel.find({
      accommodationId: accommodation._id,
      isActive: true,
    });
    const extras = await OptionalExtraModel.find({
      accommodationId: accommodation._id,
      isActive: true,
    });

    res.status(200).json({ accommodation, roomTypes, extras });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/accommodations — host only + verified
export const createAccommodation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const hostId = authReq.user?.userId;
    const {
      title,
      description,
      type,
      address,
      location,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
    } = req.body;

    if (
      !title ||
      !description ||
      !type ||
      !address ||
      !location ||
      !pricePerNight ||
      !maxGuests
    ) {
      res.status(400).json({ message: "Required fields missing" });
      return;
    }

    const images =
      (req.files as Express.Multer.File[])?.map(
        (f) => `/uploads/accommodations/${f.filename}`,
      ) || [];

    const shouldApprove =
      req.body.isApprovedByAdmin !== undefined
        ? req.body.isApprovedByAdmin
        : true;

    const accommodation = await AccommodationModel.create({
      hostId,
      title: title.trim(),
      description: description.trim(),
      type,
      address: address.trim(),
      location: JSON.parse(location),
      pricePerNight: Number(pricePerNight),
      maxGuests: Number(maxGuests),
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      amenities: amenities ? JSON.parse(amenities) : [],
      images,
      isActive: true,
      isApprovedByAdmin: shouldApprove,
    });

    await AuditLogModel.create({
      userId: hostId,
      action: "ACCOMMODATION_CREATED",
      targetType: "Accommodation",
      targetId: accommodation._id.toString(),
      ipAddress: req.ip || "unknown",
      metadata: { title },
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Accommodation created successfully.",
      accommodation,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/accommodations/:id — host only, own listing
export const updateAccommodation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const hostId = authReq.user?.userId;
    const filter: any = { _id: req.params.id };

    const existing = await AccommodationModel.findOne(filter);
    if (!existing) {
      res
        .status(404)
        .json({ message: "Accommodation not found or access denied" });
      return;
    }

    const allowedUpdates = [
      "title",
      "description",
      "address",
      "pricePerNight",
      "maxGuests",
      "bedrooms",
      "bathrooms",
      "amenities",
      "isActive",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const accommodation = await AccommodationModel.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    await AuditLogModel.create({
      userId: hostId,
      action: "ACCOMMODATION_UPDATED",
      targetType: "Accommodation",
      targetId: req.params.id,
      ipAddress: req.ip || "unknown",
      metadata: { updatedFields: Object.keys(updates) },
      timestamp: new Date(),
    });

    res.status(200).json({
      message: "Accommodation updated successfully.",
      accommodation,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/accommodations/:id — host only, own listing
export const deleteAccommodation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const hostId = authReq.user?.userId;
    const filter: any = { _id: req.params.id };

    const accommodation = await AccommodationModel.findOneAndDelete(filter);
    if (!accommodation) {
      res
        .status(404)
        .json({ message: "Accommodation not found or access denied" });
      return;
    }

    await AuditLogModel.create({
      userId: hostId,
      action: "ACCOMMODATION_DELETED",
      targetType: "Accommodation",
      targetId: req.params.id,
      ipAddress: req.ip || "unknown",
      metadata: {},
      timestamp: new Date(),
    });

    res.status(200).json({ message: "Accommodation deleted" });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/accommodations/my — host's own listings
export const getMyAccommodations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const accommodations = await AccommodationModel.find({
      hostId: authReq.user?.userId,
    }).sort({ createdAt: -1 });
    res.status(200).json({ accommodations });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/admin/accommodations/:id/approve — admin only
export const adminApproveAccommodation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const accommodation = await AccommodationModel.findByIdAndUpdate(
      req.params.id,
      { isApprovedByAdmin: true },
      { new: true },
    );
    if (!accommodation) {
      res.status(404).json({ message: "Accommodation not found" });
      return;
    }

    await AuditLogModel.create({
      userId: (req as AuthRequest).user?.userId,
      action: "ADMIN_ACTION",
      targetType: "Accommodation",
      targetId: req.params.id,
      ipAddress: req.ip || "unknown",
      metadata: { action: "accommodation_approved" },
      timestamp: new Date(),
    });

    res.status(200).json({ message: "Accommodation approved", accommodation });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/accommodations/admin/all — admin only
export const adminGetAllAccommodations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const accommodations = await AccommodationModel.find()
      .populate("hostId", "name profileImage")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: accommodations });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

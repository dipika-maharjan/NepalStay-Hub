import { Response } from "express";
import { RoomTypeModel } from "../models/roomType.model";
import { AccommodationModel } from "../models/accommodation.model";
import { AuthRequest } from "../middleware/auth.middleware";

const getOwnedAccommodation = async (
  req: AuthRequest,
  res: Response,
  accommodationId: string,
) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Authentication required", data: null });
    return null;
  }

  const accommodation = await AccommodationModel.findById(accommodationId);

  if (!accommodation) {
    res.status(404).json({ message: "Accommodation not found", data: null });
    return null;
  }

  if (accommodation.hostId.toString() !== userId) {
    res.status(403).json({ message: "Forbidden", data: null });
    return null;
  }

  return accommodation;
};

export const getRoomTypesByAccommodation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { accommodationId } = req.params;
    const roomTypes = await RoomTypeModel.find({
      accommodationId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Room types fetched successfully",
      data: roomTypes,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRoomTypeById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const roomType = await RoomTypeModel.findById(id).populate("accommodationId", "name title");

    if (!roomType) {
      res.status(404).json({ message: "Room type not found", data: null });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Room type fetched successfully",
      data: roomType,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAllRoomTypes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    let filter: any = {};
    if (!includeInactive) filter.isActive = true;
    if (req.query.accommodationId) filter.accommodationId = req.query.accommodationId;

    const roomTypes = await RoomTypeModel.find(filter)
      .populate("accommodationId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Room types fetched successfully",
      data: roomTypes,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createRoomType = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      accommodationId,
      name,
      description,
      pricePerNight,
      maxGuests,
      totalRooms,
    } = req.body as {
      accommodationId: string;
      name: string;
      description?: string;
      pricePerNight: number;
      maxGuests: number;
      totalRooms: number;
    };

    const accommodation = await getOwnedAccommodation(
      req,
      res,
      accommodationId as string,
    );

    if (!accommodation) {
      return;
    }

    const roomType = await RoomTypeModel.create({
      accommodationId,
      name,
      description: description ?? null,
      pricePerNight,
      maxGuests,
      totalRooms,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Room type created successfully",
      data: roomType,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRoomType = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const existingRoomType = await RoomTypeModel.findById(id);

    if (!existingRoomType) {
      res.status(404).json({ message: "Room type not found", data: null });
      return;
    }

    const accommodation = await getOwnedAccommodation(
      req,
      res,
      existingRoomType.accommodationId.toString(),
    );

    if (!accommodation) {
      return;
    }

    const {
      name,
      description,
      pricePerNight,
      maxGuests,
      totalRooms,
      isActive,
    } = req.body as {
      name?: string;
      description?: string;
      pricePerNight?: number;
      maxGuests?: number;
      totalRooms?: number;
      isActive?: boolean;
    };

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (pricePerNight !== undefined) updateData.pricePerNight = pricePerNight;
    if (maxGuests !== undefined) updateData.maxGuests = maxGuests;
    if (totalRooms !== undefined) updateData.totalRooms = totalRooms;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRoomType = await RoomTypeModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Room type updated successfully",
      data: updatedRoomType,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteRoomType = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const existingRoomType = await RoomTypeModel.findById(id);

    if (!existingRoomType) {
      res.status(404).json({ message: "Room type not found", data: null });
      return;
    }

    const accommodation = await getOwnedAccommodation(
      req,
      res,
      existingRoomType.accommodationId.toString(),
    );

    if (!accommodation) {
      return;
    }

    const deletedRoomType = await RoomTypeModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Room type deleted successfully",
      data: deletedRoomType,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

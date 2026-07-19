import { Response } from "express";
import { OptionalExtraModel } from "../models/optionalExtra.model";
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

export const getExtrasByAccommodation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { accommodationId } = req.params;
    const extras = await OptionalExtraModel.find({
      accommodationId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Optional extras fetched successfully",
      data: extras,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllOptionalExtras = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    let filter: any = {};
    if (!includeInactive) filter.isActive = true;

    const extras = await OptionalExtraModel.find(filter)
      .populate("accommodationId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Optional extras fetched successfully",
      data: extras,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createExtra = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { accommodationId, name, description, price, priceType } =
      req.body as {
        accommodationId: string;
        name: string;
        description?: string;
        price: number;
        priceType: "per_person" | "per_booking";
      };

    const accommodation = await getOwnedAccommodation(
      req,
      res,
      accommodationId as string,
    );

    if (!accommodation) {
      return;
    }

    const extra = await OptionalExtraModel.create({
      accommodationId,
      name,
      description: description ?? null,
      price,
      priceType,
      isActive: true,
    });

    res.status(201).json({
      message: "Optional extra created successfully",
      data: extra,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateExtra = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const existingExtra = await OptionalExtraModel.findById(id);

    if (!existingExtra) {
      res.status(404).json({ message: "Optional extra not found", data: null });
      return;
    }

    const accommodation = await getOwnedAccommodation(
      req,
      res,
      existingExtra.accommodationId.toString(),
    );

    if (!accommodation) {
      return;
    }

    const { name, description, price, priceType, isActive } =
      req.body as {
        name?: string;
        description?: string;
        price?: number;
        priceType?: "per_person" | "per_booking";
        isActive?: boolean;
      };

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (priceType !== undefined) updateData.priceType = priceType;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedExtra = await OptionalExtraModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "Optional extra updated successfully",
      data: updatedExtra,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteExtra = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const existingExtra = await OptionalExtraModel.findById(id);

    if (!existingExtra) {
      res.status(404).json({ message: "Optional extra not found", data: null });
      return;
    }

    const accommodation = await getOwnedAccommodation(
      req,
      res,
      existingExtra.accommodationId.toString(),
    );

    if (!accommodation) {
      return;
    }

    const deletedExtra = await OptionalExtraModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    res.status(200).json({
      message: "Optional extra deleted successfully",
      data: deletedExtra,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

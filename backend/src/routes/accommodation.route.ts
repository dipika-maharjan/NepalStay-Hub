import { Router } from "express";
import {
  getAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  adminGetAllAccommodations,
} from "../controllers/accommodation.controller";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware";
import { accommodationUpload } from "../middleware/upload.middleware";

const router = Router();

// Public routes
router.get("/", getAccommodations);
router.get(
  "/admin/all",
  requireAuth,
  requireRole("admin"),
  adminGetAllAccommodations,
);
router.get("/:id", getAccommodationById);

// Admin Only
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  accommodationUpload.array("images", 10),
  createAccommodation,
);
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  updateAccommodation,
);
router.delete("/:id", requireAuth, requireRole("admin"), deleteAccommodation);

export default router;

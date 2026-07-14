import { Router } from "express";
import {
  getAccommodations,
  getAccommodationById,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  getMyAccommodations,
  adminApproveAccommodation,
} from "../controllers/accommodation.controller";
import { requireAuth, requireRole, requireHostVerified } from "../middleware/auth.middleware";
import { accommodationUpload } from "../middleware/upload.middleware";

const router = Router();

// Public routes
router.get("/", getAccommodations);
router.get("/my", requireAuth, requireRole("host"), getMyAccommodations);
router.get("/:id", getAccommodationById);

// Host only — must be verified
router.post("/", requireAuth, requireRole("host"), requireHostVerified, accommodationUpload.array("images", 10), createAccommodation);
router.put("/:id", requireAuth, requireRole("host"), requireHostVerified, updateAccommodation);
router.delete("/:id", requireAuth, requireRole("host"), deleteAccommodation);

// Admin only
router.put("/admin/:id/approve", requireAuth, requireRole("admin"), adminApproveAccommodation);

export default router;

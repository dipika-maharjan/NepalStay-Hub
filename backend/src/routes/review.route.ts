import { Router } from "express";
import {
  createReview,
  getReviewsByAccommodation,
  deleteReview,
  getAllReviewsAdmin,
} from "../controllers/review.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), getAllReviewsAdmin);
router.post("/", requireAuth, requireRole("traveler"), createReview);
router.get("/:accommodationId", getReviewsByAccommodation);
router.delete("/:id", requireAuth, deleteReview);

export default router;

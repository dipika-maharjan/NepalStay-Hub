import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  deleteBooking,
  adminGetAllBookings,
  updateBooking,
} from "../controllers/booking.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, requireRole("traveler"), createBooking);
router.get("/my", requireAuth, requireRole("traveler"), getMyBookings);
router.get(
  "/admin/all",
  requireAuth,
  requireRole("admin"),
  adminGetAllBookings,
);
router.get("/:id", requireAuth, getBookingById);
router.patch("/:id", requireAuth, updateBooking);
router.delete("/:id", requireAuth, deleteBooking);
router.put("/:id/cancel", requireAuth, cancelBooking);

export default router;

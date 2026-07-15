import { Router } from "express";
import {
  createPaymentIntent,
  stripeWebhook,
  getPaymentByBooking,
} from "../controllers/payment.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Webhook must use raw body — registered separately in app.ts
router.post(
  "/webhook",
  stripeWebhook
);

router.post("/create-intent", requireAuth, requireRole("traveler"), createPaymentIntent);
router.get("/booking/:bookingId", requireAuth, requireRole("traveler"), getPaymentByBooking);

export default router;

import { Router } from "express";
import {
  submitVerification,
  getVerificationStatus,
  getAllVerifications,
  approveVerification,
  rejectVerification,
} from "../controllers/hostVerification.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { verificationUpload } from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/submit",
  requireAuth,
  requireRole("host", "traveler"),
  verificationUpload.single("document"),
  submitVerification,
);
router.get("/status", requireAuth, getVerificationStatus);

// Admin routes
router.get("/admin/all", requireAuth, requireRole("admin"), getAllVerifications);
router.put("/admin/:id/approve", requireAuth, requireRole("admin"), approveVerification);
router.put("/admin/:id/reject", requireAuth, requireRole("admin"), rejectVerification);

export default router;

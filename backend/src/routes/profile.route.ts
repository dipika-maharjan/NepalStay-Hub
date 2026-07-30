import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  exportProfileData,
} from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { generalRateLimiter } from "../middleware/rateLimiter.middleware";
import { profileUpload } from "../middleware/upload.middleware";

const router = Router();

// All profile routes require authentication
router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, profileUpload.single("image"), updateProfile);
router.put("/change-password", requireAuth, changePassword);
router.get("/export", requireAuth, generalRateLimiter, exportProfileData);

export default router;

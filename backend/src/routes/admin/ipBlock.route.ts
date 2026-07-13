import { Router } from "express";
import {
  getBlockedIPs,
  blockIP,
  unblockIP,
} from "../../controllers/ipBlock.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

// All IP block management is admin only
router.get("/", requireAuth, requireRole("admin"), getBlockedIPs);
router.post("/", requireAuth, requireRole("admin"), blockIP);
router.delete("/:ip", requireAuth, requireRole("admin"), unblockIP);

export default router;

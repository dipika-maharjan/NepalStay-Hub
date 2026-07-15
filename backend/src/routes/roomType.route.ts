import { Router } from "express";
import {
  getRoomTypesByAccommodation,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from "../controllers/roomType.controller";
import {
  requireAuth,
  requireRole,
  requireHostVerified,
} from "../middleware/auth.middleware";

const router = Router();

router.get("/:accommodationId", getRoomTypesByAccommodation);
router.post(
  "/",
  requireAuth,
  requireRole("host"),
  requireHostVerified,
  createRoomType,
);
router.put("/:id", requireAuth, requireRole("host"), updateRoomType);
router.delete("/:id", requireAuth, requireRole("host"), deleteRoomType);

export default router;

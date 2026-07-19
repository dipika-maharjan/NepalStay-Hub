import { Router } from "express";
import {
  getRoomTypesByAccommodation,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  getAllRoomTypes,
} from "../controllers/roomType.controller";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), getAllRoomTypes);
router.get("/:accommodationId", getRoomTypesByAccommodation);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  createRoomType,
);
router.put("/:id", requireAuth, requireRole("admin"), updateRoomType);
router.delete("/:id", requireAuth, requireRole("admin"), deleteRoomType);

export default router;

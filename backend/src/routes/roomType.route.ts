import { Router } from "express";
import {
  createRoomType,
  updateRoomType,
  deleteRoomType,
  getAllRoomTypes,
  getRoomTypeById,
} from "../controllers/roomType.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getAllRoomTypes);
router.get("/:id", requireAuth, getRoomTypeById);
router.post("/", requireAuth, requireRole("admin"), createRoomType);
router.put("/:id", requireAuth, requireRole("admin"), updateRoomType);
router.delete("/:id", requireAuth, requireRole("admin"), deleteRoomType);

export default router;

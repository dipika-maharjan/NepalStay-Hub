import { Router } from "express";
import {
  createExtra,
  updateExtra,
  deleteExtra,
  getAllOptionalExtras,
  getExtraById,
} from "../controllers/optionalExtra.controller";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), getAllOptionalExtras);
router.get("/:id", requireAuth, requireRole("admin"), getExtraById);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  createExtra,
);
router.put("/:id", requireAuth, requireRole("admin"), updateExtra);
router.delete("/:id", requireAuth, requireRole("admin"), deleteExtra);

export default router;

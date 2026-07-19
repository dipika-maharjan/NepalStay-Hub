import { Router } from "express";
import {
  getExtrasByAccommodation,
  createExtra,
  updateExtra,
  deleteExtra,
  getAllOptionalExtras,
} from "../controllers/optionalExtra.controller";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), getAllOptionalExtras);
router.get("/:accommodationId", getExtrasByAccommodation);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  createExtra,
);
router.put("/:id", requireAuth, requireRole("admin"), updateExtra);
router.delete("/:id", requireAuth, requireRole("admin"), deleteExtra);

export default router;

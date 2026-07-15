import { Router } from "express";
import {
  getExtrasByAccommodation,
  createExtra,
  updateExtra,
  deleteExtra,
} from "../controllers/optionalExtra.controller";
import {
  requireAuth,
  requireRole,
  requireHostVerified,
} from "../middleware/auth.middleware";

const router = Router();

router.get("/:accommodationId", getExtrasByAccommodation);
router.post(
  "/",
  requireAuth,
  requireRole("host"),
  requireHostVerified,
  createExtra,
);
router.put("/:id", requireAuth, requireRole("host"), updateExtra);
router.delete("/:id", requireAuth, requireRole("host"), deleteExtra);

export default router;

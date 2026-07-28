import { Router } from "express";
import { getSecurityStatus } from "../controllers/security.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect using requireAuth middleware. Users may only access their own security information.
router.get("/status", requireAuth, getSecurityStatus);

export default router;

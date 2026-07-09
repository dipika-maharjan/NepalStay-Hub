import { Router } from "express";
import {
  setupMFA,
  verifyMFASetup,
  validateMFA,
  disableMFA,
} from "../controllers/mfa.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

// Setup and management — require existing auth
router.post("/setup", requireAuth, setupMFA);
router.post("/verify-setup", requireAuth, verifyMFASetup);
router.post("/disable", requireAuth, disableMFA);

// Login step — no auth cookie yet, uses tempUserId
router.post("/validate", authRateLimiter, validateMFA);

export default router;
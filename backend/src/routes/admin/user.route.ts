import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAuditLogs,
} from "../../controllers/admin/adminUser.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

// All routes admin only
router.use(requireAuth, requireRole("admin"));

router.get("/", getAllUsers);
router.get("/audit-logs", getAuditLogs);
router.get("/:id", getUserById);
router.put("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export const adminUserRoutes = router;
export default router;

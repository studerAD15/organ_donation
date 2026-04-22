import { Router } from "express";
import {
  listAdmins,
  listHospitals,
  listPlatformUsers,
  unlockAdminPanel,
  updateUserRole,
  createCampaignSuggestion,
  getAnalytics,
  getAuditLogs,
  getPendingVerifications,
  listAllRequests,
  overrideMatch,
  verifyDonor
} from "../controllers/adminController.js";
import { requireAdminPanelAccess } from "../middleware/adminAccessMiddleware.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { unlockAdminPanelSchema, updateUserRoleSchema, verifyUserSchema } from "../validators/adminValidator.js";

const router = Router();

router.post("/access/unlock", protect, authorize("admin"), validate(unlockAdminPanelSchema), unlockAdminPanel);

router.use(protect, authorize("admin"), requireAdminPanelAccess);

router.get("/users", listPlatformUsers);
router.get("/hospitals", listHospitals);
router.get("/admins", listAdmins);
router.patch("/users/:id/role", validate(updateUserRoleSchema), updateUserRole);
router.get("/verifications", getPendingVerifications);
router.patch("/verifications/:id", validate(verifyUserSchema), verifyDonor);
router.get("/analytics", getAnalytics);
router.get("/requests", listAllRequests);
router.patch("/requests/:id/override", overrideMatch);
router.get("/audit/:requestId", getAuditLogs);
router.get("/campaign-suggestions", createCampaignSuggestion);

export default router;

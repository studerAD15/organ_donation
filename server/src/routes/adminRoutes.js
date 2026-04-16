import { Router } from "express";
import {
  createCampaignSuggestion,
  getAnalytics,
  getAuditLogs,
  getPendingVerifications,
  listAllRequests,
  overrideMatch,
  verifyDonor
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/verifications", getPendingVerifications);
router.patch("/verifications/:id", verifyDonor);
router.get("/analytics", getAnalytics);
router.get("/requests", listAllRequests);
router.patch("/requests/:id/override", overrideMatch);
router.get("/audit/:requestId", getAuditLogs);
router.get("/campaign-suggestions", createCampaignSuggestion);

export default router;

import { Router } from "express";
import {
  getMyDonorProfile,
  getMyNotifications,
  getPublicDonorProfile,
  toggleSmsAlerts,
  updateAvailability
} from "../controllers/donorController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", protect, authorize("donor"), getMyDonorProfile);
router.patch("/availability", protect, authorize("donor"), updateAvailability);
router.patch("/alerts", protect, authorize("donor"), toggleSmsAlerts);
router.get("/notifications", protect, authorize("donor"), getMyNotifications);
router.get("/public/:id", getPublicDonorProfile);

export default router;

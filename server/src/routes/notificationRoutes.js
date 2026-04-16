import { Router } from "express";
import { getMyNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationRead);

export default router;

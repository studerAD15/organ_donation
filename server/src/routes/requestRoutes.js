import { Router } from "express";
import {
  createRequest,
  donorRespondToRequest,
  listDonorAssignments,
  listMyRequests,
  listPublicRequests,
  listTemplates,
  revealRequestContact,
  runMatchForRequest,
  saveTemplate,
  updateRequestStatus
} from "../controllers/requestController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listPublicRequests);
router.post("/", protect, authorize("recipient", "admin"), createRequest);
router.get("/mine", protect, authorize("recipient", "admin"), listMyRequests);
router.get("/donor-feed", protect, authorize("donor"), listDonorAssignments);
router.get("/templates/mine", protect, authorize("recipient"), listTemplates);
router.post("/templates", protect, authorize("recipient"), saveTemplate);
router.patch("/:id/status", protect, authorize("recipient", "admin"), updateRequestStatus);
router.post("/:id/match", protect, authorize("recipient", "admin"), runMatchForRequest);
router.post("/:id/respond", protect, authorize("donor"), donorRespondToRequest);
router.get("/:id/contact", protect, authorize("donor", "recipient", "admin"), revealRequestContact);

export default router;

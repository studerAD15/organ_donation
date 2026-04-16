import { Router } from "express";
import { getNearbyDonors } from "../controllers/mapController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const router = Router();

// Public map endpoint — anyone can browse donors on the map.
// optionalProtect attaches req.user if a token is present, but does NOT block unauthenticated users.
router.get("/nearby-donors", optionalProtect, getNearbyDonors);

export default router;

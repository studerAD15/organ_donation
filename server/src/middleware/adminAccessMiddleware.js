import { verifyAdminPanelToken } from "../utils/jwt.js";

export const requireAdminPanelAccess = (req, res, next) => {
  try {
    const panelToken = req.headers["x-admin-panel-token"];
    if (!panelToken || typeof panelToken !== "string") {
      return res.status(403).json({ message: "Admin panel access token required" });
    }

    const decoded = verifyAdminPanelToken(panelToken);
    if (decoded?.scope !== "admin_panel" || decoded?.role !== "admin" || String(decoded?.userId) !== String(req.user?._id)) {
      return res.status(403).json({ message: "Invalid admin panel session" });
    }

    req.adminPanel = decoded;
    return next();
  } catch (_error) {
    return res.status(403).json({ message: "Admin panel access denied" });
  }
};

import cron from "node-cron";
import Request from "../models/Request.js";
import AuditLog from "../models/AuditLog.js";

const startExpiryScheduler = () => {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    const expiring = await Request.find({ status: { $in: ["open", "matched"] }, expiresAt: { $lt: now } });

    if (!expiring.length) return;

    for (const reqDoc of expiring) {
      const oldStatus = reqDoc.status;
      reqDoc.status = "expired";
      await reqDoc.save();
      await AuditLog.create({
        requestId: reqDoc._id,
        oldStatus,
        newStatus: "expired",
        note: "Auto-expired by scheduler"
      });
    }
  });
};

export default startExpiryScheduler;

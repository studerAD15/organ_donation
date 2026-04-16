import Request from "../models/Request.js";
import User from "../models/User.js";
import { createNotification } from "./notificationService.js";
import { URGENCY_ESCALATION_MINUTES } from "../constants/system.js";

export const scheduleEscalationCheck = ({ io, requestId }) => {
  setTimeout(async () => {
    const request = await Request.findById(requestId).lean();
    if (!request || request.status === "fulfilled" || request.status === "expired") return;

    const hasAccepted = request.donorResponses?.some((r) => r.status === "accepted");
    if (hasAccepted) return;

    const alreadyNotified = new Set((request.donorResponses || []).map((r) => String(r.donorId)));
    const reserve = await User.find({
      _id: { $nin: Array.from(alreadyNotified) },
      role: "donor",
      isAvailable: true,
      isVerified: true,
      smsAlertsEnabled: true
    })
      .sort({ donationCount: -1, recentlyActiveAt: -1 })
      .limit(3);

    if (!reserve.length) return;

    for (const donor of reserve) {
      await createNotification({
        io,
        user: donor,
        message: `Escalation: ${request.urgency.toUpperCase()} request from ${request.hospitalName} still unaccepted.`,
        type: "escalation",
        critical: request.urgency === "critical",
        includeVoiceFallback: request.urgency === "critical"
      });
    }
  }, URGENCY_ESCALATION_MINUTES["critical"] * 60 * 1000);
};

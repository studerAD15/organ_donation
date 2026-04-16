import crypto from "crypto";
import AuditLog from "../models/AuditLog.js";

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const writeAuditLog = async ({ requestId, actorId = null, oldStatus, newStatus, note, eventType = "status_change", metadata = {} }) => {
  const previous = await AuditLog.findOne({ requestId }).sort({ createdAt: -1 }).lean();
  const prevHash = previous?.hash || "GENESIS";
  const payload = JSON.stringify({ requestId, actorId, oldStatus, newStatus, note, eventType, metadata, prevHash, ts: Date.now() });

  return AuditLog.create({
    requestId,
    actorId,
    oldStatus,
    newStatus,
    note,
    eventType,
    metadata,
    prevHash,
    hash: digest(payload)
  });
};

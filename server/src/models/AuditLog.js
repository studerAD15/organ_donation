import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    oldStatus: String,
    newStatus: String,
    note: String,
    eventType: { type: String, default: "status_change" },
    metadata: mongoose.Schema.Types.Mixed,
    prevHash: String,
    hash: String
  },
  { timestamps: true }
);

auditLogSchema.index({ requestId: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);

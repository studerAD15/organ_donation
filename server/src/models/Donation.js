import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    donatedAt: { type: Date, default: Date.now },
    verifiedByAdmin: { type: Boolean, default: false },
    adminVerifiedAt: Date,
    outcomeNotes: String,
    consentVersion: { type: String, default: "v1.0" }
  },
  { timestamps: true }
);

export default mongoose.model("Donation", donationSchema);

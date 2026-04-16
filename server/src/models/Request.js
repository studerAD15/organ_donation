import mongoose from "mongoose";

const donorResponseSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "no_response"], default: "pending" },
    invitedAt: { type: Date, default: Date.now },
    respondedAt: Date,
    wave: { type: Number, default: 1 }
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["blood", "organ"], required: true },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    organType: { type: String, enum: ["eyes", "kidney", "liver", "heart", null], default: null },
    units: { type: Number, min: 1, max: 20, default: 1 },
    urgency: { type: String, enum: ["critical", "urgent", "normal"], default: "normal", index: true },
    hospitalName: { type: String, required: true },
    contact: { type: String, required: true },
    location: {
      lat: Number,
      lng: Number,
      city: String,
      pincode: String
    },
    status: {
      type: String,
      enum: ["open", "matched", "fulfilled", "expired"],
      default: "open",
      index: true
    },
    matchedDonorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    expiresAt: { type: Date, required: true },
    matchedAt: Date,
    fulfilledAt: Date,
    contactRevealToken: String,
    contactRevealExpiresAt: Date,
    fraudScore: { type: Number, default: 0 },
    fraudFlags: [String],
    matchedDonors: [{ donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, score: Number, distanceKm: Number }],
    donorResponses: [donorResponseSchema],
    templateName: String,
    outcomeNotes: String
  },
  { timestamps: true }
);

requestSchema.index({ expiresAt: 1 });
requestSchema.index({ urgency: 1, status: 1, createdAt: -1 });

export default mongoose.model("Request", requestSchema);

import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    city: String,
    pincode: String
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["donor", "recipient", "admin"], default: "donor" },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
      default: null
    },
    location: locationSchema,
    organs: [{ type: String, enum: ["eyes", "kidney", "liver", "heart"] }],
    isAvailable: { type: Boolean, default: true },
    smsAlertsEnabled: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    verificationNotes: { type: String, default: "" },
    idProofUrl: String,
    idProofHash: { type: String, index: true, sparse: true },
    consentVersion: { type: String, default: "v1.0" },
    lastDonatedAt: Date,
    donationCount: { type: Number, default: 0 },
    acceptedAlerts: { type: Number, default: 0 },
    declinedAlerts: { type: Number, default: 0 },
    recentlyActiveAt: { type: Date, default: Date.now },
    hospitalName: String,
    hospitalLicenseNumber: String,
    hospitalVerificationStatus: {
      type: String,
      enum: ["pending", "validated", "rejected", "not_applicable"],
      default: "not_applicable"
    },
    refreshTokenHash: { type: String, select: false }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual("badge").get(function badgeGetter() {
  if (this.donationCount >= 10) return "Lifesaver";
  if (this.donationCount >= 5) return "5x Donor";
  if (this.donationCount >= 1) return "First Time Hero";
  return "New Donor";
});

export default mongoose.model("User", userSchema);

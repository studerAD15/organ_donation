import mongoose from "mongoose";

const requestTemplateSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["blood", "organ"], required: true },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    organType: { type: String, enum: ["eyes", "kidney", "liver", "heart", null], default: null },
    units: { type: Number, min: 1, max: 20, default: 1 },
    urgency: { type: String, enum: ["critical", "urgent", "normal"], default: "normal" },
    hospitalName: String,
    contact: String,
    city: String,
    pincode: String,
    isQuickCritical: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("RequestTemplate", requestTemplateSchema);

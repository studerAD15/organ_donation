import User from "../models/User.js";
import Request from "../models/Request.js";
import RequestTemplate from "../models/RequestTemplate.js";

const demoDonors = [
  {
    name: "Aarav Mehta",
    phone: "+919000000001",
    email: "aarav@example.com",
    role: "donor",
    bloodGroup: "O-",
    location: { city: "New Delhi", pincode: "110001", lat: 28.6328, lng: 77.2197 },
    organs: ["eyes", "kidney"],
    isAvailable: true,
    isVerified: true,
    verificationStatus: "approved",
    donationCount: 6,
    acceptedAlerts: 5,
    declinedAlerts: 1,
    recentlyActiveAt: new Date()
  },
  {
    name: "Isha Rao",
    phone: "+919000000002",
    email: "isha@example.com",
    role: "donor",
    bloodGroup: "A+",
    location: { city: "Mumbai", pincode: "400001", lat: 18.9388, lng: 72.8354 },
    organs: ["liver"],
    isAvailable: true,
    isVerified: true,
    verificationStatus: "approved",
    donationCount: 2,
    acceptedAlerts: 2,
    declinedAlerts: 3,
    recentlyActiveAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  },
  {
    name: "Rahul Sen",
    phone: "+919000000003",
    email: "rahul@example.com",
    role: "donor",
    bloodGroup: "B+",
    location: { city: "Bengaluru", pincode: "560001", lat: 12.9716, lng: 77.5946 },
    organs: ["heart", "eyes"],
    isAvailable: true,
    isVerified: true,
    verificationStatus: "approved",
    donationCount: 10,
    acceptedAlerts: 8,
    declinedAlerts: 1,
    recentlyActiveAt: new Date()
  }
];

export const bootstrapDevelopmentData = async () => {
  if (process.env.NODE_ENV === "production") return;

  const approvedDonorCount = await User.countDocuments({
    role: "donor",
    isVerified: true,
    $or: [{ verificationStatus: "approved" }, { verificationStatus: { $exists: false } }]
  });

  if (approvedDonorCount > 0) return;

  await Promise.all(
    demoDonors.map((donor) =>
      User.updateOne(
        { phone: donor.phone },
        { $set: donor },
        { upsert: true }
      )
    )
  );

  const donors = await User.find({ phone: { $in: demoDonors.map((donor) => donor.phone) } });

  let recipient = await User.findOne({ phone: "+919000000010" });
  if (!recipient) {
    recipient = await User.create({
      name: "CityCare Hospital",
      phone: "+919000000010",
      email: "citycare@example.com",
      role: "recipient",
      hospitalName: "CityCare Hospital",
      hospitalLicenseNumber: "HSP-DEL-1022",
      hospitalVerificationStatus: "validated",
      isVerified: true,
      verificationStatus: "approved",
      location: { city: "New Delhi", pincode: "110001", lat: 28.6328, lng: 77.2197 }
    });
  }

  const existingRequest = await Request.findOne({ recipientId: recipient._id });
  if (!existingRequest) {
    await Request.create({
      recipientId: recipient._id,
      type: "blood",
      bloodGroup: "A+",
      units: 2,
      urgency: "critical",
      hospitalName: "CityCare Hospital",
      contact: "+919100000001",
      location: { city: "New Delhi", pincode: "110001", lat: 28.6328, lng: 77.2197 },
      status: "open",
      contactRevealToken: "devseedtoken1",
      contactRevealExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      matchedDonors: donors.map((donor) => ({ donorId: donor._id }))
    });
  }

  const existingTemplate = await RequestTemplate.findOne({ recipientId: recipient._id, name: "Emergency A+ Blood" });
  if (!existingTemplate) {
    await RequestTemplate.create({
      recipientId: recipient._id,
      name: "Emergency A+ Blood",
      type: "blood",
      bloodGroup: "A+",
      units: 2,
      urgency: "critical",
      hospitalName: "CityCare Hospital",
      contact: "+919100000001",
      city: "New Delhi",
      pincode: "110001",
      isQuickCritical: true
    });
  }

  console.log(`[dev-bootstrap] Inserted ${donors.length} demo donors and sample hospital data.`);
};

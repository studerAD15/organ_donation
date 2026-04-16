import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDatabase from "../config/db.js";
import User from "../models/User.js";
import Request from "../models/Request.js";
import RequestTemplate from "../models/RequestTemplate.js";

dotenv.config({ path: ".env" });

const seed = async () => {
  await connectDatabase();
  await Promise.all([User.deleteMany({}), Request.deleteMany({}), RequestTemplate.deleteMany({})]);

  const donors = await User.insertMany([
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
  ]);

  const recipient = await User.create({
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

  const admin = await User.create({
    name: "Portal Admin",
    phone: "+919000000099",
    email: "admin@example.com",
    role: "admin",
    isVerified: true,
    verificationStatus: "approved",
    location: { city: "New Delhi", pincode: "110001", lat: 28.6328, lng: 77.2197 }
  });

  await Request.insertMany([
    {
      recipientId: recipient._id,
      type: "blood",
      bloodGroup: "A+",
      units: 2,
      urgency: "critical",
      hospitalName: "CityCare Hospital",
      contact: "+919100000001",
      location: { city: "New Delhi", pincode: "110001", lat: 28.6328, lng: 77.2197 },
      status: "open",
      contactRevealToken: "seedtoken1",
      contactRevealExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    },
    {
      recipientId: recipient._id,
      type: "organ",
      organType: "eyes",
      units: 1,
      urgency: "urgent",
      hospitalName: "CityCare Hospital",
      contact: "+919100000001",
      location: { city: "New Delhi", pincode: "110001", lat: 28.6328, lng: 77.2197 },
      status: "open",
      contactRevealToken: "seedtoken2",
      contactRevealExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
    }
  ]);

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

  console.log(`Seed complete. Donors: ${donors.length}, Recipient: ${recipient.phone}, Admin: ${admin.phone}`);
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});

import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { createDemoPreviewOtp, sendOtp, verifyOtp } from "../services/otpService.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { geocodePincode } from "../utils/geo.js";
import { uploadIdProof } from "../services/cloudinaryService.js";
import { validateHospitalLicense, validateHospitalRegistry } from "../utils/validators.js";
import { checkOtpAbuse } from "../services/abusePreventionService.js";

const buildTokens = async (user) => {
  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id, role: user.role });
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.refreshTokenHash = refreshTokenHash;
  user.recentlyActiveAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
};

const hashPayload = (value) => crypto.createHash("sha256").update(value).digest("hex");

const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.refreshTokenHash;
  delete safeUser.idProofHash;
  delete safeUser.password;
  return safeUser;
};

export const register = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      role,
      bloodGroup,
      city,
      pincode,
      organs,
      lastDonatedAt,
      smsAlertsEnabled,
      hospitalName,
      hospitalLicenseNumber,
      consentVersion
    } = req.body;

    const normalizedPhone = String(phone || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedCity = String(city || "").trim();
    const normalizedPincode = String(pincode || "").trim();
    const normalizedHospitalName = role === "recipient" ? String(hospitalName || "").trim() : undefined;
    const normalizedHospitalLicenseNumber = role === "recipient" ? String(hospitalLicenseNumber || "").trim() : undefined;

    const existing = await User.findOne({ phone: normalizedPhone });
    if (existing) return res.status(409).json({ message: "Phone number already registered" });

    let hospitalVerificationStatus = "not_applicable";
    let verificationNotes = "";
    if (role === "recipient" && normalizedHospitalLicenseNumber) {
      validateHospitalLicense(normalizedHospitalLicenseNumber);
      const registry = validateHospitalRegistry(normalizedHospitalLicenseNumber);
      hospitalVerificationStatus = registry.status;
      verificationNotes = registry.reason;
    }

    let idProofUrl = "";
    let idProofHash = "";
    if (req.body.idProofBase64) {
      idProofHash = hashPayload(req.body.idProofBase64);
      const duplicate = await User.findOne({ idProofHash });
      if (duplicate) {
        return res.status(409).json({ message: "This ID document is already registered with another donor" });
      }
      idProofUrl = await uploadIdProof(req.body.idProofBase64);
    }

    const location = geocodePincode(normalizedPincode, normalizedCity);

    const user = await User.create({
      name,
      phone: normalizedPhone,
      email: normalizedEmail,
      role,
      bloodGroup: role === "donor" ? bloodGroup : null,
      location: { ...location, pincode: normalizedPincode, city: normalizedCity || location.city },
      organs: role === "donor" ? organs || [] : [],
      lastDonatedAt,
      smsAlertsEnabled: smsAlertsEnabled !== false,
      idProofUrl,
      idProofHash,
      consentVersion: consentVersion || "v1.0",
      hospitalName: normalizedHospitalName,
      hospitalLicenseNumber: normalizedHospitalLicenseNumber,
      hospitalVerificationStatus,
      verificationNotes,
      isVerified: role === "recipient" ? hospitalVerificationStatus === "validated" : false,
      // FIX: pending hospitals should have status "pending", not "approved"
      verificationStatus: role === "donor" ? "pending" : hospitalVerificationStatus === "validated" ? "approved" : hospitalVerificationStatus === "rejected" ? "rejected" : "pending"
    });

    res.status(201).json({ message: "Registration successful", user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const sendLoginOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      const demoOtp = await createDemoPreviewOtp(phone);
      return res.json({
        message: "Demo OTP generated for this number",
        channel: "demo_preview",
        demoOtp
      });
    }

    const abuseCheck = checkOtpAbuse({
      phone,
      ip: req.ip,
      deviceId: req.headers["x-device-id"] || "unknown"
    });

    if (abuseCheck.blocked) {
      return res.status(429).json({ message: "Too many OTP requests. Please try again later." });
    }

    const otpResult = await sendOtp(phone);
    const demoOtp = await createDemoPreviewOtp(phone);
    const response = { message: "OTP sent successfully", channel: otpResult.channel, demoOtp };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    const isValid = await verifyOtp(phone, code);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "No account found for this number" });
    }
    const tokens = await buildTokens(user);

    res.json({ user: sanitizeUser(user), ...tokens });
  } catch (error) {
    next(error);
  }
};

export const refreshSession = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token missing" });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash) return res.status(401).json({ message: "Invalid refresh token" });

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ message: "Invalid refresh token" });

    const tokens = await buildTokens(user);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // BUG FIX: Use req.user._id from protect middleware; do not trust userId from request body
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshTokenHash: 1 } });
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
};


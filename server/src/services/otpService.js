import twilio from "twilio";
import config from "../config/env.js";
import Otp from "../models/Otp.js";

const canUseTwilioVerify = Boolean(
  config.twilio.accountSid && config.twilio.authToken && config.twilio.verifyServiceSid
);

const canUseTwilioSms = Boolean(
  config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber
);

const twilioClient = canUseTwilioVerify || canUseTwilioSms
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

/**
 * Normalise phone to E.164 for Twilio.
 * Adds +91 if user entered a 10-digit Indian number without country code.
 * Leaves numbers that already start with + untouched.
 */
const toE164 = (phone) => {
  const digits = phone.replace(/\D/g, ""); // strip non-digits
  if (phone.startsWith("+")) return phone; // already E.164
  if (digits.length === 10) return `+91${digits}`; // Indian 10-digit
  return `+${digits}`; // assume country code is included
};

/**
 * Save OTP to DB and return the code (used for both fallback and dev mode).
 */
const saveFallbackOtp = async (phone) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.findOneAndUpdate(
    { phone },
    { phone, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, // 10 min expiry
    { upsert: true, new: true }
  );
  return code;
};

export const sendOtp = async (rawPhone) => {
  const phone = toE164(rawPhone);

  if (canUseTwilioVerify) {
    try {
      await twilioClient.verify.v2
        .services(config.twilio.verifyServiceSid)
        .verifications.create({ to: phone, channel: "sms" });
      return { channel: "twilio_verify" };
    } catch (err) {
      // Twilio trial accounts can only SMS verified numbers.
      // On failure, fall through to DB-based OTP so dev/test still works.
      console.warn(`[OTP] Twilio failed (${err.message}). Falling back to DB OTP.`);
    }
  }

  // Fallback: store OTP in MongoDB, then try to deliver via SMS (Twilio Messages).
  const code = await saveFallbackOtp(phone);

  if (canUseTwilioSms) {
    try {
      await twilioClient.messages.create({
        to: phone,
        from: config.twilio.phoneNumber,
        body: `Your Organ Donation login OTP is ${code}. It expires in 10 minutes.`
      });
      return { channel: "twilio_sms" };
    } catch (err) {
      console.warn(`[OTP] Twilio SMS send failed: ${err.message}`);
    }
  }

  // Last resort: OTP exists in DB but could not be delivered by SMS provider.
  // Never return the OTP to the client.
  if (config.nodeEnv !== "production") {
    console.warn(`[OTP] OTP for ${phone}: ${code} (not delivered - configure Twilio)`);
  }
  return { channel: "fallback_db_only" };
};

export const createDemoPreviewOtp = async (rawPhone) => {
  const phone = toE164(rawPhone);
  return saveFallbackOtp(phone);
};

export const verifyOtp = async (rawPhone, code) => {
  const phone = toE164(rawPhone);

  // Always check DB first (covers both fallback and manual test codes)
  const record = await Otp.findOne({ phone, code, expiresAt: { $gt: new Date() } });
  if (record) {
    await Otp.deleteOne({ _id: record._id });
    return true;
  }

  // If Twilio is configured, also try the Twilio verify check
  if (canUseTwilioVerify) {
    try {
      const result = await twilioClient.verify.v2
        .services(config.twilio.verifyServiceSid)
        .verificationChecks.create({ to: phone, code });
      return result.status === "approved";
    } catch (err) {
      console.warn(`[OTP] Twilio verify check failed: ${err.message}`);
    }
  }

  return false;
};

import mongoose from "mongoose";
import config from "../config/env.js";

export const getDependencyHealth = async () => {
  const dbConnected = mongoose.connection.readyState === 1;

  // TWILIO_PHONE_NUMBER is only needed for outbound calls/SMS — NOT required for OTP via Twilio Verify API
  const twilioConfigured = Boolean(
    config.twilio.accountSid && config.twilio.authToken && config.twilio.verifyServiceSid
  );

  const cloudinaryConfigured = Boolean(
    config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
  );

  const smtpConfigured = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

  return {
    database: dbConnected ? "ok" : "down",
    twilio: twilioConfigured ? "ok" : "missing",
    cloudinary: cloudinaryConfigured ? "ok" : "missing",
    smtp: smtpConfigured ? "ok" : "missing"
  };
};

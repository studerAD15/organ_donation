import Notification from "../models/Notification.js";
import { sendEmail } from "./emailService.js";
import twilio from "twilio";
import config from "../config/env.js";

const canUseTwilioSms = Boolean(config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber);
const canUseTwilioVoice = Boolean(canUseTwilioSms && config.twilio.voiceWebhookUrl);
const twilioClient = canUseTwilioSms ? twilio(config.twilio.accountSid, config.twilio.authToken) : null;

export const createNotification = async ({
  io,
  user,
  message,
  type = "info",
  critical = false,
  includeVoiceFallback = false
}) => {
  const notification = await Notification.create({
    userId: user._id,
    message,
    type
  });

  if (io) {
    io.to(`user:${user._id}`).emit("notification:new", notification);
  }

  if (!critical || !user.smsAlertsEnabled) {
    return notification;
  }

  try {
    if (canUseTwilioSms) {
      await twilioClient.messages.create({
        from: config.twilio.phoneNumber,
        to: user.phone,
        body: `Critical alert: ${message}`
      });
      return notification;
    }
    throw new Error("Twilio SMS not configured");
  } catch {
    await sendEmail({
      to: user.email,
      subject: "Critical Donation Alert",
      html: `<p>${message}</p>`
    });

    if (includeVoiceFallback && canUseTwilioVoice) {
      try {
        await twilioClient.calls.create({
          to: user.phone,
          from: config.twilio.phoneNumber,
          url: config.twilio.voiceWebhookUrl
        });
      } catch {
        // Voice fallback is best-effort only.
      }
    }
  }

  return notification;
};

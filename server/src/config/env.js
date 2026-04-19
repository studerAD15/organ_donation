import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load server/.env first (if present), then fallback to repo-root .env.
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production") {
  const required = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "CLIENT_URL"];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

const config = {
  port: process.env.PORT || 5000,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: (process.env.CLIENT_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/organ_donation",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d"
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    voiceWebhookUrl: process.env.TWILIO_VOICE_WEBHOOK_URL || ""
  },
  otp: {
    demoPreviewEnabled: process.env.OTP_DEMO_PREVIEW === "true"
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
};

export default config;

import { z } from "zod";

// Allow E.164 format: optional + then 10-15 digits (handles +918360935264 = 12 digits after +)
const phoneSchema = z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number format");

export const registerSchema = z.object({
  name: z.string().min(2, "Name too short").max(60).trim(),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["donor", "recipient"], { errorMap: () => ({ message: "Role must be donor or recipient" }) }),
  city: z.string().min(2).max(60).trim(),
  pincode: z.string().regex(/^[0-9]{6}$/, "Invalid 6-digit pincode"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  organs: z.array(z.enum(["eyes", "kidney", "liver", "heart"])).optional().default([]),
  // Accept plain date strings ("2024-01-01") OR ISO datetime OR empty string
  lastDonatedAt: z.string().optional().or(z.literal("")),
  smsAlertsEnabled: z.preprocess((v) => v === true || v === "true" || v === "on", z.boolean()).default(true),
  hospitalName: z.string().trim().min(3, "Hospital name must be at least 3 characters").max(100).optional(),
  hospitalLicenseNumber: z.string().trim().min(6, "Hospital license number is too short").max(20).optional(),
  consentVersion: z.string().default("v1.0"),
  idProofBase64: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "donor" && !data.bloodGroup) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bloodGroup"],
      message: "Blood group is required for donor registration"
    });
  }

  if (data.role === "recipient") {
    if (!data.hospitalName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hospitalName"],
        message: "Hospital name is required for recipient registration"
      });
    }
    if (!data.hospitalLicenseNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hospitalLicenseNumber"],
        message: "Hospital license number is required for recipient registration"
      });
    }
  }
});

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(10),
});

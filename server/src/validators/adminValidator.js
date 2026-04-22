import { z } from "zod";

export const unlockAdminPanelSchema = z.object({
  password: z.string().min(8, "Password is required")
});

export const verifyUserSchema = z.object({
  isVerified: z.boolean(),
  notes: z.string().max(300).optional().default("")
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["donor", "recipient", "admin"])
});

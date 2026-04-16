import crypto from "crypto";

export const createContactRevealToken = () => crypto.randomBytes(20).toString("hex");

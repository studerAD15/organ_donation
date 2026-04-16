import rateLimit from "express-rate-limit";

const jsonError = (message) => (_req, res) =>
  res.status(429).json({ error: { message } });

/** Strict limiter for OTP sending (5 per 10 min per IP) */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonError("Too many OTP requests. Please wait 10 minutes.")
});

/** General auth limiter (20 per 5 min) */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonError("Too many authentication attempts. Try again later.")
});

/** Request creation limiter (30 per 5 min) */
export const requestCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonError("Too many requests submitted. Please slow down.")
});

/** Global API limiter (300 per 15 min) */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
  handler: jsonError("API rate limit exceeded.")
});

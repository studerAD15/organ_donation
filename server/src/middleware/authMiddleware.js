import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = auth.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("-refreshTokenHash -password -idProofHash");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * optionalProtect — attaches req.user if a valid Bearer token is present,
 * but does NOT block unauthenticated requests (passes through with req.user = null).
 * Used for public endpoints that benefit from knowing the caller's identity, e.g. /api/map/nearby-donors.
 */
export const optionalProtect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = auth.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("-refreshTokenHash -password -idProofHash");
    req.user = user || null;
    next();
  } catch {
    // Token invalid or expired — treat as unauthenticated (don't block)
    req.user = null;
    next();
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

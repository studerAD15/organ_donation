import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Request from "../models/Request.js";
import AuditLog from "../models/AuditLog.js";
import { findMatchingDonors } from "../services/matchingService.js";
import { writeAuditLog } from "../services/auditService.js";
import { getDependencyHealth } from "../services/healthService.js";
import { paginate, paginatedResponse } from "../utils/paginate.js";
import { signAdminPanelToken } from "../utils/jwt.js";
import config from "../config/env.js";

const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.refreshTokenHash;
  delete safeUser.password;
  delete safeUser.idProofHash;
  return safeUser;
};

const secureCompare = (value, expected) => {
  const valueBuffer = Buffer.from(String(value || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  if (valueBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
};

export const unlockAdminPanel = async (req, res) => {
  const configuredPassword = config.admin.panelPassword;
  if (!configuredPassword) {
    return res.status(503).json({ message: "Admin panel password is not configured on server" });
  }

  if (!secureCompare(req.body.password, configuredPassword)) {
    return res.status(401).json({ message: "Invalid admin password" });
  }

  const panelToken = signAdminPanelToken({
    userId: req.user._id,
    role: "admin",
    scope: "admin_panel"
  });
  const decoded = jwt.decode(panelToken);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

  return res.json({
    message: "Admin panel unlocked",
    panelToken,
    expiresAt
  });
};

export const getPendingVerifications = async (req, res, next) => {
  try {
    const users = await User.find({
      role: { $in: ["donor", "recipient"] },
      verificationStatus: "pending"
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const verifyDonor = async (req, res, next) => {
  try {
    const { isVerified, notes = "" } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ["donor", "recipient"] } },
      {
        isVerified: Boolean(isVerified),
        verificationStatus: isVerified ? "approved" : "rejected",
        verificationNotes: notes
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Verification updated", user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalRecipients,
      totalAdmins,
      verifiedUsers,
      openRequests,
      matchedRequests,
      fulfilledRequests,
      expiredRequests
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "donor" }),
      User.countDocuments({ role: "recipient" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isVerified: true }),
      Request.countDocuments({ status: "open" }),
      Request.countDocuments({ status: "matched" }),
      Request.countDocuments({ status: "fulfilled" }),
      Request.countDocuments({ status: "expired" })
    ]);

    const donorsByCity = await User.aggregate([
      { $match: { role: "donor" } },
      { $group: { _id: "$location.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const donorsByBloodType = await User.aggregate([
      { $match: { role: "donor" } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const fulfilledPerMonth = await Request.aggregate([
      { $match: { status: "fulfilled" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const matched = await Request.find({ matchedAt: { $ne: null } }, "createdAt matchedAt fulfilledAt location urgency status").lean();
    const sla = {
      avgMinutesToMatch:
        matched.length > 0
          ? Number(
              (
                matched.reduce((sum, item) => sum + (new Date(item.matchedAt) - new Date(item.createdAt)) / (1000 * 60), 0) /
                matched.length
              ).toFixed(2)
            )
          : 0,
      avgMinutesToFulfill:
        matched.filter((x) => x.fulfilledAt).length > 0
          ? Number(
              (
                matched
                  .filter((x) => x.fulfilledAt)
                  .reduce((sum, item) => sum + (new Date(item.fulfilledAt) - new Date(item.createdAt)) / (1000 * 60), 0) /
                matched.filter((x) => x.fulfilledAt).length
              ).toFixed(2)
            )
          : 0
    };

    const cityHeatmap = await Request.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: "$location.city", requests: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ["$urgency", "critical"] }, 1, 0] } } } },
      { $sort: { requests: -1 } }
    ]);

    const shortages = await Request.aggregate([
      { $match: { status: { $in: ["open", "matched"] }, type: "blood" } },
      { $group: { _id: { city: "$location.city", bloodGroup: "$bloodGroup" }, openRequests: { $sum: 1 } } },
      { $sort: { openRequests: -1 } },
      { $limit: 15 }
    ]);

    const dependencyHealth = await getDependencyHealth();

    res.json({
      totals: {
        users: totalUsers,
        donors: totalDonors,
        recipients: totalRecipients,
        admins: totalAdmins,
        activeRequests: openRequests + matchedRequests,
        fulfilledRequests
      },
      totalUsers,
      totalDonors,
      totalRecipients,
      totalAdmins,
      verifiedUsers,
      verifiedPercent: totalUsers > 0 ? Number(((verifiedUsers / totalUsers) * 100).toFixed(2)) : 0,
      openRequests,
      matchedRequests,
      fulfilledRequests,
      expiredRequests,
      donorsByCity,
      donorsByBloodType,
      fulfilledPerMonth,
      sla,
      cityHeatmap,
      shortages,
      dependencyHealth
    });
  } catch (error) {
    next(error);
  }
};

export const listPlatformUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { role, search, verificationStatus } = req.query;

    const filter = {};
    if (role && role !== "all") filter.role = role;
    if (verificationStatus && verificationStatus !== "all") filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { hospitalName: new RegExp(search, "i") }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-refreshTokenHash -password -idProofHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    return res.json(paginatedResponse({ data: users, total, page, limit }));
  } catch (error) {
    return next(error);
  }
};

export const listHospitals = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { search, verificationStatus } = req.query;

    const filter = { role: "recipient" };
    if (verificationStatus && verificationStatus !== "all") filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { hospitalName: new RegExp(search, "i") },
        { hospitalLicenseNumber: new RegExp(search, "i") },
        { "location.city": new RegExp(search, "i") }
      ];
    }

    const [hospitals, total] = await Promise.all([
      User.find(filter)
        .select("-refreshTokenHash -password -idProofHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    return res.json(paginatedResponse({ data: hospitals, total, page, limit }));
  } catch (error) {
    return next(error);
  }
};

export const listAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-refreshTokenHash -password -idProofHash")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(admins);
  } catch (error) {
    return next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (String(user._id) === String(req.user._id) && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin role" });
    }

    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last admin account" });
      }
    }

    user.role = role;
    if (role === "recipient") {
      user.bloodGroup = null;
      user.organs = [];
      user.isAvailable = false;
      user.hospitalVerificationStatus = user.hospitalVerificationStatus || "pending";
    } else if (role === "admin") {
      user.hospitalVerificationStatus = "not_applicable";
      user.isVerified = true;
      user.verificationStatus = "approved";
    } else {
      user.hospitalName = "";
      user.hospitalLicenseNumber = "";
      user.hospitalVerificationStatus = "not_applicable";
    }

    await user.save();
    return res.json({ message: "User role updated", user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const listAllRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { status, urgency, city } = req.query;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (city) filter["location.city"] = new RegExp(city, "i");

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("recipientId", "name hospitalName")
        .lean(),
      Request.countDocuments(filter)
    ]);

    res.json(paginatedResponse({ data: requests, total, page, limit }));
  } catch (error) {
    next(error);
  }
};

export const overrideMatch = async (req, res, next) => {
  try {
    const { donorId } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const donor = await User.findOne({ _id: donorId, role: "donor", isVerified: true, verificationStatus: "approved" });
    if (!donor) return res.status(404).json({ message: "Donor not found or not verified" });

    const oldStatus = request.status;
    request.matchedDonorId = donor._id;
    request.status = "matched";
    request.matchedAt = request.matchedAt || new Date();

    const existingMatches = await findMatchingDonors(request, 10);
    request.matchedDonors = existingMatches.map((item) => ({ donorId: item.donor._id, score: item.score, distanceKm: item.distanceKm }));
    await request.save();

    await writeAuditLog({
      requestId: request._id,
      actorId: req.user._id,
      oldStatus,
      newStatus: "matched",
      note: "Admin manual override",
      eventType: "admin_override",
      metadata: { donorId: String(donor._id) }
    });

    res.json({ message: "Match overridden", request });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ requestId: req.params.requestId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const createCampaignSuggestion = async (req, res, next) => {
  try {
    const shortages = await Request.aggregate([
      { $match: { status: { $in: ["open", "matched"] }, type: "blood" } },
      { $group: { _id: { city: "$location.city", bloodGroup: "$bloodGroup" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const suggestions = shortages.map((s) => ({
      title: `Donor drive for ${s._id.bloodGroup} in ${s._id.city}`,
      targetAudience: `${s._id.city} donors (${s._id.bloodGroup})`,
      reason: `${s.count} active shortages detected`
    }));

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

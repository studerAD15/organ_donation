import User from "../models/User.js";
import Request from "../models/Request.js";
import AuditLog from "../models/AuditLog.js";
import { findMatchingDonors } from "../services/matchingService.js";
import { writeAuditLog } from "../services/auditService.js";
import { getDependencyHealth } from "../services/healthService.js";
import { paginate, paginatedResponse } from "../utils/paginate.js";

export const getPendingVerifications = async (req, res, next) => {
  try {
    const users = await User.find({ role: "donor", verificationStatus: "pending" }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const verifyDonor = async (req, res, next) => {
  try {
    const { isVerified, notes = "" } = req.body;
    const donor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "donor" },
      {
        isVerified: Boolean(isVerified),
        verificationStatus: isVerified ? "approved" : "rejected",
        verificationNotes: notes
      },
      { new: true }
    );
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    res.json({ message: "Verification updated", donor });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
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

    const totals = {
      donors: await User.countDocuments({ role: "donor" }),
      recipients: await User.countDocuments({ role: "recipient" }),
      activeRequests: await Request.countDocuments({ status: { $in: ["open", "matched"] } }),
      fulfilledRequests: await Request.countDocuments({ status: "fulfilled" })
    };

    res.json({
      totals,
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

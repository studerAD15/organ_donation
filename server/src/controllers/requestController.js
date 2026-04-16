import Request from "../models/Request.js";
import User from "../models/User.js";
import Donation from "../models/Donation.js";
import RequestTemplate from "../models/RequestTemplate.js";
import { geocodePincode } from "../utils/geo.js";
import { findMatchingDonors } from "../services/matchingService.js";
import { createNotification } from "../services/notificationService.js";
import { getIo } from "../sockets/index.js";
import { writeAuditLog } from "../services/auditService.js";
import { scoreRequestFraudRisk } from "../services/fraudService.js";
import { createContactRevealToken } from "../utils/token.js";
import { enqueueTask } from "../services/queueService.js";
import { scheduleEscalationCheck } from "../services/escalationService.js";
import { clearCacheByPrefix, getCache, setCache } from "../services/cacheService.js";
import { REQUEST_BOARD_CACHE_TTL_MS } from "../constants/system.js";
import { paginate, paginatedResponse } from "../utils/paginate.js";

const statusRank = {
  open: 1,
  matched: 2,
  fulfilled: 3,
  expired: 4
};

const sanitizeRequestForPublic = (request) => ({
  ...request.toObject(),
  contact: "hidden",
  contactRevealToken: undefined,
  contactRevealExpiresAt: undefined
});

const queueCriticalAlerts = async ({ io, request, matches }) => {
  const waveSize = request.urgency === "critical" ? 3 : 5;

  let wave = 1;
  for (let i = 0; i < matches.length; i += waveSize) {
    const waveMatches = matches.slice(i, i + waveSize);

    for (const match of waveMatches) {
      await createNotification({
        io,
        user: match.donor,
        message: `${request.urgency.toUpperCase()} ${request.type} request near ${request.location.city}. Hospital: ${request.hospitalName}`,
        type: "match",
        critical: request.urgency === "critical",
        includeVoiceFallback: request.urgency === "critical"
      });
    }

    request.donorResponses.push(
      ...waveMatches.map((m) => ({ donorId: m.donor._id, status: "pending", invitedAt: new Date(), wave }))
    );
    wave += 1;
  }
};

export const createRequest = async (req, res, next) => {
  try {
    const activeCount = await Request.countDocuments({
      recipientId: req.user._id,
      status: { $in: ["open", "matched"] }
    });

    if (activeCount >= 3) {
      return res.status(429).json({ message: "Max 3 active requests allowed" });
    }

    const { type, bloodGroup, organType, units, urgency, hospitalName, contact, city, pincode, deadline, templateName } = req.body;
    const location = geocodePincode(pincode, city);

    const [createdTodayCount, previousCriticalCount, duplicateContactCount] = await Promise.all([
      Request.countDocuments({ recipientId: req.user._id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Request.countDocuments({ recipientId: req.user._id, urgency: "critical", createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Request.countDocuments({ contact, recipientId: { $ne: req.user._id }, createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } })
    ]);

    const fraud = scoreRequestFraudRisk({
      units,
      urgency,
      createdTodayCount,
      previousCriticalCount,
      duplicateContact: duplicateContactCount > 0
    });

    const request = await Request.create({
      recipientId: req.user._id,
      type,
      bloodGroup,
      organType,
      units,
      urgency,
      hospitalName,
      contact,
      location: { ...location, city: city || location.city, pincode },
      expiresAt: deadline ? new Date(deadline) : new Date(Date.now() + 6 * 60 * 60 * 1000),
      contactRevealToken: createContactRevealToken(),
      contactRevealExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      fraudScore: fraud.score,
      fraudFlags: fraud.flags,
      templateName: templateName || ""
    });

    await writeAuditLog({
      requestId: request._id,
      actorId: req.user._id,
      oldStatus: null,
      newStatus: "open",
      note: "Request created",
      eventType: "request_created",
      metadata: { fraudScore: fraud.score, fraudFlags: fraud.flags }
    });

    const io = getIo();
    const matches = await findMatchingDonors(request, 10);
    request.matchedDonors = matches.map((m) => ({ donorId: m.donor._id, score: m.score, distanceKm: m.distanceKm }));

    if (matches.length) {
      request.status = "matched";
      request.matchedDonorId = matches[0].donor._id;
      request.matchedAt = new Date();

      await writeAuditLog({
        requestId: request._id,
        actorId: req.user._id,
        oldStatus: "open",
        newStatus: "matched",
        note: "Auto matched donors",
        eventType: "auto_match",
        metadata: { topDonorId: String(matches[0].donor._id) }
      });

      enqueueTask(async () => queueCriticalAlerts({ io, request, matches }));
      scheduleEscalationCheck({ io, requestId: request._id });
    }

    await request.save();
    clearCacheByPrefix("request-board:");

    if (io) {
      io.to("role:recipient").emit("request:new", sanitizeRequestForPublic(request));
      io.to("role:admin").emit("request:new", request);
    }

    res.status(201).json({
      request: sanitizeRequestForPublic(request),
      topMatches: matches.slice(0, 10).map((item) => ({
        donorId: item.donor._id,
        name: item.donor.name,
        bloodGroup: item.donor.bloodGroup,
        city: item.donor.location.city,
        distanceKm: item.distanceKm,
        score: item.score,
        badge: item.donor.badge
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const listPublicRequests = async (req, res, next) => {
  try {
    const { city, bloodGroup, urgency } = req.query;
    const { page, limit, skip } = paginate(req.query);
    const cacheKey = `request-board:${city || "all"}:${bloodGroup || "all"}:${urgency || "all"}:p${page}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const query = { status: { $in: ["open", "matched"] } };
    if (city) query["location.city"] = new RegExp(city, "i");
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (urgency) query.urgency = urgency;

    const [requests, total] = await Promise.all([
      Request.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("recipientId", "name role").lean(),
      Request.countDocuments(query)
    ]);
    const redacted = requests.map((r) => ({ ...r, contact: "hidden", contactRevealToken: undefined }));
    const result = paginatedResponse({ data: redacted, total, page, limit });
    setCache(cacheKey, result, REQUEST_BOARD_CACHE_TTL_MS);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const listMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ recipientId: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, donorId, outcomeNotes } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (statusRank[status] < statusRank[request.status]) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    const oldStatus = request.status;
    request.status = status;
    if (donorId) request.matchedDonorId = donorId;
    if (status === "fulfilled") {
      request.fulfilledAt = new Date();
      request.outcomeNotes = outcomeNotes || request.outcomeNotes;
    }

    await request.save();

    await writeAuditLog({
      requestId: request._id,
      actorId: req.user._id,
      oldStatus,
      newStatus: status,
      note: "Manual status update",
      eventType: "manual_status"
    });

    if (status === "fulfilled" && request.matchedDonorId) {
      const donation = await Donation.create({
        donorId: request.matchedDonorId,
        requestId: request._id,
        verifiedByAdmin: req.user.role === "admin",
        adminVerifiedAt: req.user.role === "admin" ? new Date() : null,
        outcomeNotes: outcomeNotes || "",
        consentVersion: "v1.0"
      });

      await User.findByIdAndUpdate(request.matchedDonorId, {
        $inc: { donationCount: 1 },
        $set: { lastDonatedAt: donation.donatedAt, recentlyActiveAt: new Date() }
      });
    }

    clearCacheByPrefix("request-board:");
    res.json({ message: "Status updated", request });
  } catch (error) {
    next(error);
  }
};

export const runMatchForRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const matches = await findMatchingDonors(request, 10);
    request.matchedDonors = matches.map((item) => ({ donorId: item.donor._id, score: item.score, distanceKm: item.distanceKm }));

    if (matches.length) {
      request.status = "matched";
      request.matchedDonorId = matches[0].donor._id;
      request.matchedAt = new Date();
      await request.save();
    }

    res.json({
      requestId: request._id,
      matches: matches.map((item) => ({
        donorId: item.donor._id,
        name: item.donor.name,
        bloodGroup: item.donor.bloodGroup,
        city: item.donor.location.city,
        distanceKm: item.distanceKm,
        score: item.score
      }))
    });
  } catch (error) {
    next(error);
  }
};


export const listDonorAssignments = async (req, res, next) => {
  try {
    const requests = await Request.find({
      donorResponses: { $elemMatch: { donorId: req.user._id, status: "pending" } },
      status: { $in: ["open", "matched"] }
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    const redacted = requests.map((r) => ({ ...r, contact: "hidden", contactRevealToken: undefined }));
    res.json(redacted);
  } catch (error) {
    next(error);
  }
};
export const donorRespondToRequest = async (req, res, next) => {
  try {
    const { response } = req.body;
    if (!["accepted", "declined"].includes(response)) {
      return res.status(400).json({ message: "Invalid response" });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const record = request.donorResponses.find((item) => String(item.donorId) === String(req.user._id));
    if (!record) {
      return res.status(403).json({ message: "You are not invited for this request" });
    }

    // BUG FIX: Capture oldStatus BEFORE mutating request.status
    const oldStatus = request.status;

    record.status = response;
    record.respondedAt = new Date();
    await request.save();

    const counterUpdate = response === "accepted" ? { $inc: { acceptedAlerts: 1 } } : { $inc: { declinedAlerts: 1 } };
    await User.findByIdAndUpdate(req.user._id, {
      ...counterUpdate,
      $set: { recentlyActiveAt: new Date() }
    });

    if (response === "accepted") {
      request.status = "matched";
      request.matchedDonorId = req.user._id;
      request.matchedAt = request.matchedAt || new Date();
      await request.save();
    }

    await writeAuditLog({
      requestId: request._id,
      actorId: req.user._id,
      oldStatus,
      newStatus: request.status,
      note: `Donor ${response} request`,
      eventType: "donor_response",
      metadata: { donorId: String(req.user._id), response }
    });

    res.json({ message: `Response recorded: ${response}` });
  } catch (error) {
    next(error);
  }
};

export const revealRequestContact = async (req, res, next) => {
  try {
    const { token } = req.query;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const allowed =
      req.user.role === "admin" ||
      String(request.recipientId) === String(req.user._id) ||
      (String(request.matchedDonorId) === String(req.user._id) && token === request.contactRevealToken);

    if (!allowed || !token || token !== request.contactRevealToken || request.contactRevealExpiresAt < new Date()) {
      return res.status(403).json({ message: "Contact reveal not authorized" });
    }

    res.json({ contact: request.contact, hospitalName: request.hospitalName });
  } catch (error) {
    next(error);
  }
};

export const listTemplates = async (req, res, next) => {
  try {
    const templates = await RequestTemplate.find({ recipientId: req.user._id }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

export const saveTemplate = async (req, res, next) => {
  try {
    const template = await RequestTemplate.create({
      recipientId: req.user._id,
      ...req.body
    });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
};


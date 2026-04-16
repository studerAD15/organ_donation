import User from "../models/User.js";
import { haversineDistanceKm } from "../utils/geo.js";
import { DONATION_COOLDOWN_DAYS } from "../constants/system.js";

// Medically correct blood group donor compatibility for transfusion
// Key = recipient blood type, Value = compatible donor blood types
const bloodCompatibility = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
};

// BUG FIX: Organs need a much wider radius than blood (can be transported by air)
const MAX_DISTANCE_KM = {
  blood: 100,
  organ: 1500
};

const isDonorEligibleByCooldown = (request, donor) => {
  if (!donor.lastDonatedAt) return true;
  const type = request.type === "organ" ? "organ" : "blood";
  const cooldownDays = DONATION_COOLDOWN_DAYS[type];
  const elapsedMs = Date.now() - new Date(donor.lastDonatedAt).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return elapsedDays >= cooldownDays;
};

// BUG FIX: recentlyActiveAt defaults to Date.now so ALL donors got +5 boost.
// Now only awards boost if active within the last 7 days relative to today.
const responseLikelihoodScore = (donor) => {
  const accepted = donor.acceptedAlerts || 0;
  const declined = donor.declinedAlerts || 0;
  const total = accepted + declined;
  const acceptanceRate = total ? accepted / total : 0.5;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyActive =
    donor.recentlyActiveAt &&
    new Date(donor.recentlyActiveAt).getTime() > sevenDaysAgo;
  return Math.round(acceptanceRate * 15 + (recentlyActive ? 5 : 0));
};

const radiusScore = (distanceKm) => {
  if (distanceKm <= 10) return 30;
  if (distanceKm <= 50) return 20;
  if (distanceKm <= 100) return 10;
  return 5; // Still some score for wider range (organ requests)
};

// Utility to normalize a value to 0-1 range given min/max
const normalize = (val, min, max) => {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (val - min) / (max - min)));
};

export const findMatchingDonors = async (request, limit = 10) => {
  const baseQuery = {
    role: "donor",
    isAvailable: true,
    isVerified: true,
    verificationStatus: "approved"
  };

  if (request.type === "blood" && request.bloodGroup) {
    baseQuery.bloodGroup = { $in: bloodCompatibility[request.bloodGroup] || [] };
  }

  if (request.type === "organ" && request.organType) {
    baseQuery.organs = request.organType;
  }

  const maxDistanceKm = MAX_DISTANCE_KM[request.type] ?? 100;
  const donors = await User.find(baseQuery).lean();

  const urgencyWeightMap = { critical: 3, urgent: 2, normal: 1 };
  const urgencyVal = urgencyWeightMap[request.urgency] || 1;

  const scored = donors
    .map((donor) => {
      if (!isDonorEligibleByCooldown(request, donor)) return null;

      const distanceKm = haversineDistanceKm(request.location, donor.location);
      if (distanceKm > maxDistanceKm) return null;

      // Weighted scoring: proximity 40%, urgency 35%, reliability 15%, experience 10%
      const score =
        normalize(radiusScore(distanceKm), 0, 30) * 40 +
        normalize(urgencyVal, 1, 3) * 35 +
        normalize(responseLikelihoodScore(donor), 0, 20) * 15 +
        normalize(donor.donationCount || 0, 0, 20) * 10;

      return {
        donor,
        distanceKm: Number(distanceKm.toFixed(2)),
        score: Number(score.toFixed(2))
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return scored;
};

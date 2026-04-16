import User from "../models/User.js";
import { haversineDistanceKm } from "../utils/geo.js";
import { getCache, setCache } from "../services/cacheService.js";
import { MAP_CACHE_TTL_MS } from "../constants/system.js";

export const getNearbyDonors = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 50);
    const bloodGroup = req.query.bloodGroup || "";
    const city = req.query.city || "";

    const cacheKey = `map:${lat}:${lng}:${radius}:${bloodGroup || "all"}:${city || "all"}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const query = {
      role: "donor",
      isAvailable: true,
      isVerified: true,
      $or: [{ verificationStatus: "approved" }, { verificationStatus: { $exists: false } }]
    };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query["location.city"] = city;

    const donors = await User.find(query).select("name bloodGroup location donationCount verificationStatus isVerified");

    const nearby = donors
      .map((donor) => {
        const distanceKm = haversineDistanceKm({ lat, lng }, donor.location);
        return {
          donor,
          distanceKm: Number(distanceKm.toFixed(2))
        };
      })
      .filter((item) => item.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map((item) => ({
        id: item.donor._id,
        name: item.donor.name,
        bloodGroup: item.donor.bloodGroup,
        donationCount: item.donor.donationCount,
        city: item.donor.location.city,
        lat: item.donor.location.lat,
        lng: item.donor.location.lng,
        verified: item.donor.verificationStatus === "approved" || item.donor.isVerified === true,
        distanceKm: item.distanceKm
      }));

    setCache(cacheKey, nearby, MAP_CACHE_TTL_MS);
    res.json(nearby);
  } catch (error) {
    next(error);
  }
};


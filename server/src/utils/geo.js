const toRad = (value) => (value * Math.PI) / 180;

export const haversineDistanceKm = (origin, destination) => {
  const earthRadiusKm = 6371;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const PINCODE_COORDS = {
  "110001": { lat: 28.6328, lng: 77.2197, city: "New Delhi" },
  "400001": { lat: 18.9388, lng: 72.8354, city: "Mumbai" },
  "560001": { lat: 12.9716, lng: 77.5946, city: "Bengaluru" },
  "700001": { lat: 22.5726, lng: 88.3639, city: "Kolkata" },
  "600001": { lat: 13.0827, lng: 80.2707, city: "Chennai" },
  "500001": { lat: 17.385, lng: 78.4867, city: "Hyderabad" },
  "411001": { lat: 18.5204, lng: 73.8567, city: "Pune" }
};

export const geocodePincode = (pincode, city = "") => {
  if (PINCODE_COORDS[pincode]) {
    return PINCODE_COORDS[pincode];
  }
  return {
    lat: 20.5937,
    lng: 78.9629,
    city: city || "India"
  };
};

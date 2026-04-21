import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api/client";

// Leaflet CSS should be imported in main entry:
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const BLOOD_GROUP_COLORS = {
  "O-": "#dc2626",
  "O+": "#ef4444",
  "A-": "#1d4ed8",
  "A+": "#3b82f6",
  "B-": "#7c3aed",
  "B+": "#8b5cf6",
  "AB-": "#0e7490",
  "AB+": "#06b6d4",
};

const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const createDonorIcon = (L, bloodGroup, verified) => {
  const color = BLOOD_GROUP_COLORS[bloodGroup] || "#64748b";
  return L.divIcon({
    html: `
      <div style="
        background:${color}; color:white;
        border-radius:50% 50% 50% 0; transform:rotate(-45deg);
        width:36px; height:36px; display:flex; align-items:center; justify-content:center;
        border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.25);
        font-weight:700; font-size:9px; letter-spacing:-0.5px;
      ">
        <span style="transform:rotate(45deg)">${bloodGroup || "?"}</span>
      </div>
      ${verified ? `<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#16a34a;border-radius:50%;border:2px solid white;"></div>` : ""}
    `,
    className: "leaflet-donor-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
};

const MapPage = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const clusterRef = useRef(null);
  const leafletRef = useRef(null);

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ radius: 50, bloodGroup: "", city: "" });
  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [stats, setStats] = useState({ total: 0, verified: 0, byBloodGroup: {} });
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const L = await import("leaflet");
      const { MarkerClusterGroup } = await import("leaflet.markercluster");
      leafletRef.current = { L, MarkerClusterGroup };

      if (!isMounted || mapInstance.current || !mapRef.current) return;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, { zoomControl: false }).setView([userLocation.lat, userLocation.lng], 8);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '(c) <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstance.current = map;

      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          if (!isMounted) return;
          map.setView([coords.latitude, coords.longitude], 10);
          setUserLocation({ lat: coords.latitude, lng: coords.longitude });

          L.circleMarker([coords.latitude, coords.longitude], {
            radius: 12,
            fillColor: "#2563eb",
            fillOpacity: 0.3,
            color: "#2563eb",
            weight: 2
          }).addTo(map).bindPopup("Your location");
        },
        () => {}
      );
    })();

    return () => {
      isMounted = false;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  const loadDonors = useCallback(async () => {
    if (!mapInstance.current) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/map/nearby-donors", {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: filters.radius,
          bloodGroup: filters.bloodGroup || undefined,
          city: filters.city || undefined,
        },
      });
      setDonors(data);

      const byBloodGroup = data.reduce((acc, d) => {
        if (d.bloodGroup) acc[d.bloodGroup] = (acc[d.bloodGroup] || 0) + 1;
        return acc;
      }, {});
      setStats({ total: data.length, verified: data.filter((d) => d.verified).length, byBloodGroup });

      if (clusterRef.current) {
        mapInstance.current.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      const { L, MarkerClusterGroup } = leafletRef.current;
      const cluster = new MarkerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        iconCreateFunction: (c) => L.divIcon({
          html: `<div style="background:#c81e1e;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${c.getChildCount()}</div>`,
          className: "", iconSize: L.point(36, 36)
        }),
      });

      data.forEach((donor) => {
        if (!donor.lat || !donor.lng) return;
        const marker = L.marker([donor.lat, donor.lng], {
          icon: createDonorIcon(L, donor.bloodGroup, donor.verified),
        });
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:160px;padding:4px">
            <div style="font-weight:700;font-size:14px;color:#0f172a">${donor.name}</div>
            <div style="color:#64748b;font-size:12px;margin-top:2px">${donor.city || "Unknown"}</div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
              <span style="background:${BLOOD_GROUP_COLORS[donor.bloodGroup] || "#64748b"};color:white;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">${donor.bloodGroup || "N/A"}</span>
              ${donor.verified ? '<span style="color:#16a34a;font-size:11px;font-weight:600">Verified</span>' : '<span style="color:#f97316;font-size:11px">Pending</span>'}
            </div>
            ${donor.distanceKm ? `<div style="color:#94a3b8;font-size:11px;margin-top:6px">~${donor.distanceKm} km away</div>` : ""}
          </div>
        `, { maxWidth: 240 });
        cluster.addLayer(marker);
      });

      clusterRef.current = cluster;
      mapInstance.current.addLayer(cluster);
    } catch (err) {
      setError("Failed to load nearby donors. Please try again.");
      console.error("MapPage loadDonors error:", err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, filters]);

  useEffect(() => {
    if (mapInstance.current) loadDonors();
  }, [userLocation]);

  const updateFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nearby Donor Map</h1>
          <span className="text-xs text-slate-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full font-medium border border-green-200 dark:border-green-800">
            Powered by OpenStreetMap
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Radius: {filters.radius} km
            </label>
            <input
              type="range" min="10" max="200" step="10"
              value={filters.radius}
              onChange={updateFilter("radius")}
              className="w-full accent-blood"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Blood Group
            </label>
            <select
              value={filters.bloodGroup}
              onChange={updateFilter("bloodGroup")}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blood/40"
            >
              <option value="">All Groups</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              City
            </label>
            <input
              value={filters.city}
              onChange={updateFilter("city")}
              onKeyDown={(e) => e.key === "Enter" && loadDonors()}
              placeholder="e.g. Mumbai"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blood/40"
            />
          </div>

          <button
            onClick={loadDonors}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blood hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {stats.total > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <StatChip label="Found" value={stats.total} color="text-slate-900 dark:text-white" />
            <StatChip label="Verified" value={stats.verified} color="text-safe" />
            {Object.entries(stats.byBloodGroup).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([bg, count]) => (
              <StatChip key={bg} label={bg} value={count} color="text-organ" />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-600">
            Warning: {error}
          </div>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700" style={{ height: "520px" }}>
        {loading && (
          <div className="absolute inset-0 bg-white/75 dark:bg-slate-900/75 z-[500] flex items-center justify-center backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl px-6 py-4 border border-slate-100 dark:border-slate-700">
              <div className="w-5 h-5 border-2 border-blood border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Finding nearby donors...</span>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" style={{ zIndex: 0 }} />

        <div className="absolute bottom-4 left-4 z-[400] bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Blood Types</p>
          <div className="grid grid-cols-4 gap-1">
            {BLOOD_GROUPS.map((bg) => (
              <div key={bg} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: BLOOD_GROUP_COLORS[bg] }} />
                <span className="text-xs text-slate-600 dark:text-slate-400">{bg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {donors.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="text-2xl mb-3">Map</div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No donors found in this area</p>
          <p className="text-sm text-slate-400 mt-1">Try increasing the radius or changing blood group filter</p>
        </div>
      )}
    </div>
  );
};

const StatChip = ({ label, value, color }) => (
  <div className="text-center">
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
  </div>
);

export default MapPage;

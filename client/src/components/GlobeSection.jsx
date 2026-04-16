import { useEffect, useRef, useState, useCallback } from "react";

// â”€â”€ Static India-focused arc data (donor â†’ recipient cities) â”€â”€â”€â”€â”€â”€
const INDIA_ARCS = [
  { startLat: 28.6139, startLng: 77.2090, endLat: 19.0760, endLng: 72.8777, label: "Delhi â†’ Mumbai", color: "#ef4444" },
  { startLat: 12.9716, startLng: 77.5946, endLat: 22.5726, endLng: 88.3639, label: "Bangalore â†’ Kolkata", color: "#f97316" },
  { startLat: 17.3850, startLng: 78.4867, endLat: 28.6139, endLng: 77.2090, label: "Hyderabad â†’ Delhi", color: "#dc2626" },
  { startLat: 13.0827, startLng: 80.2707, endLat: 23.0225, endLng: 72.5714, label: "Chennai â†’ Ahmedabad", color: "#b91c1c" },
  { startLat: 22.5726, startLng: 88.3639, endLat: 19.0760, endLng: 72.8777, label: "Kolkata â†’ Mumbai", color: "#ef4444" },
  { startLat: 26.8467, startLng: 80.9462, endLat: 12.9716, endLng: 77.5946, label: "Lucknow â†’ Bangalore", color: "#f97316" },
  { startLat: 21.1458, startLng: 79.0882, endLat: 15.2993, endLng: 74.1240, label: "Nagpur â†’ Goa", color: "#dc2626" },
  { startLat: 25.3176, startLng: 82.9739, endLat: 18.5204, endLng: 73.8567, label: "Varanasi â†’ Pune", color: "#b91c1c" },
];

const DONOR_POINTS = [
  { lat: 28.6139, lng: 77.2090, city: "Delhi", type: "donor", color: "#ef4444" },
  { lat: 19.0760, lng: 72.8777, city: "Mumbai", type: "recipient", color: "#3b82f6" },
  { lat: 12.9716, lng: 77.5946, city: "Bangalore", type: "donor", color: "#ef4444" },
  { lat: 22.5726, lng: 88.3639, city: "Kolkata", type: "recipient", color: "#3b82f6" },
  { lat: 17.3850, lng: 78.4867, city: "Hyderabad", type: "donor", color: "#ef4444" },
  { lat: 13.0827, lng: 80.2707, city: "Chennai", type: "donor", color: "#ef4444" },
  { lat: 23.0225, lng: 72.5714, city: "Ahmedabad", type: "recipient", color: "#3b82f6" },
  { lat: 26.8467, lng: 80.9462, city: "Lucknow", type: "donor", color: "#ef4444" },
  { lat: 18.5204, lng: 73.8567, city: "Pune", type: "recipient", color: "#3b82f6" },
  { lat: 21.1458, lng: 79.0882, city: "Nagpur", type: "donor", color: "#ef4444" },
  { lat: 26.9124, lng: 75.7873, city: "Jaipur", type: "donor", color: "#ef4444" },
  { lat: 11.0168, lng: 76.9558, city: "Coimbatore", type: "donor", color: "#ef4444" },
];

const GlobeSection = () => {
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [GlobeGL, setGlobeGL] = useState(null);
  const [error, setError] = useState(false);

  // Dynamically import globe to avoid SSR/build issues
  useEffect(() => {
    import("react-globe.gl")
      .then((mod) => setGlobeGL(() => mod.default))
      .catch(() => setError(true));
  }, []);

  const handlePointHover = useCallback((point) => {
    setHoveredPoint(point || null);
  }, []);

  const getArcColor = useCallback((arc) => [arc.color, `${arc.color}00`], []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] text-slate-400 text-center">
        <div>
          <div className="text-4xl mb-3">ðŸŒ</div>
          <p className="text-sm">Globe unavailable in this environment</p>
        </div>
      </div>
    );
  }

  if (!GlobeGL) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blood border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading 3D Globe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-black/40 backdrop-blur rounded-xl p-3 border border-white/10">
        <p className="text-white text-xs font-bold uppercase tracking-wide mb-1">Live Network</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-white/70 text-xs">Donor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-white/70 text-xs">Recipient</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-px bg-gradient-to-r from-red-500 to-transparent" />
          <span className="text-white/70 text-xs">Transfer</span>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredPoint && (
        <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur rounded-xl p-3 border border-white/10 text-white text-sm min-w-[140px]">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${hoveredPoint.type === "donor" ? "bg-red-500" : "bg-blue-500"}`} />
            <span className="font-semibold">{hoveredPoint.city}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${hoveredPoint.type === "donor" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"}`}>
            {hoveredPoint.type === "donor" ? "Donor Hub" : "Recipient Hospital"}
          </span>
        </div>
      )}

      <div className="flex justify-center" style={{ height: 520 }}>
        <GlobeGL
          ref={globeRef}
          width={Math.min(typeof window !== "undefined" ? window.innerWidth - 64 : 800, 900)}
          height={520}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#ef4444"
          atmosphereAltitude={0.12}
          // Arcs (donor â†’ recipient connections)
          arcsData={INDIA_ARCS}
          arcColor={getArcColor}
          arcDashLength={0.5}
          arcDashGap={0.2}
          arcDashAnimateTime={2500}
          arcStroke={1.2}
          arcAltitude={0.25}
          // Points (cities)
          pointsData={DONOR_POINTS}
          pointColor="color"
          pointAltitude={0.01}
          pointRadius={0.5}
          pointLabel={(p) => `<div style="background:rgba(0,0,0,0.7);color:white;padding:6px 10px;border-radius:8px;font-size:12px">${p.city}<br/><span style="opacity:0.7">${p.type}</span></div>`}
          onPointHover={handlePointHover}
          // Start focused on India
          onGlobeReady={() => {
            if (globeRef.current) {
              globeRef.current.pointOfView({ lat: 22, lng: 82, altitude: 1.8 }, 1500);
            }
          }}
        />
      </div>

      {/* Bottom stat strip */}
      <div className="flex justify-center gap-8 mt-6 flex-wrap">
        {[
          { v: "8", l: "Active Transfers" },
          { v: "12", l: "Cities Connected" },
          { v: "24/7", l: "Live Monitoring" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <p className="text-2xl font-bold text-blood">{s.v}</p>
            <p className="text-xs text-slate-400">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobeSection;

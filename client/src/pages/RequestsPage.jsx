import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/client";
import UrgencyBadge from "../components/UrgencyBadge";
import { RequestStatusBadge, Pagination, EmptyState, Spinner } from "../components/ui/index";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_OPTS = ["", "critical", "urgent", "normal"];

const RequestsPage = () => {
  const [filters, setFilters] = useState({ city: "", bloodGroup: "", urgency: "" });
  const [active, setActive] = useState(filters);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (currentPage = 1, currentFilters = active) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 12, ...Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v)) };
      const { data } = await api.get("/requests", { params });
      setRequests(data?.data ?? data);
      setPagination(data?.pagination ?? {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, filters); }, []);

  const applyFilters = () => {
    setActive(filters);
    setPage(1);
    load(1, filters);
  };

  const clearFilters = () => {
    const empty = { city: "", bloodGroup: "", urgency: "" };
    setFilters(empty);
    setActive(empty);
    setPage(1);
    load(1, empty);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    load(newPage, active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = Object.values(active).some(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Header ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white border border-slate-700">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blood/10 blur-3xl" />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-display font-bold">🏥 Live Request Board</h1>
          <p className="text-slate-400 mt-1 text-sm">Real-time blood and organ requests from hospitals across India</p>
          {pagination.total > 0 && (
            <p className="text-slate-300 text-sm mt-2">
              <span className="text-blood font-bold">{pagination.total}</span> active requests
              {hasFilters && " (filtered)"}
            </p>
          )}
        </div>
      </section>

      {/* ─── Filters ─────────────────────────────────────────── */}
      <section className="section-card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">City</label>
            <input
              value={filters.city}
              onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Mumbai, Delhi..."
              className="input-base"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Blood Group</label>
            <select value={filters.bloodGroup} onChange={(e) => setFilters((p) => ({ ...p, bloodGroup: e.target.value }))} className="input-base">
              <option value="">All Groups</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Urgency</label>
            <select value={filters.urgency} onChange={(e) => setFilters((p) => ({ ...p, urgency: e.target.value }))} className="input-base">
              {URGENCY_OPTS.map((u) => <option key={u} value={u}>{u ? u.charAt(0).toUpperCase() + u.slice(1) : "All Urgencies"}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <button onClick={applyFilters} className="btn-primary w-full justify-center">
              🔍 Apply Filters
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary w-full justify-center text-xs">
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Request Cards ───────────────────────────────────── */}
      <section>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No requests found"
            description={hasFilters ? "Try different filters or clear them to see all requests." : "No active requests at the moment. Check back soon."}
          />
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {requests.map((req, i) => (
                <RequestCard key={req._id} request={req} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ─── Pagination ──────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onNext={() => handlePageChange(page + 1)}
          onPrev={() => handlePageChange(page - 1)}
        />
      )}
    </div>
  );
};

const typeEmoji = { blood: "🩸", organ: "🫀" };

const RequestCard = ({ request: req, index }) => (
  <motion.article
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ delay: index * 0.04, duration: 0.3 }}
    whileHover={{ y: -4 }}
    className={`group relative rounded-3xl bg-white dark:bg-slate-800 p-5 border shadow-sm hover:shadow-lg transition-all cursor-default ${
      req.urgency === "critical"
        ? "border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
        : req.urgency === "urgent"
        ? "border-orange-200 dark:border-orange-800"
        : "border-slate-100 dark:border-slate-700"
    }`}
  >
    {req.urgency === "critical" && (
      <div className="absolute top-4 right-4">
        <span className="flex h-2.5 w-2.5">
          <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      </div>
    )}

    <div className="flex items-start gap-3 mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
        req.type === "blood" ? "bg-red-50 dark:bg-red-900/20" : "bg-blue-50 dark:bg-blue-900/20"
      }`}>
        {typeEmoji[req.type] || "🩺"}
      </div>
      <div className="min-w-0 flex-1 pr-4">
        <h2 className="font-bold text-slate-900 dark:text-white truncate">{req.hospitalName || req.recipientId?.hospitalName || "Hospital"}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{req.location?.city}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
        req.type === "blood"
          ? "bg-red-50 dark:bg-red-900/20 text-blood border-red-200 dark:border-red-800"
          : "bg-blue-50 dark:bg-blue-900/20 text-organ border-blue-200 dark:border-blue-800"
      }`}>
        {req.type === "blood" ? `🩸 ${req.bloodGroup}` : `🫀 ${req.organType?.charAt(0).toUpperCase()}${req.organType?.slice(1)}`}
      </span>
      {req.units > 1 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
          ×{req.units} units
        </span>
      )}
    </div>

    <div className="flex items-center justify-between">
      <UrgencyBadge urgency={req.urgency} />
      <RequestStatusBadge status={req.status} />
    </div>

    {req.deadline && (
      <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2">
        ⏰ Needed by: {new Date(req.deadline).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    )}

    {/* Posted time */}
    <p className="mt-1 text-xs text-slate-300 dark:text-slate-600">
      Posted {new Date(req.createdAt).toLocaleDateString("en-IN")}
    </p>
  </motion.article>
);

export default RequestsPage;

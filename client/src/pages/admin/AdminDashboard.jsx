import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/client";
import { StatCard, DashboardSkeleton, StatusBadge, RequestStatusBadge, Pagination, EmptyState } from "../../components/ui/index";
import toast from "react-hot-toast";

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "requests", label: "Requests", icon: "📋" },
  { id: "donors", label: "Donors", icon: "🩸" },
  { id: "verifications", label: "Verifications", icon: "✅" },
];

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestPagination, setRequestPagination] = useState({});
  const [donors, setDonors] = useState([]);
  const [donorPagination, setDonorPagination] = useState({});
  const [pendingVerifs, setPendingVerifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestPage, setRequestPage] = useState(1);
  const [donorPage, setDonorPage] = useState(1);
  const [requestFilter, setRequestFilter] = useState({ status: "", urgency: "" });
  const [donorSearch, setDonorSearch] = useState("");

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get("/admin/analytics");
      setAnalytics(data);
    } catch { /* non-breaking */ }
  };

  const loadRequests = async (page = 1) => {
    const params = { page, limit: 15, ...Object.fromEntries(Object.entries(requestFilter).filter(([, v]) => v)) };
    const { data } = await api.get("/admin/requests", { params });
    const items = data?.data ?? data;
    const pagination = data?.pagination ?? {};
    setRequests(items);
    setRequestPagination(pagination);
  };

  const loadDonors = async (page = 1) => {
    const params = { page, limit: 15, ...(donorSearch ? { search: donorSearch } : {}) };
    const { data } = await api.get("/admin/users", { params });
    const items = data?.data ?? data;
    const pagination = data?.pagination ?? {};
    setDonors(items);
    setDonorPagination(pagination);
  };

  const loadVerifications = async () => {
    const { data } = await api.get("/admin/verifications/pending");
    setPendingVerifs(data?.data ?? data);
  };

  useEffect(() => {
    Promise.all([loadAnalytics(), loadRequests(), loadDonors(), loadVerifications()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRequests(requestPage); }, [requestPage, requestFilter]);
  useEffect(() => { loadDonors(donorPage); }, [donorPage, donorSearch]);

  const verifyUser = async (userId, action) => {
    await api.patch(`/admin/verify-user/${userId}`, { action });
    toast.success(`User ${action}d successfully`);
    loadVerifications();
  };

  const toggleUserStatus = async (userId, isBanned) => {
    await api.patch(`/admin/users/${userId}/status`, { isBanned: !isBanned });
    toast.success(!isBanned ? "User banned" : "User unbanned");
    loadDonors(donorPage);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white border border-slate-700 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin Control Center</p>
          <h1 className="text-2xl font-display font-bold">LifeLink Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage donors, requests, verifications and platform health</p>
        </div>
        {/* Live stats */}
        {analytics && (
          <div className="relative flex flex-wrap gap-6 mt-6 pt-6 border-t border-slate-700">
            {[
              { label: "Total Users", value: analytics.totalUsers || 0, color: "text-purple-400" },
              { label: "Open Requests", value: analytics.openRequests || 0, color: "text-blood" },
              { label: "Pending Verif.", value: pendingVerifs.length, color: "text-amber-400" },
              { label: "Fulfilled", value: analytics.fulfilledRequests || 0, color: "text-safe" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Tab Bar ───────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t.icon} {t.label}
            {t.id === "verifications" && pendingVerifs.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold">{pendingVerifs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* OVERVIEW ─────────────────────────────────────────── */}
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="👥" label="Total Users" value={analytics.totalUsers || 0} color="purple" />
                  <StatCard icon="🩸" label="Total Donors" value={analytics.totalDonors || 0} color="blood" />
                  <StatCard icon="🏥" label="Hospitals" value={analytics.totalRecipients || 0} color="organ" />
                  <StatCard icon="✅" label="Verified" value={analytics.verifiedUsers || 0} color="safe" trend={`${analytics.verifiedPercent || 0}% of all users`} trendPositive />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard icon="📋" label="Open Requests" value={analytics.openRequests || 0} color="amber" />
                  <StatCard icon="🤝" label="Matched" value={analytics.matchedRequests || 0} color="organ" />
                  <StatCard icon="🎉" label="Fulfilled" value={analytics.fulfilledRequests || 0} color="safe" />
                </div>

                {/* Recent Requests Quick View */}
                <div className="section-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-slate-900 dark:text-white">Recent Requests</h2>
                    <button onClick={() => setTab("requests")} className="text-xs text-organ hover:underline font-medium">View all →</button>
                  </div>
                  <div className="space-y-2">
                    {requests.slice(0, 5).map((r) => (
                      <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <div className="text-lg">{r.type === "blood" ? "🩸" : "🫀"}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{r.hospitalName || r.recipientId?.hospitalName}</p>
                          <p className="text-xs text-slate-400">{r.type === "blood" ? r.bloodGroup : r.organType} · {r.location?.city}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={r.urgency} />
                          <RequestStatusBadge status={r.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="section-card text-center py-12 text-slate-400">
                Could not load analytics. Check backend connectivity.
              </div>
            )}
          </motion.div>
        )}

        {/* REQUESTS ──────────────────────────────────────────── */}
        {tab === "requests" && (
          <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="section-card space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <h2 className="font-display font-bold text-slate-900 dark:text-white mr-auto">All Requests</h2>
              <select
                value={requestFilter.status}
                onChange={(e) => { setRequestFilter((p) => ({ ...p, status: e.target.value })); setRequestPage(1); }}
                className="input-base w-36"
              >
                <option value="">All Status</option>
                {["open", "matched", "fulfilled", "expired"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              <select
                value={requestFilter.urgency}
                onChange={(e) => { setRequestFilter((p) => ({ ...p, urgency: e.target.value })); setRequestPage(1); }}
                className="input-base w-36"
              >
                <option value="">All Urgency</option>
                {["critical", "urgent", "normal"].map((u) => <option key={u} value={u} className="capitalize">{u}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              {requests.length === 0 ? (
                <EmptyState icon="📭" title="No requests found" description="Try changing your filters." />
              ) : requests.map((r, i) => (
                <motion.div key={r._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="text-xl">{r.type === "blood" ? "🩸" : "🫀"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{r.hospitalName || r.recipientId?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.type === "blood" ? r.bloodGroup : r.organType} · {r.location?.city} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={r.urgency} />
                    <RequestStatusBadge status={r.status} />
                  </div>
                  {r.fraudScore > 5 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">⚠️ Fraud {r.fraudScore}</span>
                  )}
                </motion.div>
              ))}
            </div>

            {requestPagination.pages > 1 && (
              <Pagination
                page={requestPagination.page}
                pages={requestPagination.pages}
                hasNext={requestPagination.hasNext}
                hasPrev={requestPagination.hasPrev}
                onNext={() => setRequestPage((p) => p + 1)}
                onPrev={() => setRequestPage((p) => p - 1)}
              />
            )}
          </motion.div>
        )}

        {/* DONORS ─────────────────────────────────────────────── */}
        {tab === "donors" && (
          <motion.div key="donors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="section-card space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <h2 className="font-display font-bold text-slate-900 dark:text-white mr-auto">All Users</h2>
              <input
                placeholder="🔍 Search by name or phone..."
                value={donorSearch}
                onChange={(e) => { setDonorSearch(e.target.value); setDonorPage(1); }}
                className="input-base w-64"
              />
            </div>

            <div className="space-y-2">
              {donors.length === 0 ? (
                <EmptyState icon="👥" title="No users found" />
              ) : donors.map((u, i) => (
                <motion.div key={u._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blood/10 dark:bg-blood/20 flex items-center justify-center font-bold text-blood text-sm flex-shrink-0">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{u.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{u.phone} · {u.city || "—"} · {u.role}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.isVerified && <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-safe text-xs font-semibold">✓ Verified</span>}
                    {u.isBanned && <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-blood text-xs font-semibold">Banned</span>}
                    <button
                      onClick={() => toggleUserStatus(u._id, u.isBanned)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        u.isBanned
                          ? "bg-green-100 dark:bg-green-900/30 text-safe hover:bg-green-200"
                          : "bg-red-100 dark:bg-red-900/30 text-blood hover:bg-red-200"
                      }`}
                    >
                      {u.isBanned ? "Unban" : "Ban"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {donorPagination.pages > 1 && (
              <Pagination
                page={donorPagination.page}
                pages={donorPagination.pages}
                hasNext={donorPagination.hasNext}
                hasPrev={donorPagination.hasPrev}
                onNext={() => setDonorPage((p) => p + 1)}
                onPrev={() => setDonorPage((p) => p - 1)}
              />
            )}
          </motion.div>
        )}

        {/* VERIFICATIONS ──────────────────────────────────────── */}
        {tab === "verifications" && (
          <motion.div key="verif" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="section-card space-y-4">
            <h2 className="font-display font-bold text-slate-900 dark:text-white">Pending Verifications</h2>
            {pendingVerifs.length === 0 ? (
              <EmptyState icon="🎉" title="All caught up!" description="No pending verifications at the moment." />
            ) : (
              <div className="space-y-3">
                {pendingVerifs.map((u, i) => (
                  <motion.div key={u._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-sm flex-shrink-0">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.phone} · {u.role} · {u.hospitalName || u.city}</p>
                      {u.licenseUrl && (
                        <a href={u.licenseUrl} target="_blank" rel="noreferrer" className="text-xs text-organ hover:underline mt-1 block">
                          📎 View License Document
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => verifyUser(u._id, "approve")}
                        className="px-4 py-2 rounded-xl bg-safe text-white text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => verifyUser(u._id, "reject")}
                        className="px-4 py-2 rounded-xl bg-blood text-white text-xs font-bold hover:bg-red-700 transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;

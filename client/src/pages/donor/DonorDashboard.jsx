import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../../api/client";
import { useSocket } from "../../hooks/useSocket";
import { StatusBadge, StatCard, DashboardSkeleton, EmptyState } from "../../components/ui/index";
import toast from "react-hot-toast";

const DonorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const load = async () => {
    try {
      const [{ data }, notifications, feed] = await Promise.all([
        api.get("/donors/me"),
        api.get("/notifications"),
        api.get("/requests/donor-feed"),
      ]);
      setProfile(data.donor);
      setHistory(data.history);
      setAlerts(notifications.data);
      setAssignments(feed.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("notification:new", (payload) => {
      setAlerts((prev) => [payload, ...prev]);
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: t.visible ? 1 : 0, x: t.visible ? 0 : 100 }}
          className="bg-blood text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-xs"
        >
          <span className="text-xl">🔔</span>
          <div>
            <p className="font-semibold text-sm">New Match Alert</p>
            <p className="text-xs text-red-200 mt-0.5 line-clamp-1">{payload.message}</p>
          </div>
        </motion.div>
      ), { duration: 5000, position: "top-right" });
    });
    return () => socket.off("notification:new");
  }, [socket]);

  const updateAvailability = async (value) => {
    await api.patch("/donors/availability", { isAvailable: value });
    toast.success(value ? "You are now Available for donations" : "Set to Unavailable");
    load();
  };

  const updateSms = async (value) => {
    await api.patch("/donors/alerts", { smsAlertsEnabled: value });
    toast.success(value ? "SMS Alerts enabled" : "SMS Alerts disabled");
    load();
  };

  const respond = async (requestId, response) => {
    await api.post(`/requests/${requestId}/respond`, { response });
    toast.success(response === "accepted" ? "✅ You accepted the request!" : "Response recorded");
    load();
  };

  if (loading) return <DashboardSkeleton />;

  const acceptanceRate = profile
    ? (profile.acceptedAlerts + profile.declinedAlerts) > 0
      ? Math.round((profile.acceptedAlerts / (profile.acceptedAlerts + profile.declinedAlerts)) * 100)
      : 0
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ─── Profile Header ──────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blood via-red-800 to-red-900 p-6 sm:p-8 text-white shadow-xl shadow-blood/30"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold border border-white/30">
              {profile?.name?.charAt(0)?.toUpperCase() || "D"}
            </div>
            <div>
              <p className="text-red-200 text-xs font-semibold uppercase tracking-widest mb-1">Donor Dashboard</p>
              <h1 className="text-2xl font-display font-bold">{profile?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold border border-white/30">
                  {profile?.badge || "New Donor"}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${profile?.isAvailable ? "bg-green-500/30 border border-green-400/40" : "bg-slate-500/30 border border-slate-400/40"}`}>
                  {profile?.isAvailable ? "🟢 Available" : "🔴 Unavailable"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick toggles */}
          <div className="flex flex-wrap gap-3">
            <ToggleButton
              active={profile?.isAvailable}
              onToggle={() => updateAvailability(!profile?.isAvailable)}
              activeLabel="Set Unavailable"
              inactiveLabel="Set Available"
              activeClass="bg-white/20 hover:bg-white/30 border-white/30"
            />
            <ToggleButton
              active={profile?.smsAlertsEnabled}
              onToggle={() => updateSms(!profile?.smsAlertsEnabled)}
              activeLabel="SMS: ON"
              inactiveLabel="SMS: OFF"
              activeClass="bg-green-500/30 hover:bg-green-500/40 border-green-400/40"
            />
          </div>
        </div>
      </motion.section>

      {/* ─── Stats Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="💉" label="Total Donations" value={profile?.donationCount || 0} color="blood" />
        <StatCard icon="✅" label="Accepted Alerts" value={profile?.acceptedAlerts || 0} color="safe" />
        <StatCard icon="📊" label="Acceptance Rate" value={`${acceptanceRate}%`} color="organ" />
        <StatCard icon="⚡" label="Active Requests" value={assignments.length} color="amber" />
      </div>

      {/* ─── Main Grid ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Match Alerts */}
        <section className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              🚨 Match Alerts
              {assignments.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blood text-white text-xs">{assignments.length}</span>
              )}
            </h2>
            {assignments.length > 0 && (
              <span className="text-xs text-slate-400">Respond quickly — these expire</span>
            )}
          </div>

          <AnimatePresence>
            {assignments.length === 0 ? (
              <EmptyState icon="🎉" title="No pending requests" description="You'll be notified instantly when a match is found." />
            ) : (
              <div className="space-y-3">
                {assignments.map((request, i) => (
                  <motion.article
                    key={request._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative rounded-2xl border p-4 transition-all hover:shadow-md ${
                      request.urgency === "critical"
                        ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                        : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {request.urgency === "critical" && (
                      <div className="absolute top-3 right-3">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{request.hospitalName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {request.type === "blood" ? `🩸 ${request.bloodGroup}` : `🫀 ${request.organType}`}
                          {" · "}{request.location?.city}
                        </p>
                      </div>
                      <StatusBadge status={request.urgency} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => respond(request._id, "accepted")}
                        className="flex-1 py-2 rounded-xl bg-safe hover:bg-green-700 text-white font-semibold text-sm transition-colors"
                      >
                        ✓ Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => respond(request._id, "declined")}
                        className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
                      >
                        ✕ Decline
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Donation History */}
        <section className="section-card">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">🏆 Donation History</h2>
          {history.length === 0 ? (
            <EmptyState icon="💉" title="No donations yet" description="Complete your first donation to see it here." />
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => (
                <motion.article
                  key={entry._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700"
                >
                  <div className="w-11 h-11 rounded-xl bg-blood/10 dark:bg-blood/20 flex items-center justify-center text-lg flex-shrink-0">
                    💉
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {entry.requestId?.hospitalName || "Hospital"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(entry.donatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-safe font-semibold">
                    Completed
                  </span>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Notifications ───────────────────────────────────── */}
      {alerts.length > 0 && (
        <section className="section-card">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">🔔 Recent Notifications</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {alerts.slice(0, 15).map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
              >
                <span className="text-base mt-0.5">{item.critical ? "🚨" : "🔔"}</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};

const ToggleButton = ({ active, onToggle, activeLabel, inactiveLabel, activeClass }) => (
  <button
    onClick={onToggle}
    className={`px-4 py-2 rounded-xl border text-white text-sm font-semibold backdrop-blur transition-all hover:scale-105 ${active ? activeClass : "bg-white/10 hover:bg-white/20 border-white/20"}`}
  >
    {active ? activeLabel : inactiveLabel}
  </button>
);

export default DonorDashboard;

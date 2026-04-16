import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/client";
import { StatusBadge, StatCard, RequestStatusBadge, DashboardSkeleton, EmptyState, Spinner } from "../../components/ui/index";
import toast from "react-hot-toast";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ORGAN_TYPES = ["eyes", "kidney", "liver", "heart"];

const emptyForm = {
  type: "blood",
  bloodGroup: "A+",
  organType: "eyes",
  units: 1,
  urgency: "critical",
  hospitalName: "",
  contact: "",
  city: "",
  pincode: "",
  deadline: "",
};

const RecipientDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [revealingId, setRevealingId] = useState(null);

  const load = async () => {
    try {
      const [myReq, myTemplates] = await Promise.all([
        api.get("/requests/mine"),
        api.get("/requests/templates/mine"),
      ]);
      setRequests(myReq.data?.data || myReq.data || []);
      setTemplates(myTemplates.data?.data || myTemplates.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/requests", form);
      setMatches(data.topMatches || []);
      toast.success("Request posted! Matching donors...");
      setActiveTab("matches");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const saveTemplate = async () => {
    const name = window.prompt("Name this template:");
    if (!name?.trim()) return;
    await api.post("/requests/templates", { ...form, name });
    toast.success("Template saved!");
    load();
  };

  const applyTemplate = (t) => {
    if (!t) return;
    setForm({ ...emptyForm, ...t });
    toast("Template applied", { icon: "📋" });
  };

  const revealContact = async (request) => {
    if (!request.contactRevealToken) return;
    setRevealingId(request._id);
    try {
      const { data } = await api.get(`/requests/${request._id}/contact`, {
        params: { token: request.contactRevealToken },
      });
      setContactInfo((prev) => ({ ...prev, [request._id]: data.contact }));
      toast.success("Contact revealed!");
    } catch {
      toast.error("Could not reveal contact");
    } finally {
      setRevealingId(null);
    }
  };

  const field = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  if (loading) return <DashboardSkeleton />;

  const openCount = requests.filter((r) => r.status === "open").length;
  const matchedCount = requests.filter((r) => r.status === "matched").length;
  const fulfilledCount = requests.filter((r) => r.status === "fulfilled").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-organ via-blue-700 to-blue-900 p-6 sm:p-8 text-white shadow-xl shadow-organ/30"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Hospital Dashboard</p>
          <h1 className="text-2xl font-display font-bold">Request Blood & Organs</h1>
          <p className="text-blue-200 text-sm mt-1">Post a request and our AI instantly finds matching donors</p>
        </div>
      </motion.section>

      {/* ─── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Total Requests" value={requests.length} color="organ" />
        <StatCard icon="🔴" label="Open" value={openCount} color="blood" />
        <StatCard icon="🤝" label="Matched" value={matchedCount} color="safe" />
        <StatCard icon="✅" label="Fulfilled" value={fulfilledCount} color="purple" />
      </div>

      {/* ─── Main 2-column ───────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* LEFT: Request Form */}
        <section className="section-card lg:col-span-2">
          {/* Template controls */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => { setForm((p) => ({ ...p, urgency: "critical" })); toast("Set to Critical", { icon: "🚨" }); }}
              className="px-3 py-1.5 rounded-xl bg-blood/10 border border-blood/20 text-blood text-xs font-bold hover:bg-blood/20 transition-colors"
            >
              🚨 Quick Critical
            </button>
            <button onClick={saveTemplate} className="px-3 py-1.5 rounded-xl bg-organ/10 border border-organ/20 text-organ text-xs font-bold hover:bg-organ/20 transition-colors">
              💾 Save Template
            </button>
            {templates.length > 0 && (
              <select
                className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-organ/40"
                defaultValue=""
                onChange={(e) => applyTemplate(templates.find((t) => t._id === e.target.value))}
              >
                <option value="" disabled>📋 Apply Template</option>
                {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            )}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              📝 New Request
            </h2>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
              {["blood", "organ"].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors capitalize ${
                    form.type === t
                      ? "bg-blood text-white"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {t === "blood" ? "🩸 Blood" : "🫀 Organ"}
                </button>
              ))}
            </div>

            {form.type === "blood" ? (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Blood Group</label>
                <select value={form.bloodGroup} onChange={field("bloodGroup")} className="input-base">
                  {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Organ Type</label>
                <select value={form.organType} onChange={field("organType")} className="input-base capitalize">
                  {ORGAN_TYPES.map((o) => <option key={o} className="capitalize">{o}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Units</label>
                <input type="number" min="1" max="20" value={form.units} onChange={field("units")} className="input-base" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Urgency</label>
                <select value={form.urgency} onChange={field("urgency")} className="input-base">
                  <option value="critical">🔴 Critical</option>
                  <option value="urgent">🟠 Urgent</option>
                  <option value="normal">🟢 Normal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Hospital Name</label>
              <input placeholder="e.g. AIIMS Delhi" value={form.hospitalName} onChange={field("hospitalName")} className="input-base" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Contact Number</label>
              <input placeholder="+91 XXXXX XXXXX" value={form.contact} onChange={field("contact")} className="input-base" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">City</label>
                <input placeholder="Mumbai" value={form.city} onChange={field("city")} className="input-base" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Pincode</label>
                <input placeholder="400001" value={form.pincode} onChange={field("pincode")} className="input-base" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Deadline (optional)</label>
              <input type="datetime-local" value={form.deadline} onChange={field("deadline")} className="input-base" />
            </div>

            <motion.button
              type="submit" disabled={submitting}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-blood hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-blood/20 hover:shadow-blood/30 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? <><Spinner size="sm" color="white" /> Finding Matches...</> : "🚀 Post Request & Find Matches"}
            </motion.button>
          </form>
        </section>

        {/* RIGHT: Tabs (Matches + My Requests) */}
        <section className="lg:col-span-3 space-y-4">
          {/* Tab bar */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {[
              { id: "matches", label: "🎯 Top Matches", count: matches.length },
              { id: "requests", label: "📋 My Requests", count: requests.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? "bg-blood text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="section-card min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === "matches" ? (
                <motion.div key="matches" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {matches.length === 0 ? (
                    <EmptyState icon="🎯" title="No matches yet" description="Submit a request to see AI-ranked matching donors here in real-time." />
                  ) : (
                    <div className="space-y-3">
                      {matches.map((m, i) => (
                        <motion.div
                          key={m.donorId || i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 hover:border-safe/40 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blood/10 dark:bg-blood/20 flex items-center justify-center font-bold text-blood">
                            #{i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white">{m.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {m.bloodGroup && `🩸 ${m.bloodGroup} · `}{m.city} · ~{m.distanceKm} km
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-safe">Score {m.score}</div>
                            <div className="mt-1 w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                              <div className="h-full bg-safe rounded-full" style={{ width: `${Math.min(100, m.score)}%` }} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="requests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {requests.length === 0 ? (
                    <EmptyState icon="📭" title="No requests yet" description="Post your first request to start finding donors." />
                  ) : (
                    <div className="space-y-3">
                      {requests.map((r, i) => (
                        <motion.article
                          key={r._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <p className="font-bold text-slate-900 dark:text-white">{r.hospitalName}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {r.type === "blood" ? `🩸 ${r.bloodGroup}` : `🫀 ${r.organType}`}
                                {" · "}{r.location?.city}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <StatusBadge status={r.urgency} />
                              <RequestStatusBadge status={r.status} />
                            </div>
                          </div>
                          {r.fraudScore > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">⚠️ Fraud score: {r.fraudScore}</p>
                          )}
                          {r.status === "matched" && (
                            <div className="mt-3">
                              {contactInfo[r._id] ? (
                                <div className="flex items-center gap-2 p-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                  <span className="text-safe text-sm">📞</span>
                                  <span className="text-safe font-semibold text-sm">{contactInfo[r._id]}</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => revealContact(r)}
                                  disabled={revealingId === r._id}
                                  className="w-full py-2 rounded-xl bg-safe/10 border border-safe/20 text-safe text-sm font-semibold hover:bg-safe/20 transition-colors flex items-center justify-center gap-2"
                                >
                                  {revealingId === r._id ? <Spinner size="sm" color="safe" /> : "🔓 Reveal Donor Contact"}
                                </button>
                              )}
                            </div>
                          )}
                        </motion.article>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default RecipientDashboard;

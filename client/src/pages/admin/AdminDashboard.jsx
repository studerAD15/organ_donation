import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import toast from "react-hot-toast";
import api from "../../api/client";
import { DashboardSkeleton, EmptyState, Pagination, RequestStatusBadge, Spinner, StatCard } from "../../components/ui/index";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const TABS = ["overview", "donors", "hospitals", "roles", "verifications", "requests"];

const chartTextColor = "#94a3b8";
const chartGridColor = "rgba(148,163,184,0.2)";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: chartTextColor, boxWidth: 12, boxHeight: 12 } }
  },
  scales: {
    x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
    y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } }
  }
};

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [panelToken, setPanelToken] = useState(() => sessionStorage.getItem("adminPanelToken") || "");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [campaignSuggestions, setCampaignSuggestions] = useState([]);
  const [donorSearch, setDonorSearch] = useState("");
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [donorPage, setDonorPage] = useState(1);
  const [hospitalPage, setHospitalPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [donorPagination, setDonorPagination] = useState({});
  const [hospitalPagination, setHospitalPagination] = useState({});
  const [userPagination, setUserPagination] = useState({});
  const [requestPagination, setRequestPagination] = useState({});

  const adminHeaders = useMemo(
    () => ({
      headers: {
        "x-admin-panel-token": panelToken
      }
    }),
    [panelToken]
  );

  const roleDistributionData = useMemo(() => {
    if (!analytics) return null;
    return {
      labels: ["Donors", "Hospitals", "Admins"],
      datasets: [
        {
          data: [analytics.totalDonors || 0, analytics.totalRecipients || 0, analytics.totalAdmins || 0],
          backgroundColor: ["#ef4444", "#2563eb", "#16a34a"],
          borderWidth: 0
        }
      ]
    };
  }, [analytics]);

  const requestLifecycleData = useMemo(() => {
    if (!analytics) return null;
    return {
      labels: ["Open", "Matched", "Fulfilled", "Expired"],
      datasets: [
        {
          label: "Requests",
          data: [
            analytics.openRequests || 0,
            analytics.matchedRequests || 0,
            analytics.fulfilledRequests || 0,
            analytics.expiredRequests || 0
          ],
          backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e", "#64748b"]
        }
      ]
    };
  }, [analytics]);

  const donorsByCityData = useMemo(() => {
    const cities = analytics?.donorsByCity || [];
    return {
      labels: cities.slice(0, 10).map((item) => item._id || "Unknown"),
      datasets: [
        {
          label: "Donors",
          data: cities.slice(0, 10).map((item) => item.count),
          backgroundColor: "#60a5fa"
        }
      ]
    };
  }, [analytics]);

  const donorsByBloodTypeData = useMemo(() => {
    const bloodGroups = analytics?.donorsByBloodType || [];
    return {
      labels: bloodGroups.map((item) => item._id || "N/A"),
      datasets: [
        {
          label: "Donors",
          data: bloodGroups.map((item) => item.count),
          backgroundColor: "#f97316"
        }
      ]
    };
  }, [analytics]);

  const fulfilledTrendData = useMemo(() => {
    const trend = analytics?.fulfilledPerMonth || [];
    return {
      labels: trend.map((item) => item._id),
      datasets: [
        {
          label: "Fulfilled Requests",
          data: trend.map((item) => item.count),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.2)",
          fill: true,
          tension: 0.35
        }
      ]
    };
  }, [analytics]);

  const cityDemandData = useMemo(() => {
    const heatmap = analytics?.cityHeatmap || [];
    return {
      labels: heatmap.slice(0, 10).map((item) => item._id || "Unknown"),
      datasets: [
        {
          label: "Requests",
          data: heatmap.slice(0, 10).map((item) => item.requests),
          backgroundColor: "#a855f7"
        },
        {
          label: "Critical",
          data: heatmap.slice(0, 10).map((item) => item.critical),
          backgroundColor: "#ef4444"
        }
      ]
    };
  }, [analytics]);

  const shortageData = useMemo(() => {
    const shortages = analytics?.shortages || [];
    return {
      labels: shortages.map((item) => `${item._id?.city || "Unknown"}-${item._id?.bloodGroup || "N/A"}`),
      datasets: [
        {
          label: "Open Shortages",
          data: shortages.map((item) => item.openRequests),
          backgroundColor: "#f43f5e"
        }
      ]
    };
  }, [analytics]);

  const clearPanelSession = () => {
    sessionStorage.removeItem("adminPanelToken");
    setPanelToken("");
    setAnalytics(null);
    setDonors([]);
    setHospitals([]);
    setUsers([]);
    setPendingVerifications([]);
    setRequests([]);
    setCampaignSuggestions([]);
  };

  const unlockAdminPanel = async (event) => {
    event.preventDefault();
    if (!unlockPassword.trim()) {
      toast.error("Enter admin panel password");
      return;
    }

    setUnlocking(true);
    try {
      const { data } = await api.post("/admin/access/unlock", { password: unlockPassword.trim() });
      sessionStorage.setItem("adminPanelToken", data.panelToken);
      setPanelToken(data.panelToken);
      setUnlockPassword("");
      toast.success("Admin panel unlocked");
    } catch (error) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || "Invalid admin panel password";
      toast.error(message);
    } finally {
      setUnlocking(false);
    }
  };

  const loadAnalytics = async () => {
    const { data } = await api.get("/admin/analytics", adminHeaders);
    setAnalytics(data);
  };

  const loadDonors = async (page = donorPage) => {
    const { data } = await api.get("/admin/users", {
      ...adminHeaders,
      params: { role: "donor", page, limit: 10, ...(donorSearch ? { search: donorSearch } : {}) }
    });
    setDonors(data?.data || []);
    setDonorPagination(data?.pagination || {});
  };

  const loadHospitals = async (page = hospitalPage) => {
    const { data } = await api.get("/admin/hospitals", {
      ...adminHeaders,
      params: { page, limit: 10, ...(hospitalSearch ? { search: hospitalSearch } : {}) }
    });
    setHospitals(data?.data || []);
    setHospitalPagination(data?.pagination || {});
  };

  const loadUsers = async (page = userPage) => {
    const { data } = await api.get("/admin/users", {
      ...adminHeaders,
      params: { role: "all", page, limit: 10, ...(userSearch ? { search: userSearch } : {}) }
    });
    setUsers(data?.data || []);
    setUserPagination(data?.pagination || {});
  };

  const loadPendingVerifications = async () => {
    const { data } = await api.get("/admin/verifications", adminHeaders);
    setPendingVerifications(data || []);
  };

  const loadRequests = async (page = requestPage) => {
    const { data } = await api.get("/admin/requests", {
      ...adminHeaders,
      params: { page, limit: 10 }
    });
    setRequests(data?.data || []);
    setRequestPagination(data?.pagination || {});
  };

  const loadCampaignSuggestions = async () => {
    const { data } = await api.get("/admin/campaign-suggestions", adminHeaders);
    setCampaignSuggestions(data?.suggestions || []);
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAnalytics(),
        loadDonors(1),
        loadHospitals(1),
        loadUsers(1),
        loadPendingVerifications(),
        loadRequests(1),
        loadCampaignSuggestions()
      ]);
      setDonorPage(1);
      setHospitalPage(1);
      setUserPage(1);
      setRequestPage(1);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        clearPanelSession();
        toast.error("Admin panel session expired. Unlock again.");
      } else {
        toast.error("Failed to load admin data");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role }, adminHeaders);
      toast.success("Role updated");
      await Promise.all([loadUsers(userPage), loadAnalytics(), loadDonors(donorPage), loadHospitals(hospitalPage)]);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || "Failed to update role");
    }
  };

  const reviewVerification = async (userId, isVerified) => {
    try {
      await api.patch(`/admin/verifications/${userId}`, { isVerified, notes: "" }, adminHeaders);
      toast.success(isVerified ? "User approved" : "User rejected");
      await Promise.all([loadPendingVerifications(), loadAnalytics(), loadDonors(donorPage), loadHospitals(hospitalPage)]);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || "Failed to update verification");
    }
  };

  useEffect(() => {
    if (panelToken) {
      loadDashboard();
    }
  }, [panelToken]);

  useEffect(() => {
    if (panelToken) loadDonors(donorPage);
  }, [donorPage, donorSearch]);

  useEffect(() => {
    if (panelToken) loadHospitals(hospitalPage);
  }, [hospitalPage, hospitalSearch]);

  useEffect(() => {
    if (panelToken) loadUsers(userPage);
  }, [userPage, userSearch]);

  useEffect(() => {
    if (panelToken) loadRequests(requestPage);
  }, [requestPage]);

  if (!panelToken) {
    return (
      <div className="max-w-xl mx-auto section-card">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Access</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Enter the unique admin panel password to access donor and hospital data.
        </p>
        <form onSubmit={unlockAdminPanel} className="mt-5 space-y-3">
          <input
            type="password"
            value={unlockPassword}
            onChange={(event) => setUnlockPassword(event.target.value)}
            placeholder="Admin panel password"
            className="input-base"
            autoComplete="current-password"
          />
          <button type="submit" disabled={unlocking} className="btn-primary w-full flex items-center justify-center gap-2">
            {unlocking ? <Spinner size="sm" color="white" /> : null}
            {unlocking ? "Unlocking..." : "Unlock Admin Panel"}
          </button>
        </form>
      </div>
    );
  }

  if (loading || !analytics) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="section-card flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live operations, trends, shortages, campaign planning, and role control
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadDashboard} className="btn-organ">Refresh Data</button>
          <button onClick={clearPanelSession} className="btn-secondary">Lock Panel</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Users" value={analytics.totalUsers || 0} icon="U" color="purple" />
        <StatCard label="Donors" value={analytics.totalDonors || 0} icon="D" color="blood" />
        <StatCard label="Hospitals" value={analytics.totalRecipients || 0} icon="H" color="organ" />
        <StatCard label="Admins" value={analytics.totalAdmins || 0} icon="A" color="safe" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open Requests" value={analytics.openRequests || 0} icon="O" color="amber" />
        <StatCard label="Matched" value={analytics.matchedRequests || 0} icon="M" color="organ" />
        <StatCard label="Fulfilled" value={analytics.fulfilledRequests || 0} icon="F" color="safe" />
        <StatCard label="Pending Verif." value={pendingVerifications.length} icon="P" color="purple" />
      </div>

      <div className="section-card grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40">
          <p className="text-sm text-slate-500">Verified Users</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {analytics.verifiedUsers || 0} ({analytics.verifiedPercent || 0}%)
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40">
          <p className="text-sm text-slate-500">Avg Minutes To Match</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{analytics.sla?.avgMinutesToMatch || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40">
          <p className="text-sm text-slate-500">Avg Minutes To Fulfill</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{analytics.sla?.avgMinutesToFulfill || 0}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              tab === item ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="section-card h-72">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Role Distribution</h3>
              <div className="h-56">{roleDistributionData && <Doughnut data={roleDistributionData} options={{ ...chartOptions, scales: undefined }} />}</div>
            </div>
            <div className="section-card h-72">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Request Lifecycle</h3>
              <div className="h-56">{requestLifecycleData && <Bar data={requestLifecycleData} options={chartOptions} />}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="section-card h-80">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Donors by City</h3>
              <div className="h-64"><Bar data={donorsByCityData} options={chartOptions} /></div>
            </div>
            <div className="section-card h-80">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Donors by Blood Group</h3>
              <div className="h-64"><Bar data={donorsByBloodTypeData} options={chartOptions} /></div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="section-card h-80">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Fulfillment Trend by Month</h3>
              <div className="h-64"><Line data={fulfilledTrendData} options={chartOptions} /></div>
            </div>
            <div className="section-card h-80">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">City Demand Heatmap</h3>
              <div className="h-64"><Bar data={cityDemandData} options={chartOptions} /></div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="section-card h-80">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Top Shortage Clusters</h3>
              <div className="h-64"><Bar data={shortageData} options={chartOptions} /></div>
            </div>
            <div className="section-card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Campaign Suggestions</h3>
              {campaignSuggestions.length === 0 ? (
                <EmptyState title="No campaign suggestions right now" />
              ) : (
                <div className="space-y-2">
                  {campaignSuggestions.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.targetAudience}</p>
                      <p className="text-xs text-rose-500 mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="section-card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">System Health</h3>
            <div className="grid gap-3 md:grid-cols-4">
              {Object.entries(analytics.dependencyHealth || {}).map(([name, status]) => (
                <div key={name} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{name}</p>
                  <p className={`font-semibold mt-1 ${status === "up" ? "text-green-500" : "text-red-500"}`}>{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "donors" && (
        <div className="section-card space-y-4">
          <div className="flex gap-3 items-center">
            <h2 className="font-semibold text-slate-900 dark:text-white mr-auto">Registered Donors</h2>
            <input
              value={donorSearch}
              onChange={(event) => {
                setDonorSearch(event.target.value);
                setDonorPage(1);
              }}
              className="input-base w-72"
              placeholder="Search donors"
            />
          </div>
          {donors.length === 0 ? <EmptyState title="No donors found" /> : (
            <div className="space-y-2">
              {donors.map((donor) => (
                <div key={donor._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{donor.name}</p>
                    <p className="text-xs text-slate-500">
                      {donor.phone} | {donor.bloodGroup || "N/A"} | {donor.location?.city || "N/A"} | {donor.verificationStatus}
                    </p>
                  </div>
                  <select className="input-base w-36" value={donor.role} onChange={(event) => updateRole(donor._id, event.target.value)}>
                    <option value="donor">donor</option>
                    <option value="recipient">recipient</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          {donorPagination.pages > 1 && (
            <Pagination
              page={donorPagination.page}
              pages={donorPagination.pages}
              hasNext={donorPagination.hasNext}
              hasPrev={donorPagination.hasPrev}
              onNext={() => setDonorPage((previous) => previous + 1)}
              onPrev={() => setDonorPage((previous) => previous - 1)}
            />
          )}
        </div>
      )}

      {tab === "hospitals" && (
        <div className="section-card space-y-4">
          <div className="flex gap-3 items-center">
            <h2 className="font-semibold text-slate-900 dark:text-white mr-auto">Registered Hospitals</h2>
            <input
              value={hospitalSearch}
              onChange={(event) => {
                setHospitalSearch(event.target.value);
                setHospitalPage(1);
              }}
              className="input-base w-72"
              placeholder="Search hospitals"
            />
          </div>
          {hospitals.length === 0 ? <EmptyState title="No hospitals found" /> : (
            <div className="space-y-2">
              {hospitals.map((hospital) => (
                <div key={hospital._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{hospital.hospitalName || hospital.name}</p>
                    <p className="text-xs text-slate-500">
                      {hospital.phone} | {hospital.location?.city || "N/A"} | License: {hospital.hospitalLicenseNumber || "N/A"}
                    </p>
                  </div>
                  <select className="input-base w-36" value={hospital.role} onChange={(event) => updateRole(hospital._id, event.target.value)}>
                    <option value="donor">donor</option>
                    <option value="recipient">recipient</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          {hospitalPagination.pages > 1 && (
            <Pagination
              page={hospitalPagination.page}
              pages={hospitalPagination.pages}
              hasNext={hospitalPagination.hasNext}
              hasPrev={hospitalPagination.hasPrev}
              onNext={() => setHospitalPage((previous) => previous + 1)}
              onPrev={() => setHospitalPage((previous) => previous - 1)}
            />
          )}
        </div>
      )}

      {tab === "roles" && (
        <div className="section-card space-y-4">
          <div className="flex gap-3 items-center">
            <h2 className="font-semibold text-slate-900 dark:text-white mr-auto">Admin Role Management</h2>
            <input
              value={userSearch}
              onChange={(event) => {
                setUserSearch(event.target.value);
                setUserPage(1);
              }}
              className="input-base w-72"
              placeholder="Search users"
            />
          </div>
          {users.length === 0 ? <EmptyState title="No users found" /> : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {user.phone} | {user.email || "no-email"} | current role: {user.role}
                    </p>
                  </div>
                  <select className="input-base w-36" value={user.role} onChange={(event) => updateRole(user._id, event.target.value)}>
                    <option value="donor">donor</option>
                    <option value="recipient">recipient</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          {userPagination.pages > 1 && (
            <Pagination
              page={userPagination.page}
              pages={userPagination.pages}
              hasNext={userPagination.hasNext}
              hasPrev={userPagination.hasPrev}
              onNext={() => setUserPage((previous) => previous + 1)}
              onPrev={() => setUserPage((previous) => previous - 1)}
            />
          )}
        </div>
      )}

      {tab === "verifications" && (
        <div className="section-card space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Pending Verifications</h2>
          {pendingVerifications.length === 0 ? <EmptyState title="No pending verifications" /> : (
            <div className="space-y-2">
              {pendingVerifications.map((user) => (
                <div key={user._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {user.phone} | {user.role} | {user.hospitalName || user.location?.city || "N/A"}
                    </p>
                  </div>
                  <button onClick={() => reviewVerification(user._id, true)} className="btn-organ">Approve</button>
                  <button onClick={() => reviewVerification(user._id, false)} className="btn-secondary">Reject</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "requests" && (
        <div className="section-card space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recent Requests</h2>
          {requests.length === 0 ? <EmptyState title="No requests found" /> : (
            <div className="space-y-2">
              {requests.map((request) => (
                <div key={request._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{request.hospitalName}</p>
                    <p className="text-xs text-slate-500">
                      {request.type === "blood" ? request.bloodGroup : request.organType} | {request.location?.city || "N/A"} | {request.urgency}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
          {requestPagination.pages > 1 && (
            <Pagination
              page={requestPagination.page}
              pages={requestPagination.pages}
              hasNext={requestPagination.hasNext}
              hasPrev={requestPagination.hasPrev}
              onNext={() => setRequestPage((previous) => previous + 1)}
              onPrev={() => setRequestPage((previous) => previous - 1)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

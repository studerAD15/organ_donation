import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/index";
import { normalizeIndianPhone, stripPhoneToDigits } from "../utils/phone";

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = (seconds = 30) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) { setError("Please enter your phone number"); return; }
    setLoading(true);
    setError("");
    setDevOtp("");
    try {
      const { data } = await api.post("/auth/send-otp", { phone: normalizedPhone });
      setOtpSent(true);
      startCountdown(30);
      if (data.devOtp) setDevOtp(data.devOtp);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (code.length < 6) { setError("Enter the complete 6-digit OTP"); return; }
    setLoading(true);
    setError("");
    try {
      const { user } = await loginWithOtp(normalizeIndianPhone(phone), code.trim());
      const routes = { donor: "/dashboard/donor", recipient: "/dashboard/recipient", admin: "/dashboard/admin" };
      navigate(routes[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Login failed. Check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blood text-white text-2xl mb-4 shadow-lg shadow-red-500/25">
            🩸
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Sign in with your registered phone number
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-slate-900/80 p-8 border border-slate-100 dark:border-slate-700">

          {/* Phone Input */}
          <div className="space-y-1.5 mb-4">
            <label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Phone Number
            </label>
            <div className="relative flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blood/40 focus-within:border-blood transition-all">
              <span className="flex items-center px-3 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm border-r border-slate-200 dark:border-slate-600 select-none">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(stripPhoneToDigits(e.target.value).slice(-10))}
                onKeyDown={(e) => e.key === "Enter" && !otpSent && sendOtp()}
                placeholder="9876543210"
                autoComplete="tel"
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter your 10-digit Indian mobile number.</p>
          </div>

          <button
            type="button"
            onClick={sendOtp}
            disabled={loading || countdown > 0}
            className="w-full py-3 rounded-xl bg-blood hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading && !otpSent ? <><Spinner size="sm" color="white" /> Sending...</> :
             countdown > 0 ? `Resend OTP in ${countdown}s` : otpSent ? "Resend OTP" : "Send OTP →"}
          </button>

          {/* Dev OTP Helper */}
          {devOtp && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Development Mode</p>
              <button
                type="button"
                onClick={() => setCode(devOtp)}
                className="text-lg font-mono font-bold text-amber-700 dark:text-amber-300 mt-1 hover:underline"
              >
                {devOtp} <span className="text-xs font-sans font-normal">(click to fill)</span>
              </button>
            </div>
          )}

          {/* OTP Step */}
          {otpSent && (
            <form onSubmit={verify} className="mt-6 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-6">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Enter 6-digit OTP
                </label>
                <input
                  id="otp"
                  type="tel"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  autoFocus
                  className="w-full text-center tracking-[0.6em] text-xl py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organ/50 focus:border-organ transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3 rounded-xl bg-organ hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner size="sm" color="white" /> Verifying...</> : "Verify & Login →"}
              </button>
            </form>
          )}

          {/* Error Message */}
          {error && !devOtp && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              ⚠️ {error}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          New here?{" "}
          <Link to="/register" className="text-blood dark:text-red-400 font-semibold hover:underline">
            Create an account →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

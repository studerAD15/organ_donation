// Reusable UI primitive components for the Organ Donation platform

// ─── Status Badge ───────────────────────────────────────────────
const statusConfig = {
  critical: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500 animate-pulse",
  },
  urgent: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  normal: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
};

export const StatusBadge = ({ status }) => {
  const key = status?.toLowerCase();
  const cfg = statusConfig[key] || statusConfig.normal;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status?.toUpperCase() || "NORMAL"}
    </span>
  );
};

// ─── Request Status Badge ────────────────────────────────────────
const requestStatusConfig = {
  open: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  matched: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  fulfilled: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  expired: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export const RequestStatusBadge = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${requestStatusConfig[status] || requestStatusConfig.open}`}>
    {status}
  </span>
);

// ─── Stat Card ───────────────────────────────────────────────────
const colorMap = {
  blood: "bg-red-50 dark:bg-red-900/20 text-blood",
  organ: "bg-blue-50 dark:bg-blue-900/20 text-organ",
  safe: "bg-green-50 dark:bg-green-900/20 text-safe",
  amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
};

export const StatCard = ({ label, value, icon, trend, trendPositive, color = "organ", loading = false }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
        <div className="flex justify-between mb-4">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
      </div>
    );
  }

  return (
    <article className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colorMap[color] || colorMap.organ}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      {trend && (
        <p className={`mt-2 text-xs font-medium flex items-center gap-1 ${trendPositive ? "text-safe" : "text-blood"}`}>
          {trendPositive ? "↑" : "↓"} {trend}
        </p>
      )}
    </article>
  );
};

// ─── Loading Spinner ─────────────────────────────────────────────
export const Spinner = ({ size = "md", color = "blood" }) => {
  const sizeClasses = { sm: "w-4 h-4 border-2", md: "w-6 h-6 border-2", lg: "w-10 h-10 border-4" };
  const colorClasses = { blood: "border-blood", organ: "border-organ", safe: "border-safe", white: "border-white" };
  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} border-t-transparent rounded-full animate-spin`} />
  );
};

// ─── Skeleton Components ─────────────────────────────────────────
export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
);

export const CardSkeleton = () => (
  <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
    <div className="flex justify-between mb-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="w-9 h-9 rounded-xl" />
    </div>
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
    <Skeleton className="h-80 rounded-2xl" />
  </div>
);

// ─── Dark Mode Toggle ────────────────────────────────────────────
import { useEffect, useState } from "react";
export const DarkModeToggle = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
};

// ─── Empty State ─────────────────────────────────────────────────
export const EmptyState = ({ icon = "📭", title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-4xl mb-3">{icon}</div>
    <p className="font-semibold text-slate-700 dark:text-slate-300">{title}</p>
    {description && <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>}
  </div>
);

// ─── Pagination Controls ─────────────────────────────────────────
export const Pagination = ({ page, pages, hasNext, hasPrev, onPrev, onNext }) => (
  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
    <button
      onClick={onPrev} disabled={!hasPrev}
      className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      ← Previous
    </button>
    <span className="text-sm text-slate-500 dark:text-slate-400">
      Page {page} of {pages || 1}
    </span>
    <button
      onClick={onNext} disabled={!hasNext}
      className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      Next →
    </button>
  </div>
);

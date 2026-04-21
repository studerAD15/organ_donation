import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DarkModeToggle } from "../components/ui/index";
import api from "../api/client";

const roleConfig = {
  donor: { label: "Donor", color: "bg-blood/10 text-blood border-blood/20", href: "/dashboard/donor" },
  recipient: { label: "Hospital", color: "bg-organ/10 text-organ border-organ/20", href: "/dashboard/recipient" },
  admin: { label: "Admin", color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800", href: "/dashboard/admin" },
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.get("/health")
      .then((res) => setHealth(res.data.dependencies || null))
      .catch(() => setHealth(null));
  }, []);

  // Only warn for critical failures (DB down).
  const hasDependencyWarning = health && health.database === "down";

  const role = user?.role;
  const roleCfg = roleConfig[role];

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? "bg-blood/10 text-blood dark:bg-blood/20"
        : "text-slate-600 dark:text-slate-300 hover:text-blood dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
    }`;

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900 transition-colors duration-200">
      {hasDependencyWarning && (
        <div className="bg-red-500 text-white text-xs text-center py-2 px-4 font-medium">
          Database is unreachable. The application may not function correctly. Check your MongoDB connection.
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white hover:opacity-80 transition-opacity"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blood text-white text-sm font-bold shadow-sm">
                LL
              </span>
              <span className="text-lg font-display tracking-tight">
                Life<span className="text-blood">Link</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/requests" className={navLinkClass}>Requests</NavLink>
              <NavLink to="/map" className={navLinkClass}>Map</NavLink>
              {roleCfg && <NavLink to={roleCfg.href} className={navLinkClass}>Dashboard</NavLink>}
            </div>

            <div className="flex items-center gap-2">
              <DarkModeToggle />

              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-blood text-white text-sm font-semibold hover:bg-red-700 transition-all shadow-sm hover:shadow-blood hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Login
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {roleCfg && (
                    <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleCfg.color}`}>
                      {roleCfg.label}
                    </span>
                  )}
                  <span className="hidden sm:block text-sm text-slate-700 dark:text-slate-300 font-medium max-w-[120px] truncate">
                    {user.name?.split(" ")[0]}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}

              <button
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? "x" : "="}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden border-t border-slate-100 dark:border-slate-700 py-3 space-y-1 animate-slide-in">
              <NavLink to="/requests" className={navLinkClass} onClick={() => setMobileOpen(false)}>Requests</NavLink>
              <NavLink to="/map" className={navLinkClass} onClick={() => setMobileOpen(false)}>Donor Map</NavLink>
              {roleCfg && <NavLink to={roleCfg.href} className={navLinkClass} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>}
              {!user && (
                <>
                  <NavLink to="/register" className={navLinkClass} onClick={() => setMobileOpen(false)}>Register</NavLink>
                  <NavLink to="/login" className={navLinkClass} onClick={() => setMobileOpen(false)}>Login</NavLink>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 animate-fade-in">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-700 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Copyright {new Date().getFullYear()} LifeLink Portal · Built with care for organ donation
          </p>
          <div className="flex gap-4 text-xs text-slate-400 dark:text-slate-500">
            <Link to="/requests" className="hover:text-blood transition-colors">Requests</Link>
            <Link to="/map" className="hover:text-blood transition-colors">Map</Link>
            <Link to="/register" className="hover:text-blood transition-colors">Donate</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

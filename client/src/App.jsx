import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import Layout from "./layouts/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardSkeleton } from "./components/ui/index";

// Lazy load all page-level components for better performance
const LandingPage      = lazy(() => import("./pages/LandingPage"));
const RegisterPage     = lazy(() => import("./pages/RegisterPage"));
const LoginPage        = lazy(() => import("./pages/LoginPage"));
const DonorDashboard   = lazy(() => import("./pages/donor/DonorDashboard"));
const RecipientDashboard = lazy(() => import("./pages/recipient/RecipientDashboard"));
const AdminDashboard   = lazy(() => import("./pages/admin/AdminDashboard"));
const RequestsPage     = lazy(() => import("./pages/RequestsPage"));
const MapPage          = lazy(() => import("./pages/MapPage"));
const ProfilePage      = lazy(() => import("./pages/ProfilePage"));

const PageLoader = () => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
    <DashboardSkeleton />
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "16px",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          },
          success: {
            style: { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
            iconTheme: { primary: "#15803d", secondary: "#f0fdf4" },
          },
          error: {
            style: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
            iconTheme: { primary: "#b91c1c", secondary: "#fef2f2" },
          },
        }}
      />

      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/"          element={<LandingPage />} />
            <Route path="/register"  element={<RegisterPage />} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/requests"  element={<RequestsPage />} />
            <Route path="/map"       element={<MapPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />

            {/* Protected: Donor only */}
            <Route
              path="/dashboard/donor"
              element={
                <ProtectedRoute roles={["donor"]}>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected: Recipient only */}
            <Route
              path="/dashboard/recipient"
              element={
                <ProtectedRoute roles={["recipient"]}>
                  <RecipientDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected: Admin only */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default App;

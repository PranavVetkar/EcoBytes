import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuthProfile } from "./hooks/useAuthProfile";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import LogAction from "./pages/LogAction";
import Communities from "./pages/Communities";
import CommunityDetails from "./pages/CommunityDetails";
import Rewards from "./pages/Rewards";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Notifications from "./pages/Notifications";

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-terra-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-terra-500 border-t-transparent" />
        <p className="text-sm text-terra-700 font-medium">Loading TerraScore…</p>
      </div>
    </div>
  );
}

/**
 * Gate for routes that require authentication + completed onboarding.
 */
function ProtectedRoute({
  user,
  profile,
  loading,
}: {
  user: ReturnType<typeof useAuthProfile>["user"];
  profile: ReturnType<typeof useAuthProfile>["profile"];
  loading: boolean;
}) {
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile || !profile.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export default function App() {
  const { user, profile, loading, refreshProfile } = useAuthProfile();

  const isReady = !loading && !!user && !!profile && profile.onboarding_complete;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isReady ? <Navigate to="/feed" replace /> : <Login />}
        />

        <Route
          path="/onboarding"
          element={
            loading ? (
              <LoadingScreen />
            ) : !user ? (
              <Navigate to="/login" replace />
            ) : profile?.onboarding_complete ? (
              <Navigate to="/feed" replace />
            ) : (
              <Onboarding user={user} onComplete={refreshProfile} />
            )
          }
        />

        {/* Protected layout routes */}
        <Route element={<ProtectedRoute user={user} profile={profile} loading={loading} />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard user={user} profile={profile} onRefresh={refreshProfile} />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/communities" element={<Communities profile={profile} onRefresh={refreshProfile} />} />
            <Route path="/communities/:id" element={<CommunityDetails />} />
            <Route path="/rewards" element={<Rewards profile={profile} />} />
            <Route path="/log" element={<LogAction />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

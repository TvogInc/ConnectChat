import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sidebar, MobileNav } from "../components/layout/Sidebar";
import { LoadingScreen } from "../components/LoadingScreen";

export function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <LoadingScreen />;
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0">
        <Outlet />
      </div>
      <MobileNav />
    </div>
  );
}

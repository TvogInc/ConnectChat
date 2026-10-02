import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthPage } from "./pages/AuthPage";
import { AppShell } from "./pages/AppShell";
import { HomePage } from "./pages/HomePage";
import { ChatsPage } from "./pages/ChatsPage";
import { SpacesPage } from "./pages/SpacesPage";
import { LivePage } from "./pages/LivePage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoadingScreen } from "./components/LoadingScreen";

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/spaces" element={<SpacesPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/you" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

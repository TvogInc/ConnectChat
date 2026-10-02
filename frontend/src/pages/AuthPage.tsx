import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components/ui/Button";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, handle, displayName);
      } else {
        await login(email, password);
      }
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-20 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">ConnectChat</h1>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
            Connect. Chat. Belong.
          </h2>
          <p className="text-lg text-brand-100 leading-relaxed mb-8">
            Real-time messaging for teams, communities, and friends. Secure, fast, and beautifully simple.
          </p>
          <div className="space-y-3">
            {[
              "💬 Instant direct messaging & group channels",
              "🔒 Secure authentication with JWT tokens",
              "🎨 Light & dark themes with a polished design system",
              "🟢 Real-time presence & typing indicators",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-brand-100">
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ConnectChat</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {isRegister ? "Join the conversation in seconds" : "Sign in to continue chatting"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <Input
                  label="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                />
                <Input
                  label="Handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. alex_j"
                  required
                />
              </>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => navigate(isRegister ? "/login" : "/register")}
              className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
            >
              {isRegister ? "Sign in" : "Sign up"}
            </button>
          </p>

          {!isRegister && (
            <div className="mt-6 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">Try a demo account:</p>
              <p>alice@example.com / password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

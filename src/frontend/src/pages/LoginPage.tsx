import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { biometricLogin } from "../hooks/nativeBiometric";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    const ok = await login(username.trim(), password, rememberMe);
    setSubmitting(false);
    if (!ok) {
      setError("Invalid username or password");
    }
  };

  const handleBiometric = async () => {
    if (biometricBusy || submitting) return;
    setBiometricBusy(true);
    setError(null);
    const credentials = await biometricLogin();
    if (credentials) {
      // A successful biometric unlock is itself a remembered-login flow.
      const ok = await login(credentials.username, credentials.password, true);
      if (!ok) setError("Saved login expired. Please sign in again.");
    }
    setBiometricBusy(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{ background: "#0d1220" }}
    >
      <div className="ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow-2" aria-hidden="true" />

      <div
        className="flex flex-col items-center mb-8 relative z-10"
        style={{ animation: "loginFadeDown 0.55s ease-out both" }}
      >
        <div
          className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-5 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)",
            boxShadow:
              "0 0 40px rgba(249,115,22,0.45), 0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <svg
            aria-hidden="true"
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <polyline points="9 16 11 18 15 14" />
          </svg>
        </div>

        <h1
          className="font-bold tracking-tight mb-1"
          style={{
            fontFamily: "Figtree, sans-serif",
            fontSize: "clamp(2.6rem, 10vw, 3.5rem)",
            lineHeight: 1,
            background:
              "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Rossie
        </h1>

        <p
          className="text-xs font-semibold tracking-[0.22em] uppercase"
          style={{ color: "#8892a4", fontFamily: "Figtree, sans-serif" }}
        >
          Attendance &amp; Salary
        </p>
      </div>

      <div
        className="relative z-10 w-full max-w-sm mx-auto"
        style={{ animation: "loginFadeUp 0.6s ease-out 0.15s both" }}
      >
        <form
          className="login-card p-6"
          onSubmit={handleSubmit}
          data-ocid="login.form"
        >
          <div className="mb-6 text-center">
            <h2
              className="text-xl font-bold text-white mb-1"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Sign in to continue
            </h2>
            <p className="text-sm" style={{ color: "#8892a4" }}>
              Enter your username and password
            </p>
          </div>

          {error && (
            <div
              className="login-error mb-4"
              role="alert"
              data-ocid="login.error"
            >
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="login-label" htmlFor="login-username">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`login-input ${error ? "login-input-error" : ""}`}
              placeholder="Enter your username"
              data-ocid="login.username_input"
            />
          </div>

          <div className="mb-4">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`login-input pr-10 ${
                  error ? "login-input-error" : ""
                }`}
                placeholder="Enter your password"
                data-ocid="login.password_input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8892a4] hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                data-ocid="login.toggle_password"
              >
                {showPassword ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me — controls secure persistent login, not password autofill. */}
          <label className="mb-6 flex cursor-pointer items-center gap-2.5 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
              data-ocid="login.remember_me_checkbox"
            />
            <span className="text-sm" style={{ color: "#aab3c2" }}>
              Remember me
            </span>
          </label>

          <button
            type="button"
            onClick={handleBiometric}
            className="mb-3 w-full rounded-xl border border-[#f97316]/40 bg-[#f97316]/10 py-3 font-semibold text-orange-300 transition-colors hover:bg-[#f97316]/20"
            disabled={biometricBusy || submitting}
          >
            {biometricBusy ? "Verifying…" : "🔐 Use Fingerprint / PIN"}
          </button>

          <button
            type="submit"
            className="login-submit flex items-center justify-center gap-2"
            disabled={submitting}
            data-ocid="login.submit_button"
          >
            {submitting && (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            )}
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

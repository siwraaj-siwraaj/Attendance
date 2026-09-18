import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { showAppNotification } from "../hooks/nativeNotifications";

type LoginMode = "login" | "register";

export default function LoginPage() {
  const { login, registerUser, loginNotice, getRegistrationStatus } = useAuth();
  const [requestStatus, setRequestStatus] = useState<"pending" | "approved" | "revoked">("pending");
  const [mode, setMode] = useState<LoginMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRequestStatus("pending");
    const token = loginNotice?.requestToken;
    const phone = loginNotice?.phone;
    if (!token || !phone) return;

    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const check = async () => {
      const result = await getRegistrationStatus(phone, token);
      const nextStatus = result?.status as "pending" | "approved" | "revoked" | undefined;
      if (stopped || !nextStatus) return;

      if (nextStatus === "approved") {
        setRequestStatus("approved");
        stopped = true;
        if (timer) clearInterval(timer);
        void showAppNotification(
          "Rossie access approved",
          (loginNotice?.name || "Your account") + " (" + phone + ") has been approved by admin. You can now log in.",
        );
      } else if (nextStatus === "revoked") {
        setRequestStatus("revoked");
        stopped = true;
        if (timer) clearInterval(timer);
        void showAppNotification(
          "Rossie access update",
          (loginNotice?.name || "Your account") + " (" + phone + ") was revoked by admin.",
        );
      }
    };

    void check();
    timer = setInterval(() => void check(), 6000);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [loginNotice?.requestToken, loginNotice?.phone, loginNotice?.name, getRegistrationStatus]);

  const goToRegister = () => {
    setMode("register");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const backToLogin = () => {
    setMode("login");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || submitting) return;

    setSubmitting(true);
    setError(null);
    const ok = await login(username.trim(), password, rememberMe);
    setSubmitting(false);

    if (!ok && !loginNotice) {
      setError("Invalid username or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !newPassword || !confirmPassword || submitting) return;

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    setError(null);
    const ok = await registerUser(username.trim(), newPassword);
    setSubmitting(false);

    if (ok) {
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
      return;
    }

    if (!loginNotice) {
      setError("Could not create the account. Make sure your mobile number is registered in Labour details.");
    }
  };

  const noticeClass =
    requestStatus === "approved"
      ? "border-emerald-400/25 bg-emerald-500/10"
      : requestStatus === "revoked"
        ? "border-red-400/25 bg-red-500/10"
        : "border-orange-400/25 bg-orange-500/10";

  const noticeTitleClass =
    requestStatus === "approved"
      ? "text-emerald-200"
      : requestStatus === "revoked"
        ? "text-red-200"
        : "text-orange-200";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-y-auto px-5 py-6"
      style={{ background: "#0d1220" }}
    >
      <div className="ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow-2" aria-hidden="true" />

      <div
        className="relative z-10 w-full max-w-sm"
        style={{ animation: "loginFadeUp 0.5s ease-out both" }}
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: "0 8px 28px rgba(249,115,22,0.28)",
            }}
          >
            <svg
              aria-hidden="true"
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <polyline points="9 16 11 18 15 14" />
            </svg>
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              fontFamily: "Figtree, sans-serif",
              color: "#f97316",
            }}
          >
            Rossie
          </h1>
          <p className="mt-1 text-xs font-medium text-white/40">
            Attendance Management
          </p>
        </div>

        <div className="login-card p-5 sm:p-6">
          {mode === "login" && (
            <form onSubmit={handleLogin} data-ocid="login.form">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Sign in</h2>
              </div>

              {loginNotice && (
                <div
                  className={"mb-5 rounded-xl border p-3.5 " + noticeClass}
                  role="status"
                >
                  <div className="flex items-start gap-2.5">
                    {requestStatus === "approved" ? (
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                    ) : (
                      <AlertCircle
                        className={
                          requestStatus === "revoked"
                            ? "mt-0.5 shrink-0 text-red-300"
                            : "mt-0.5 shrink-0 text-orange-300"
                        }
                        size={18}
                      />
                    )}
                    <div>
                      <p className={"text-sm font-bold " + noticeTitleClass}>
                        {requestStatus === "approved"
                          ? "Access approved"
                          : requestStatus === "revoked"
                            ? "Request revoked"
                            : "Request sent to admin"}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        {loginNotice.name || "Labour"} • {loginNotice.phone}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        {requestStatus === "approved"
                          ? "You can log in now."
                          : requestStatus === "revoked"
                            ? "Contact admin if you need access."
                            : "You can log in after admin approval."}
                      </p>
                    </div>
                  </div>

                  {requestStatus === "approved" && (
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(loginNotice.phone);
                        setPassword("");
                      }}
                      className="mt-3 w-full rounded-lg border border-emerald-400/25 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-200"
                    >
                      Continue
                    </button>
                  )}
                </div>
              )}

              <div className="mb-4">
                <div className="relative">
                  <UserRound
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]"
                  />
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    className="login-input h-12"
                    style={{
                      color: "#fff",
                      WebkitTextFillColor: "#fff",
                      paddingLeft: "3.25rem",
                    }}
                    placeholder="Mobile number or username"
                    aria-label="Mobile number or username"
                    data-ocid="login.username_input"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="login-input h-12"
                    style={{
                      color: "#fff",
                      WebkitTextFillColor: "#fff",
                      paddingLeft: "3.25rem",
                      paddingRight: "3.25rem",
                    }}
                    placeholder="Password"
                    aria-label="Password"
                    data-ocid="login.password_input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#9aa6ba]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error mb-4" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <label className="mb-5 flex min-h-6 cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="flex h-5 w-5 items-center justify-center rounded-[5px] border border-[#7d899d] text-white peer-checked:border-orange-500 peer-checked:bg-orange-500">
                  ✓
                </span>
                <span className="text-sm text-white">Keep me signed in</span>
              </label>

              <button
                type="submit"
                className="login-submit flex h-12 w-full items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? "Signing in…" : "SIGN IN"}
              </button>

              <div className="mt-5 border-t border-white/10 pt-4 text-center">
                <span className="text-sm text-white/45">New here? </span>
                <button
                  type="button"
                  onClick={goToRegister}
                  className="text-sm font-bold text-orange-300 hover:text-orange-200"
                  data-ocid="login.create_account_button"
                >
                  Create account
                </button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} data-ocid="login.register_form">
              <button
                type="button"
                onClick={backToLogin}
                className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
                data-ocid="login.back_button"
              >
                <ArrowLeft size={16} /> Back to sign in
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Create account</h2>
                <p className="mt-1 text-sm text-white/45">
                  Use your mobile number from Labour details.
                </p>
              </div>

              <div className="mb-4">
                <label className="login-label" htmlFor="register-mobile">
                  Mobile number
                </label>
                <input
                  id="register-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  className="login-input h-12"
                  placeholder="Enter mobile number"
                  data-ocid="login.register_mobile_input"
                />
              </div>

              <div className="mb-4">
                <label className="login-label" htmlFor="register-password">
                  Create password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  className="login-input h-12"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  data-ocid="login.register_password_input"
                />
              </div>

              <div className="mb-4">
                <label className="login-label" htmlFor="register-confirm">
                  Confirm password
                </label>
                <input
                  id="register-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className="login-input h-12"
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  data-ocid="login.register_confirm_input"
                />
              </div>

              {error && (
                <div className="login-error mb-4" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="login-submit flex h-12 w-full items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? "Sending request…" : "CREATE ACCOUNT"}
              </button>

              <p className="mt-3 text-center text-[11px] text-white/35">
                Admin approval is required before you can sign in.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

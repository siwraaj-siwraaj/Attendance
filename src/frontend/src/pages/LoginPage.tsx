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
      const next = result?.status as "pending" | "approved" | "revoked" | undefined;
      if (stopped || !next) return;
      if (next === "approved") {
        setRequestStatus("approved");
        stopped = true;
        if (timer) clearInterval(timer);
        void showAppNotification("Rossie access approved", (loginNotice?.name || "Your account") + " (" + phone + ") has been approved by admin. You can now log in.");
      } else if (next === "revoked") {
        setRequestStatus("revoked");
        stopped = true;
        if (timer) clearInterval(timer);
        void showAppNotification("Rossie access update", (loginNotice?.name || "Your account") + " (" + phone + ") was revoked by admin.");
      }
    };
    void check();
    timer = setInterval(() => void check(), 6000);
    return () => { stopped = true; if (timer) clearInterval(timer); };
  }, [loginNotice?.requestToken, loginNotice?.phone, loginNotice?.name, getRegistrationStatus]);

  const goToRegister = () => {
    setMode("register"); setPassword(""); setNewPassword(""); setConfirmPassword(""); setError(null);
  };
  const backToLogin = () => {
    setMode("login"); setPassword(""); setNewPassword(""); setConfirmPassword(""); setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || submitting) return;
    setSubmitting(true); setError(null);
    const ok = await login(username.trim(), password, rememberMe);
    setSubmitting(false);
    if (!ok && !loginNotice) setError("Invalid username or password");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !newPassword || !confirmPassword || submitting) return;
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setSubmitting(true); setError(null);
    const ok = await registerUser(username.trim(), newPassword);
    setSubmitting(false);
    if (ok) {
      setPassword(""); setNewPassword(""); setConfirmPassword(""); setMode("login"); return;
    }
    if (!loginNotice) setError("Could not create the account. Make sure your mobile number is registered in Labour details.");
  };

  return (
    <div className="rossie-login-page">
      <div className="rossie-login-art" aria-hidden="true">
        <div className="rossie-login-orb rossie-login-orb-a" />
        <div className="rossie-login-orb rossie-login-orb-b" />
        <div className="rossie-login-wave" />
      </div>

      <div className="rossie-login-layout">
        <section className="rossie-login-brand">
          <div className="rossie-logo-mark" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="m9 16 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="rossie-brand-name">Rossie</div>
            <div className="rossie-brand-subtitle">Attendance Management</div>
          </div>
          <div className="rossie-login-tagline">Better workforce.<br />Better tomorrow.</div>
        </section>

        <section className="rossie-auth-card">
          {mode === "login" ? (
            <form onSubmit={handleLogin} data-ocid="login.form">
              <div className="rossie-auth-heading">
                <span className="rossie-eyebrow">WELCOME BACK</span>
                <h1>Sign in</h1>
                <p>Manage attendance, contracts and payments from one place.</p>
              </div>

              {loginNotice && (
                <div className={`rossie-login-notice ${requestStatus}`} role="status">
                  {requestStatus === "approved" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <div>
                    <strong>{requestStatus === "approved" ? "Access approved" : requestStatus === "revoked" ? "Request revoked" : "Request sent to admin"}</strong>
                    <span>{loginNotice.name || "Labour"} • {loginNotice.phone}</span>
                    <small>{requestStatus === "approved" ? "You can log in now." : requestStatus === "revoked" ? "Contact admin if you need access." : "You can log in after admin approval."}</small>
                  </div>
                </div>
              )}

              <label className="rossie-field">
                <span>Mobile number or username</span>
                <div className="rossie-input-wrap">
                  <UserRound size={18} />
                  <input id="login-username" type="text" autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }} placeholder="Enter mobile number or username" data-ocid="login.username_input" />
                </div>
              </label>

              <label className="rossie-field">
                <span>Password</span>
                <div className="rossie-input-wrap">
                  <LockKeyhole size={18} />
                  <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="Enter password" data-ocid="login.password_input" />
                  <button type="button" className="rossie-input-action" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </label>

              {error && <div className="rossie-form-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}

              <label className="rossie-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Keep me signed in</span>
              </label>

              <button type="submit" className="rossie-primary-action" disabled={submitting} data-ocid="login.submit_button">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {submitting ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span>
              </button>

              <div className="rossie-auth-switch">New here? <button type="button" onClick={goToRegister} data-ocid="login.create_account_button">Create account</button></div>
            </form>
          ) : (
            <form onSubmit={handleRegister} data-ocid="login.register_form">
              <button type="button" onClick={backToLogin} className="rossie-back-link" data-ocid="login.back_button"><ArrowLeft size={17} /> Back to login</button>
              <div className="rossie-auth-heading">
                <span className="rossie-eyebrow">JOIN ROSSIE</span>
                <h1>Create account</h1>
                <p>Join Rossie and manage your workforce professionally.</p>
              </div>

              <label className="rossie-field">
                <span>Mobile number</span>
                <div className="rossie-input-wrap"><UserRound size={18} /><input id="register-mobile" type="tel" inputMode="numeric" autoComplete="tel" value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }} placeholder="Enter mobile number" data-ocid="login.register_mobile_input" /></div>
              </label>
              <label className="rossie-field">
                <span>Create password</span>
                <div className="rossie-input-wrap"><LockKeyhole size={18} /><input id="register-password" type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(null); }} placeholder="At least 6 characters" autoComplete="new-password" data-ocid="login.register_password_input" /></div>
              </label>
              <label className="rossie-field">
                <span>Confirm password</span>
                <div className="rossie-input-wrap"><LockKeyhole size={18} /><input id="register-confirm" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }} placeholder="Enter password again" autoComplete="new-password" data-ocid="login.register_confirm_input" /></div>
              </label>

              {error && <div className="rossie-form-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
              <button type="submit" className="rossie-primary-action" disabled={submitting} data-ocid="login.register_submit_button">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {submitting ? "Sending request…" : "Create account"} <span aria-hidden="true">→</span>
              </button>
              <p className="rossie-login-footnote">Admin approval is required before you can sign in.</p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

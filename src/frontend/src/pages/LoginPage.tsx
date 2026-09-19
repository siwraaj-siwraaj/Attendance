import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { showAppNotification } from "../hooks/nativeNotifications";

type LoginMode = "login" | "register";

const Logo = () => (
  <div className="rossie-logo-mark" aria-hidden="true">
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  </div>
);

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
  const [showNewPassword, setShowNewPassword] = useState(false);
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
        void showAppNotification("Rossie access approved", (loginNotice?.name || "Your account") + " (" + phone + ") has been approved by admin. You can now log in.");
      } else if (nextStatus === "revoked") {
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

  const resetFields = () => {
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };
  const goToRegister = () => { setMode("register"); resetFields(); };
  const backToLogin = () => { setMode("login"); resetFields(); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || submitting) return;
    setSubmitting(true); setError(null);
    const ok = await login(username.trim(), password, rememberMe);
    setSubmitting(false);
    if (!ok && !loginNotice) setError("Invalid mobile number or password");
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
      setPassword(""); setNewPassword(""); setConfirmPassword(""); setMode("login");
      return;
    }
    if (!loginNotice) setError("Could not create the account. Make sure your mobile number is registered in Labour details.");
  };

  const noticeTitle = requestStatus === "approved" ? "Access approved" : requestStatus === "revoked" ? "Request revoked" : "Request sent to admin";
  const noticeText = requestStatus === "approved" ? "Your account is approved. You can continue to sign in." : requestStatus === "revoked" ? "Contact your administrator if you need access." : "Your account will be available after admin approval.";

  return (
    <main className="rossie-auth-shell">
      <div className="rossie-auth-orb rossie-auth-orb-one" aria-hidden="true" />
      <div className="rossie-auth-orb rossie-auth-orb-two" aria-hidden="true" />
      <div className="rossie-auth-wave rossie-auth-wave-one" aria-hidden="true" />
      <div className="rossie-auth-wave rossie-auth-wave-two" aria-hidden="true" />

      <div className="rossie-auth-content">
        <div className="rossie-brand-lockup">
          <Logo />
          <h1>Rossie</h1>
          <p>Attendance Management</p>
        </div>

        <section className="rossie-auth-card">
          {mode === "login" ? (
            <form onSubmit={handleLogin} data-ocid="login.form">
              <div className="rossie-auth-heading">
                <span className="rossie-kicker">Welcome back</span>
                <h2>Sign in</h2>
                <p>Manage attendance, contracts and workforce operations.</p>
              </div>

              {loginNotice && (
                <div className={"rossie-request-card " + requestStatus}>
                  {requestStatus === "approved" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <div className="min-w-0">
                    <strong>{noticeTitle}</strong>
                    <span>{loginNotice.name || "Labour"} · {loginNotice.phone}</span>
                    <small>{noticeText}</small>
                  </div>
                  {requestStatus === "approved" && (
                    <button type="button" onClick={() => { setUsername(loginNotice.phone); setPassword(""); }} className="rossie-inline-action">
                      Continue
                    </button>
                  )}
                </div>
              )}

              <label className="rossie-field">
                <span>Mobile number or username</span>
                <div className="rossie-input-wrap">
                  <Smartphone size={18} />
                  <input id="login-username" type="text" autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }} placeholder="Enter mobile number or username" data-ocid="login.username_input" />
                </div>
              </label>

              <label className="rossie-field">
                <span>Password</span>
                <div className="rossie-input-wrap">
                  <LockKeyhole size={18} />
                  <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="Enter your password" data-ocid="login.password_input" />
                  <button type="button" className="rossie-icon-button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error && <div className="rossie-auth-error"><AlertCircle size={16} /><span>{error}</span></div>}

              <label className="rossie-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Keep me signed in</span>
              </label>

              <button type="submit" className="rossie-primary-button" disabled={submitting}>
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? "Signing in…" : <>Sign in <ArrowLeft size={18} className="rotate-180" /></>}
              </button>

              <div className="rossie-auth-footer">
                <span>New here?</span>
                <button type="button" onClick={goToRegister} data-ocid="login.create_account_button">Create account</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} data-ocid="login.register_form">
              <button type="button" onClick={backToLogin} className="rossie-back-link" data-ocid="login.back_button"><ArrowLeft size={17} /> Back to sign in</button>
              <div className="rossie-auth-heading">
                <span className="rossie-kicker">Join your workforce</span>
                <h2>Create account</h2>
                <p>Use the mobile number registered in Labour details.</p>
              </div>

              <label className="rossie-field"><span>Mobile number</span><div className="rossie-input-wrap"><Smartphone size={18} /><input id="register-mobile" type="tel" inputMode="numeric" autoComplete="tel" value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }} placeholder="Enter mobile number" data-ocid="login.register_mobile_input" /></div></label>
              <label className="rossie-field"><span>Create password</span><div className="rossie-input-wrap"><LockKeyhole size={18} /><input id="register-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(null); }} placeholder="At least 6 characters" autoComplete="new-password" data-ocid="login.register_password_input" /><button type="button" className="rossie-icon-button" onClick={() => setShowNewPassword((v) => !v)}>{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
              <label className="rossie-field"><span>Confirm password</span><div className="rossie-input-wrap"><LockKeyhole size={18} /><input id="register-confirm" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }} placeholder="Enter password again" autoComplete="new-password" data-ocid="login.register_confirm_input" /></div></label>

              {error && <div className="rossie-auth-error"><AlertCircle size={16} /><span>{error}</span></div>}
              <button type="submit" className="rossie-primary-button rossie-orange-button" disabled={submitting}>
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? "Sending request…" : "Create account"}
              </button>
              <p className="rossie-form-note">Admin approval is required before you can sign in.</p>
            </form>
          )}
        </section>

        <p className="rossie-auth-tagline">Better workforce. <strong>Brighter tomorrow.</strong></p>
      </div>
    </main>
  );
}

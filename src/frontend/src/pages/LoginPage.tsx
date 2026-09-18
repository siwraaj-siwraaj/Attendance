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

function PeopleIllustration() {
  return (
    <div className="relative mx-auto mb-4 h-[102px] w-[224px]" aria-hidden="true">
      <div className="absolute inset-x-4 bottom-0 h-[94px] rounded-[55%_55%_18%_18%]" style={{ background: "rgba(69, 88, 124, 0.48)" }} />
      <svg className="absolute left-0 bottom-0 h-[94px] w-[84px]" viewBox="0 0 92 108" fill="none"><circle cx="46" cy="30" r="22" fill="#f7b08f" /><path d="M23 29c1-17 11-25 24-25 13 0 23 9 24 25-7-7-13-10-23-10-10 0-17 4-25 10Z" fill="#182238" /><path d="M17 108c1-35 12-50 29-50s28 15 29 50H17Z" fill="#f59e0b" /><path d="M31 61l-9 47M61 61l9 47" stroke="#182238" strokeWidth="5" /><path d="M45 60v48" stroke="#162035" strokeWidth="3" /><rect x="38" y="80" width="16" height="20" rx="3" fill="#f8fafc" /><circle cx="46" cy="86" r="3" fill="#f59e0b" /></svg>
      <svg className="absolute left-1/2 bottom-0 h-[102px] w-[94px] -translate-x-1/2" viewBox="0 0 108 118" fill="none"><circle cx="54" cy="31" r="23" fill="#f8b28f" /><path d="M30 30c0-19 10-28 25-28 14 0 24 9 24 28-7-9-15-13-25-13-10 0-17 4-24 13Z" fill="#111a2d" /><path d="M17 118c1-39 14-55 37-55s36 16 37 55H17Z" fill="#263957" /><path d="M38 63l16 25 16-25" stroke="#f97316" strokeWidth="5" /><path d="M54 87v31" stroke="#f97316" strokeWidth="3" /><rect x="45" y="91" width="18" height="23" rx="3" fill="#f8fafc" /><circle cx="54" cy="98" r="3" fill="#f97316" /></svg>
      <svg className="absolute right-0 bottom-0 h-[94px] w-[84px]" viewBox="0 0 92 108" fill="none"><circle cx="46" cy="31" r="21" fill="#f7b08f" /><path d="M22 26c2-17 12-23 24-23s22 6 24 23c-7-6-15-9-24-9s-17 3-24 9Z" fill="#f59e0b" /><path d="M22 29h52" stroke="#f59e0b" strokeWidth="5" /><path d="M17 108c1-35 12-50 29-50s28 15 29 50H17Z" fill="#f97316" /><path d="M28 64l-7 44M64 64l7 44" stroke="#f8fafc" strokeWidth="6" /><path d="M24 79h44M22 94h48" stroke="#f8fafc" strokeWidth="5" /><rect x="38" y="80" width="16" height="20" rx="3" fill="#f8fafc" /><circle cx="46" cy="86" r="3" fill="#f97316" /></svg>
    </div>
  );
}

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
    if (!ok && !loginNotice) setError("Invalid username or password");
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
    if (!loginNotice) setError("Could not create the account. Make sure your mobile number is registered in Labour details.");
  };

  const noticeClass = requestStatus === "approved"
    ? "mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4"
    : requestStatus === "revoked"
      ? "mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-4"
      : "mb-4 rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4";

  const noticeTitleClass = requestStatus === "approved"
    ? "text-sm font-bold text-emerald-200"
    : requestStatus === "revoked"
      ? "text-sm font-bold text-red-200"
      : "text-sm font-bold text-orange-200";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-5" style={{ background: "#0d1220" }}>
      <div className="ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow-2" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center" style={{ animation: "loginFadeDown 0.55s ease-out both" }}>
        <div className="mb-2.5 flex h-14 w-14 items-center justify-center rounded-[18px] shadow-2xl" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)", boxShadow: "0 0 34px rgba(249,115,22,0.4), 0 8px 28px rgba(0,0,0,0.5)" }}>
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" /></svg>
        </div>
        <h1 className="mb-1 font-bold tracking-tight" style={{ fontFamily: "Figtree, sans-serif", fontSize: "clamp(2.4rem, 9vw, 3.2rem)", lineHeight: 1, background: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Rossie</h1>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#9aa6ba", fontFamily: "Figtree, sans-serif" }}>Attendance Management</p>
        <PeopleIllustration />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto" style={{ animation: "loginFadeUp 0.6s ease-out 0.15s both" }}>
        <div className="login-card p-5 sm:p-6">
          {mode === "login" && (
            <form onSubmit={handleLogin} data-ocid="login.form">
              <div className="mb-5 text-center">
                <h2 className="text-xl font-bold text-white">Welcome to Rossie</h2>
                <p className="mt-1 text-sm text-white/45">Sign in to continue</p>
              </div>

              {loginNotice && (
                <div className={noticeClass} role="status">
                  <div className="flex items-start gap-2.5">
                    {requestStatus === "approved" ? <CheckCircle2 className="mt-0.5 text-emerald-300" size={18} /> : <AlertCircle className={requestStatus === "revoked" ? "mt-0.5 text-red-300" : "mt-0.5 text-orange-300"} size={18} />}
                    <div>
                      <p className={noticeTitleClass}>{requestStatus === "approved" ? "Access approved" : requestStatus === "revoked" ? "Access revoked" : "Request sent to admin"}</p>
                      <p className="mt-1 text-xs text-white/65">{loginNotice.name || "Labour"} • {loginNotice.phone}</p>
                      <p className="mt-1.5 text-xs text-white/55">{requestStatus === "approved" ? "Your account is approved. You can log in now." : requestStatus === "revoked" ? "Your request was revoked. Contact admin if needed." : "Your account will be available after admin approval."}</p>
                    </div>
                  </div>
                  {requestStatus === "approved" && (
                    <button type="button" onClick={() => { setUsername(loginNotice.phone); setPassword(""); }} className="mt-3 w-full rounded-xl border border-emerald-400/25 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-200">Continue to login</button>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="login-label" htmlFor="login-username">Mobile number or username</label>
                <div className="relative">
                  <UserRound size={19} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]" />
                  <input id="login-username" type="text" autoComplete="username" value={username} onChange={e=>{setUsername(e.target.value);setError(null)}} className="login-input h-12" style={{color:"#fff",WebkitTextFillColor:"#fff",paddingLeft:"3.25rem"}} placeholder="Enter mobile number or username" data-ocid="login.username_input" />
                </div>
              </div>

              <div className="mb-4">
                <label className="login-label" htmlFor="login-password">Password</label>
                <div className="relative">
                  <LockKeyhole size={19} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]" />
                  <input id="login-password" type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={e=>{setPassword(e.target.value);setError(null)}} className="login-input h-12" style={{color:"#fff",WebkitTextFillColor:"#fff",paddingLeft:"3.25rem",paddingRight:"3.25rem"}} placeholder="Enter your password" data-ocid="login.password_input" />
                  <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#9aa6ba]" aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
                </div>
              </div>

              {error && <div className="login-error mb-4" role="alert"><AlertCircle size={16}/><span>{error}</span></div>}

              <label className="mb-5 flex min-h-6 cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} className="peer sr-only" />
                <span className="flex h-5 w-5 items-center justify-center rounded-[5px] border border-[#7d899d] text-white peer-checked:border-orange-500 peer-checked:bg-orange-500">✓</span>
                <span className="text-sm text-white">Remember me</span>
              </label>

              <button type="submit" className="login-submit flex h-12 w-full items-center justify-center gap-2" disabled={submitting}>
                {submitting?<Loader2 size={18} className="animate-spin"/>:""}{submitting?"Signing in…":"LOGIN"}{!submitting&&<span className="text-xl">→</span>}
              </button>

              <div className="mt-5 border-t border-white/10 pt-4 text-center">
                <span className="text-sm text-white/45">New here? </span>
                <button type="button" onClick={goToRegister} className="text-sm font-bold text-orange-300 hover:text-orange-200" data-ocid="login.create_account_button">Create account</button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} data-ocid="login.register_form">
              <button type="button" onClick={backToLogin} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white" data-ocid="login.back_button"><ArrowLeft size={15}/> Back to login</button>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white">Create your account</h2>
                <p className="mt-1 text-sm text-white/45">Use the mobile number already saved in Labour details.</p>
              </div>
              <div className="mb-4"><label className="login-label" htmlFor="register-mobile">Mobile number</label><input id="register-mobile" type="tel" inputMode="numeric" autoComplete="tel" value={username} onChange={e=>{setUsername(e.target.value);setError(null)}} className="login-input h-12" placeholder="10-digit mobile number" data-ocid="login.register_mobile_input" /></div>
              <div className="mb-4"><label className="login-label" htmlFor="register-password">Create password</label><input id="register-password" type="password" value={newPassword} onChange={e=>{setNewPassword(e.target.value);setError(null)}} className="login-input h-12" placeholder="Create a password (6+ characters)" autoComplete="new-password" data-ocid="login.register_password_input" /></div>
              <div className="mb-4"><label className="login-label" htmlFor="register-confirm">Confirm password</label><input id="register-confirm" type="password" value={confirmPassword} onChange={e=>{setConfirmPassword(e.target.value);setError(null)}} className="login-input h-12" placeholder="Re-enter your password" autoComplete="new-password" data-ocid="login.register_confirm_input" /></div>
              {error && <div className="login-error mb-4" role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
              <button type="submit" className="login-submit flex h-12 w-full items-center justify-center gap-2" disabled={submitting}>{submitting?<Loader2 size={18} className="animate-spin"/>:""}{submitting?"Sending request…":"CREATE ACCOUNT"}</button>
              <p className="mt-3 text-center text-[11px] text-white/35">Your password is yours. Rossie does not use a default password.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

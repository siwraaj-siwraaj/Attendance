import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

function PeopleIllustration() {
  return (
    <div className="relative mx-auto mb-4 h-[102px] w-[224px]" aria-hidden="true">
      <div className="absolute inset-x-4 bottom-0 h-[94px] rounded-[55%_55%_18%_18%]" style={{ background: "rgba(69, 88, 124, 0.48)" }} />
      <svg className="absolute left-0 bottom-0 h-[94px] w-[84px]" viewBox="0 0 92 108" fill="none">
        <circle cx="46" cy="30" r="22" fill="#f7b08f" />
        <path d="M23 29c1-17 11-25 24-25 13 0 23 9 24 25-7-7-13-10-23-10-10 0-17 4-25 10Z" fill="#182238" />
        <path d="M17 108c1-35 12-50 29-50s28 15 29 50H17Z" fill="#f59e0b" />
        <path d="M31 61l-9 47M61 61l9 47" stroke="#182238" strokeWidth="5" />
        <path d="M45 60v48" stroke="#162035" strokeWidth="3" />
        <rect x="38" y="80" width="16" height="20" rx="3" fill="#f8fafc" />
        <circle cx="46" cy="86" r="3" fill="#f59e0b" />
      </svg>
      <svg className="absolute left-1/2 bottom-0 h-[102px] w-[94px] -translate-x-1/2" viewBox="0 0 108 118" fill="none">
        <circle cx="54" cy="31" r="23" fill="#f8b28f" />
        <path d="M30 30c0-19 10-28 25-28 14 0 24 9 24 28-7-9-15-13-25-13-10 0-17 4-24 13Z" fill="#111a2d" />
        <path d="M17 118c1-39 14-55 37-55s36 16 37 55H17Z" fill="#263957" />
        <path d="M38 63l16 25 16-25" stroke="#f97316" strokeWidth="5" />
        <path d="M54 87v31" stroke="#f97316" strokeWidth="3" />
        <rect x="45" y="91" width="18" height="23" rx="3" fill="#f8fafc" />
        <circle cx="54" cy="98" r="3" fill="#f97316" />
      </svg>
      <svg className="absolute right-0 bottom-0 h-[94px] w-[84px]" viewBox="0 0 92 108" fill="none">
        <circle cx="46" cy="31" r="21" fill="#f7b08f" />
        <path d="M22 26c2-17 12-23 24-23s22 6 24 23c-7-6-15-9-24-9s-17 3-24 9Z" fill="#f59e0b" />
        <path d="M18 29h56" stroke="#f59e0b" strokeWidth="5" />
        <path d="M17 108c1-35 12-50 29-50s28 15 29 50H17Z" fill="#f97316" />
        <path d="M28 64l-7 44M64 64l7 44" stroke="#f8fafc" strokeWidth="6" />
        <path d="M24 79h44M22 94h48" stroke="#f8fafc" strokeWidth="5" />
        <rect x="38" y="80" width="16" height="20" rx="3" fill="#f8fafc" />
        <circle cx="46" cy="86" r="3" fill="#f97316" />
      </svg>
    </div>
  );
}



type LoginMode = "choice" | "admin" | "user" | "new-user";

export default function LoginPage() {
  const { login, registerUser, loginNotice } = useAuth();
  const [mode, setMode] = useState<LoginMode>("choice");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = (next: LoginMode) => {
    setMode(next);
    setUsername("");
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
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setSubmitting(true);
    setError(null);
    const ok = await registerUser(username.trim(), newPassword);
    setSubmitting(false);
    if (!ok && !loginNotice) setError("Could not create the account. Make sure your mobile number is registered in Labour details.");
  };

  const back = () => {
    if (mode === "choice") return;
    if (mode === "user" || mode === "admin") resetForm("choice");
    else resetForm("user");
  };

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
          {mode !== "choice" && (
            <button type="button" onClick={back} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white" data-ocid="login.back_button"><ArrowLeft size={15}/> Back</button>
          )}

          {mode === "choice" && (
            <div className="text-center">
              <h2 className="mb-1 text-xl font-bold text-white">Welcome Back</h2>
              <p className="mb-5 text-sm" style={{ color: "#9aa6ba" }}>Choose how you want to sign in</p>
              <div className="space-y-3">
                <button type="button" onClick={() => resetForm("admin")} className="w-full rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-left transition-all hover:bg-orange-500/15 active:scale-[.99]" data-ocid="login.admin_button">
                  <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><ShieldCheck size={21}/></span><span><span className="block text-sm font-bold text-white">Admin Login</span><span className="block text-xs text-white/45 mt-0.5">Use your existing admin username and password</span></span></div>
                </button>
                <button type="button" onClick={() => resetForm("user")} className="w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition-all hover:bg-white/[0.06] active:scale-[.99]" data-ocid="login.user_button">
                  <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white/70"><UserRound size={21}/></span><span><span className="block text-sm font-bold text-white">User Login</span><span className="block text-xs text-white/45 mt-0.5">Sign in with your registered mobile number</span></span></div>
                </button>
              </div>
            </div>
          )}

          {mode === "user" && (
            <div className="text-center">
              <h2 className="mb-1 text-xl font-bold text-white">User Login</h2>
              <p className="mb-5 text-sm" style={{ color: "#9aa6ba" }}>Do you already have an account?</p>
              <div className="space-y-3">
                <button type="button" onClick={() => resetForm("new-user")} className="w-full rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-left" data-ocid="login.new_user_button"><div className="flex items-center gap-3"><CheckCircle2 className="text-orange-300"/><span><span className="block text-sm font-bold text-white">New user</span><span className="block text-xs text-white/45 mt-0.5">Create your password and send an access request</span></span></div></button>
                <button type="button" onClick={() => resetForm("user")} className="w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left" data-ocid="login.existing_user_button"><div className="flex items-center gap-3"><LockKeyhole className="text-white/65"/><span><span className="block text-sm font-bold text-white">Already have an account</span><span className="block text-xs text-white/45 mt-0.5">Log in with your mobile number and password</span></span></div></button>
              </div>
            </div>
          )}

          {(mode === "admin" || (mode === "user" && username !== "")) && (
            <form onSubmit={handleLogin} className={mode === "admin" ? "" : "mt-5"} data-ocid="login.form">
              <div className="mb-4"><label className="login-label" htmlFor="login-username">{mode === "admin" ? "Admin username" : "Mobile number"}</label><div className="relative"><UserRound size={19} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]" /><input id="login-username" type="text" inputMode={mode === "admin" ? "text" : "tel"} autoComplete="username" value={username} onChange={e=>{setUsername(e.target.value);setError(null)}} className="login-input h-12" style={{color:"#fff",WebkitTextFillColor:"#fff",paddingLeft:"3.25rem"}} placeholder={mode === "admin" ? "Enter admin username" : "Enter registered mobile number"} data-ocid="login.username_input"/></div></div>
              <div className="mb-4"><label className="login-label" htmlFor="login-password">Password</label><div className="relative"><LockKeyhole size={19} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]" /><input id="login-password" type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={e=>{setPassword(e.target.value);setError(null)}} className="login-input h-12" style={{color:"#fff",WebkitTextFillColor:"#fff",paddingLeft:"3.25rem",paddingRight:"3.25rem"}} placeholder="Enter your password" data-ocid="login.password_input"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#9aa6ba]" aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
              {error && <div className="login-error mb-4" role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
              <label className="mb-5 flex min-h-6 cursor-pointer items-center gap-2.5"><input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} className="peer sr-only"/><span className="flex h-5 w-5 items-center justify-center rounded-[5px] border border-[#7d899d] text-white peer-checked:border-orange-500 peer-checked:bg-orange-500">✓</span><span className="text-sm text-white">Remember me</span></label>
              <button type="submit" className="login-submit flex h-12 w-full items-center justify-center gap-2" disabled={submitting}>{submitting?<Loader2 size={18} className="animate-spin"/>:""}{submitting?"Signing in…":"LOGIN"}{!submitting&&<span className="text-xl">→</span>}</button>
            </form>
          )}

          {mode === "user" && username === "" && (
            <p className="mt-5 text-center text-[11px] text-white/35">Choose an option above to continue.</p>
          )}

          {mode === "new-user" && (
            <form onSubmit={handleRegister} data-ocid="login.register_form">
              <div className="mb-4"><h2 className="text-xl font-bold text-white">Create your account</h2><p className="mt-1 text-sm text-white/45">Your mobile number must already be saved in Labour details.</p></div>
              {loginNotice && <div className="mb-4 rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4" role="status"><p className="text-sm font-bold text-orange-200">Login request sent to admin</p><p className="mt-1 text-xs text-orange-100/70">{loginNotice.name || "Labour"} • {loginNotice.phone}</p><p className="mt-2 text-xs text-white/55">Admin must accept your request before you can log in.</p></div>}
              <div className="mb-4"><label className="login-label">Mobile number</label><input type="tel" inputMode="numeric" value={username} onChange={e=>{setUsername(e.target.value);setError(null)}} className="login-input h-12" placeholder="10-digit mobile number" /></div>
              <div className="mb-4"><label className="login-label">Create password</label><input type="password" value={newPassword} onChange={e=>{setNewPassword(e.target.value);setError(null)}} className="login-input h-12" placeholder="Create a password (6+ characters)" autoComplete="new-password" /></div>
              <div className="mb-4"><label className="login-label">Confirm password</label><input type="password" value={confirmPassword} onChange={e=>{setConfirmPassword(e.target.value);setError(null)}} className="login-input h-12" placeholder="Re-enter your password" autoComplete="new-password" /></div>
              {error && <div className="login-error mb-4"><AlertCircle size={16}/><span>{error}</span></div>}
              <button type="submit" className="login-submit flex h-12 w-full items-center justify-center gap-2" disabled={submitting}>{submitting?<Loader2 size={18} className="animate-spin"/>:""}{submitting?"Sending request…":"CREATE ACCOUNT"}</button>
              <p className="mt-3 text-center text-[11px] text-white/35">Your password is yours. Rossie does not use a default password.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

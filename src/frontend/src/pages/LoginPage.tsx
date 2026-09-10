import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
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

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    const ok = await login(username.trim(), password, rememberMe);
    setSubmitting(false);
    if (!ok) setError("Invalid username or password");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-4" style={{ background: "#0d1220" }}>
      <div className="ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow-2" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center" style={{ animation: "loginFadeDown 0.55s ease-out both" }}>
        <div className="mb-2.5 flex h-14 w-14 items-center justify-center rounded-[18px] shadow-2xl" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)", boxShadow: "0 0 34px rgba(249,115,22,0.4), 0 8px 28px rgba(0,0,0,0.5)" }}>
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" />
          </svg>
        </div>
        <h1 className="mb-1 font-bold tracking-tight" style={{ fontFamily: "Figtree, sans-serif", fontSize: "clamp(2.4rem, 9vw, 3.2rem)", lineHeight: 1, background: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Rossie</h1>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#9aa6ba", fontFamily: "Figtree, sans-serif" }}>Attendance Management</p>
        <PeopleIllustration />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto" style={{ animation: "loginFadeUp 0.6s ease-out 0.15s both" }}>
        <form className="login-card p-5 sm:p-6" onSubmit={handleSubmit} data-ocid="login.form">
          <div className="mb-5 text-center">
            <h2 className="mb-1 text-xl font-bold text-white" style={{ fontFamily: "Figtree, sans-serif" }}>Welcome Back</h2>
            <p className="text-sm" style={{ color: "#9aa6ba" }}>Sign in to continue to Rossie</p>
          </div>
          {error && <div className="login-error mb-4" role="alert" data-ocid="login.error"><AlertCircle size={16} aria-hidden="true" /><span>{error}</span></div>}

          <div className="mb-4">
            <label className="login-label" htmlFor="login-username" style={{ color: "#b3bdcc" }}>Username</label>
            <div className="relative">
              <UserRound size={19} strokeWidth={1.8} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]" aria-hidden="true" />
              <input id="login-username" type="text" autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }} className={`login-input h-12 pl-12 pr-4 ${error ? "login-input-error" : ""}`} style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", caretColor: "#f97316" }} placeholder="Enter your username" data-ocid="login.username_input" />
            </div>
          </div>

          <div className="mb-4">
            <label className="login-label" htmlFor="login-password" style={{ color: "#b3bdcc" }}>Password</label>
            <div className="relative">
              <LockKeyhole size={19} strokeWidth={1.8} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#aab5c7]" aria-hidden="true" />
              <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }} className={`login-input h-12 pl-12 pr-12 ${error ? "login-input-error" : ""}`} style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", caretColor: "#f97316" }} placeholder="Enter your password" data-ocid="login.password_input" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-[#9aa6ba] transition-colors hover:text-white active:scale-95" aria-label={showPassword ? "Hide password" : "Show password"} data-ocid="login.toggle_password">
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <label className="mb-5 flex min-h-6 cursor-pointer items-center gap-2.5 select-none">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer sr-only" data-ocid="login.remember_me_checkbox" />
            <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-[#7d899d] bg-white/[0.03] text-[13px] font-bold leading-none text-white transition-all peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:shadow-[0_0_12px_rgba(249,115,22,0.25)] peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/50 after:content-['✓'] after:scale-0 after:transition-transform peer-checked:after:scale-100" />
            <span className="text-sm font-medium" style={{ color: "#f4f6fa" }}>Remember me</span>
          </label>

          <button type="submit" className="login-submit flex h-12 w-full items-center justify-center gap-2" disabled={submitting} data-ocid="login.submit_button">
            {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {submitting ? "Signing in…" : "LOGIN"}
            {!submitting && <span className="text-xl leading-none">→</span>}
          </button>

          <div className="mt-5 flex items-center gap-3 text-[11px] tracking-wide" style={{ color: "#7d899d" }}>
            <span className="h-px flex-1 bg-white/10" /><span>Secure&nbsp; • &nbsp;Simple&nbsp; • &nbsp;Efficient</span><span className="h-px flex-1 bg-white/10" />
          </div>
        </form>
      </div>
    </div>
  );
}

import { Clock, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/**
 * Shown to a signed-in user whose account is pending admin approval (or has
 * been revoked). They cannot access any app data until an admin approves them.
 */
export default function PendingApproval() {
  const { status, logout } = useAuth();
  const revoked = status === "revoked";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{ background: "#0d1220" }}
    >
      <div className="ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow-2" aria-hidden="true" />

      <div
        className="relative z-10 w-full max-w-sm mx-auto text-center"
        style={{ animation: "loginFadeUp 0.5s ease-out both" }}
      >
        <div
          className="w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto mb-6 shadow-2xl"
          style={{
            background: revoked
              ? "linear-gradient(135deg, #e11d48 0%, #be123c 100%)"
              : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            boxShadow: revoked
              ? "0 0 40px rgba(225,29,72,0.35)"
              : "0 0 40px rgba(249,115,22,0.4)",
          }}
        >
          <Clock size={40} strokeWidth={2} color="white" aria-hidden="true" />
        </div>

        <h1
          className="font-display text-2xl font-bold text-white mb-2"
          style={{ fontFamily: "Figtree, sans-serif" }}
        >
          {revoked ? "Access Revoked" : "Awaiting Approval"}
        </h1>

        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: "#8892a4" }}
        >
          {revoked
            ? "Your access to this workspace has been removed by an administrator. Contact them if you believe this is a mistake."
            : "Your account has been created and is waiting for an administrator to approve it. You'll be able to access the workspace as soon as you're approved."}
        </p>

        <div
          className="rounded-2xl p-5 mb-8 text-left"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(249,115,22,0.18)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: revoked
                  ? "rgba(225,29,72,0.15)"
                  : "rgba(249,115,22,0.15)",
                border: revoked
                  ? "1px solid rgba(225,29,72,0.3)"
                  : "1px solid rgba(249,115,22,0.3)",
              }}
            >
              <Clock size={18} color={revoked ? "#fb7185" : "#fb923c"} />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">
                {revoked ? "Revoked" : "Pending"}
              </div>
              <div className="text-xs" style={{ color: "#8892a4" }}>
                {revoked
                  ? "No data access"
                  : "An admin needs to approve your account"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e5e7eb",
          }}
          data-ocid="pending.logout_button"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

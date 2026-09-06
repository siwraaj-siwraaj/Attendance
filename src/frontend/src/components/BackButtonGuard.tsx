import { useEffect, useState } from "react";

interface BackButtonGuardProps {
  onReturnToSelection: () => void;
  enabled: boolean;
}

export function BackButtonGuard({
  onReturnToSelection,
  enabled,
}: BackButtonGuardProps) {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowDialog(true);
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled]);

  const handleConfirm = () => {
    setShowDialog(false);
    onReturnToSelection();
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <div className="dialog-overlay" data-ocid="back_button.dialog">
      <div className="bg-[rgba(5,10,20,0.97)] border border-orange-500/25 rounded-2xl p-6 max-w-xs w-full shadow-2xl">
        <h2 className="text-white font-bold text-lg mb-2">Sign out?</h2>
        <p className="text-gray-400 text-sm mb-5">
          Are you sure you want to sign out and return to the login screen?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/20 text-gray-300 text-sm font-medium hover:text-white hover:border-white/40 transition-colors"
            data-ocid="back_button.cancel_button"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl btn-orange text-sm font-medium"
            data-ocid="back_button.confirm_button"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

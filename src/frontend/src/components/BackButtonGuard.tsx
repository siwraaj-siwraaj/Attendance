import { App } from "@capacitor/app";
import { useEffect, useState } from "react";

interface BackButtonGuardProps {
  onReturnToSelection: (tab?: string) => void;
  enabled: boolean;
  returnToContractsOnly?: boolean;
  activeTab: string;
}

function closeOpenSurface(): boolean {
  const labourDetailsBack = document.querySelector<HTMLElement>("[data-labour-details-back]");
  if (labourDetailsBack) {
    labourDetailsBack.click();
    return true;
  }
  const contractSearchClose = document.querySelector<HTMLElement>('[data-ocid="contracts.search_back_close"]');
  if (contractSearchClose) {
    contractSearchClose.click();
    return true;
  }

  const sidebarClose = document.querySelector<HTMLElement>(
    '[data-ocid="sidebar.close_button"], [aria-label="Close sidebar"]',
  );
  if (sidebarClose) {
    sidebarClose.click();
    return true;
  }

  const dialog = Array.from(document.querySelectorAll<HTMLElement>(
    '[role="dialog"], [data-slot="dialog-content"]',
  )).find((element) => element.getClientRects().length > 0);
  if (dialog) {
    const closeButton = dialog.querySelector<HTMLElement>(
      '[aria-label*="Close" i], [data-ocid$=".close"], [data-ocid$=".close_button"]',
    );
    if (closeButton) {
      closeButton.click();
      return true;
    }
    dialog.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    return true;
  }

  // Handle app-built overlays as well as Radix dialogs. Many screens use
  // custom fixed overlays rather than an element with role="dialog".
  const customModal = Array.from(document.querySelectorAll<HTMLElement>(
    '[data-pdf-preview], [data-modal="true"], .fixed.inset-0[class*="z-"]',
  ))
    .filter((element) => element.getClientRects().length > 0)
    .sort((a, b) => {
      const zA = Number.parseInt(getComputedStyle(a).zIndex, 10) || 0;
      const zB = Number.parseInt(getComputedStyle(b).zIndex, 10) || 0;
      return zB - zA;
    })[0];
  if (customModal) {
    const closeButton = customModal.querySelector<HTMLElement>(
      '[aria-label*="Close" i], [data-ocid$=".close"], [data-ocid$=".close_button"], button:has(svg.lucide-x)',
    );
    if (closeButton) {
      closeButton.click();
      return true;
    }

    // Forms commonly provide a Cancel button rather than an X close control.
    const cancelButton = Array.from(customModal.querySelectorAll<HTMLElement>("button"))
      .find((button) => /^(cancel|close|back|dismiss)$/i.test(button.textContent?.trim() ?? ""));
    if (cancelButton) {
      cancelButton.click();
      return true;
    }
  }

  return false;
}

export function BackButtonGuard({
  onReturnToSelection,
  enabled,
  returnToContractsOnly = false,
  activeTab,
}: BackButtonGuardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showExitHint, setShowExitHint] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleBackNavigation = async () => {
      if (closeOpenSurface()) return;

      if (activeTab === "labours" || activeTab === "more") {
        onReturnToSelection("payments");
        return;
      }
      if (activeTab === "advances" || activeTab === "payments") {
        onReturnToSelection("contracts");
        return;
      }
      if (activeTab === "contracts") {
        if (showExitHint) {
          setShowExitHint(false);
          await App.exitApp();
          return;
        }
        setShowExitHint(true);
        window.setTimeout(() => setShowExitHint(false), 2000);
        return;
      }
      if (returnToContractsOnly) {
        onReturnToSelection("contracts");
        return;
      }
      setShowDialog(true);
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      void handleBackNavigation();
      window.history.pushState(null, "", window.location.href);
    };

    const handleHardwareBack = async () => {
      await handleBackNavigation();
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    const backListener = App.addListener("backButton", handleHardwareBack);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      backListener.then((listener) => listener.remove()).catch(() => {});
    };
  }, [enabled, onReturnToSelection, returnToContractsOnly, activeTab, showExitHint]);

  const handleConfirm = () => {
    setShowDialog(false);
    onReturnToSelection();
  };

  const handleCancel = () => {
    setShowDialog(false);
    window.history.pushState(null, "", window.location.href);
  };

  if (!showDialog && !showExitHint) return null;

  return (
    <div className="dialog-overlay" data-ocid="back_button.dialog">
      {showExitHint ? (
        <div className="rounded-xl bg-[rgba(5,10,20,0.97)] border border-white/10 px-5 py-3 text-white text-sm shadow-2xl" role="status">
          Press back again to exit
        </div>
      ) : (
      <div className="bg-[rgba(5,10,20,0.97)] border border-orange-500/25 rounded-2xl p-6 max-w-xs w-full shadow-2xl">
        <h2 className="text-white font-bold text-lg mb-2">Sign out?</h2>
        <p className="text-gray-400 text-sm mb-5">
          Are you sure you want to sign out and return to the login screen?
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={handleCancel} className="flex-1 py-2.5 rounded-xl border border-white/20 text-gray-300 text-sm font-medium hover:text-white hover:border-white/40 transition-colors" data-ocid="back_button.cancel_button">Stay</button>
          <button type="button" onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl btn-orange text-sm font-medium" data-ocid="back_button.confirm_button">Sign out</button>
        </div>
      </div>
      )}
    </div>
  );
}

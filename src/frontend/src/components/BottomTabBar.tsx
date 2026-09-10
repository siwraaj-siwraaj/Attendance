import {
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
  Users,
  Wallet,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  swipeProgress?: number;
}

const ALL_TAB_DEFS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "contracts", label: "Contracts", icon: <FileText size={24} strokeWidth={2} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={24} strokeWidth={2} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={24} strokeWidth={2} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={24} strokeWidth={2} /> },
  { key: "labours", label: "Labours", icon: <Users size={24} strokeWidth={2} /> },
  { key: "settled", label: "Settled", icon: <CheckSquare size={24} strokeWidth={2} /> },
];

export default function BottomTabBar({ activeTab, onTabChange, swipeProgress: externalSwipeProgress = 0 }: LayoutProps) {
  const { allowedTabs } = useAuth();
  const tabs = ALL_TAB_DEFS.filter((t) => allowedTabs.includes(t.key));
  const prevTabRef = useRef<Tab>(activeTab);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const [localSwipeProgress, setLocalSwipeProgress] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const rawSwipeProgress = Math.abs(externalSwipeProgress) > 0.001 ? externalSwipeProgress : localSwipeProgress;

  // Never apply a stale gesture offset after Layout has committed the new tab.
  // Without this guard, a long swipe could be interpreted as:
  // new active tab + old one-tab offset = a visual two-tab jump.
  const swipeProgress = prevTabRef.current !== activeTab ? 0 : rawSwipeProgress;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("main") || target.closest('table, [role="dialog"], [data-pdf-preview], input, textarea, select, button, [data-no-tab-swipe]')) {
        touchStartX.current = null;
        touchStartY.current = null;
        didSwipeRef.current = false;
        return;
      }
      touchStartX.current = e.touches[0]?.clientX ?? null;
      touchStartY.current = e.touches[0]?.clientY ?? null;
      didSwipeRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartX.current;
      const dy = touch.clientY - touchStartY.current;
      if (Math.abs(dx) <= Math.abs(dy) * 1.15 || Math.abs(dx) < 8) return;
      const width = Math.max(window.innerWidth, 320);
      const progress = dx / width;
      const index = tabs.indexOf(activeTab);
      const atEdge = (progress > 0 && index <= 0) || (progress < 0 && index >= tabs.length - 1);

      // Opposite to the finger, but limited to one adjacent tab.
      const indicatorProgress = atEdge ? -progress * 0.28 : -progress * 0.92;
      setLocalSwipeProgress(Math.max(-1, Math.min(1, indicatorProgress)));
      // Match Layout's actual swipe commit threshold.
      didSwipeRef.current = Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.15;
    };

    const handleTouchEnd = () => {
      touchStartX.current = null;
      touchStartY.current = null;
      // A swipe that does not commit to another tab must return to the active tab.
      // For a committed swipe, the activeTab change below clears the temporary offset.
      if (!didSwipeRef.current) setLocalSwipeProgress(0);
      didSwipeRef.current = false;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [activeTab, tabs]);

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.key === activeTab);
    const total = tabs.length;
    if (idx < 0 || total === 0) return;

    const visualIndex = Math.max(-0, Math.min(total - 1, idx + swipeProgress));
    const isSwiping = Math.abs(swipeProgress) > 0.001;
    const tabChanged = prevTabRef.current !== activeTab;

    setIndicatorStyle({
      left: `${(visualIndex / total) * 100}%`,
      width: `${100 / total}%`,
      boxShadow: "0 0 8px rgba(249, 115, 22, 0.7)",
      transition: isSwiping
        ? "none"
        : tabChanged
          ? "left 0.18s cubic-bezier(0.22,1,0.36,1), width 0.18s cubic-bezier(0.22,1,0.36,1)"
          : "none",
    });
    prevTabRef.current = activeTab;
  }, [activeTab, tabs, swipeProgress]);

  return (
    <nav
      className="tab-bar z-50"
      data-ocid="bottom_tab_bar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "calc(64px + env(safe-area-inset-bottom, 0px))",
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        zIndex: 50,
        isolation: "isolate",
        transform: "none",
        WebkitTransform: "none",
        willChange: "auto",
      }}
    >
      <div className="flex items-center justify-around relative h-16 min-h-16">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-0 h-16 py-1.5 transition-all duration-300 ease-out ${
                isActive ? "text-[#f97316]" : "text-gray-500"
              }`}
              style={{ touchAction: "manipulation" }}
              data-ocid={`tab.${t.key}`}
            >
              <span className={`leading-none transition-transform duration-300 ease-out ${isActive ? "scale-110" : "scale-100"}`}>
                {t.icon}
              </span>
              <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
        <div className="absolute bottom-0 h-0.5 bg-[#f97316] rounded-full pointer-events-none" style={indicatorStyle} />
      </div>
    </nav>
  );
}

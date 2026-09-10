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

const ALL_TAB_DEFS: { key: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { key: "contracts", label: "Contracts", shortLabel: "Contracts", icon: <FileText size={21} strokeWidth={1.9} /> },
  { key: "attendance", label: "Attendance", shortLabel: "Attendance", icon: <ClipboardList size={21} strokeWidth={1.9} /> },
  { key: "advances", label: "Advances", shortLabel: "Advances", icon: <Wallet size={21} strokeWidth={1.9} /> },
  { key: "payments", label: "Payments", shortLabel: "Payments", icon: <CreditCard size={21} strokeWidth={1.9} /> },
  { key: "labours", label: "Labours", shortLabel: "Labours", icon: <Users size={21} strokeWidth={1.9} /> },
  { key: "settled", label: "Settled", shortLabel: "Settled", icon: <CheckSquare size={21} strokeWidth={1.9} /> },
];

export default function BottomTabBar({ activeTab, onTabChange, swipeProgress = 0 }: LayoutProps) {
  const { allowedTabs } = useAuth();
  const tabs = ALL_TAB_DEFS.filter((t) => allowedTabs.includes(t.key));
  const previousTabRef = useRef<Tab>(activeTab);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.key === activeTab);
    const total = tabs.length;
    if (index < 0 || total === 0) return;

    const progress = Math.max(-0.5, Math.min(0.5, swipeProgress));
    const visualIndex = Math.max(0, Math.min(total - 1, index + progress));
    const swiping = Math.abs(progress) > 0.001;
    const changed = previousTabRef.current !== activeTab;

    setIndicatorStyle({
      left: `calc(${(visualIndex / total) * 100}% + 4px)`,
      width: `calc(${100 / total}% - 8px)`,
      transition: swiping
        ? "none"
        : changed
          ? "left 300ms cubic-bezier(0.22, 1, 0.36, 1), width 200ms ease"
          : "none",
      transformOrigin: "center",
    });

    if (changed && !swiping) {
      requestAnimationFrame(() => {
        const indicator = indicatorRef.current;
        if (!indicator) return;
        indicator.animate(
          [
            { transform: "translateY(0) scaleX(0.82) scaleY(0.92)" },
            { transform: "translateY(-2px) scaleX(1.08) scaleY(1)" },
            { transform: "translateY(0) scaleX(1) scaleY(1)" },
          ],
          {
            duration: 320,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "none",
          },
        );
      });
    }

    previousTabRef.current = activeTab;
  }, [activeTab, tabs, swipeProgress]);

  return (
    <nav
      className="fixed left-0 right-0 bottom-0 z-50 pointer-events-none"
      data-ocid="bottom_tab_bar"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-3 mb-2.5 pointer-events-auto">
        <div
          className="relative h-[68px] rounded-[22px] border border-white/[0.08] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(18,25,43,0.97) 0%, rgba(8,13,27,0.98) 100%)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
          }}
        >
          <div
            className="absolute inset-x-8 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.45), transparent)" }}
          />

          <div className="relative flex h-full items-center px-1.5">
            <div
              ref={indicatorRef}
              className="absolute top-1.5 bottom-1.5 rounded-[18px] pointer-events-none"
              style={{
                ...indicatorStyle,
                background: "linear-gradient(180deg, rgba(249,115,22,0.18), rgba(249,115,22,0.08))",
                border: "1px solid rgba(249,115,22,0.18)",
                boxShadow: "0 0 20px rgba(249,115,22,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
                willChange: "left, transform",
              }}
            />

            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-0.5"
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                  data-ocid={`tab.${tab.key}`}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className="flex h-7 w-8 items-center justify-center rounded-xl"
                    style={{
                      color: isActive ? "#fb923c" : "#8b94a7",
                      transform: isActive ? "translateY(-1px) scale(1.04)" : "translateY(0) scale(1)",
                      transition: "color 220ms ease, transform 280ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className="max-w-full truncate text-[9px] font-semibold tracking-[0.01em]"
                    style={{ color: isActive ? "#f7f8fa" : "#737d91", transition: "color 200ms ease" }}
                  >
                    {tab.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

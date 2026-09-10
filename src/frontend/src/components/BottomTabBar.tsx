import {
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
  Users,
  Wallet,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  swipeProgress?: number;
}

const ALL_TAB_DEFS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "contracts", label: "Contracts", icon: <FileText size={22} strokeWidth={1.9} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={22} strokeWidth={1.9} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={22} strokeWidth={1.9} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={22} strokeWidth={1.9} /> },
  { key: "labours", label: "Labours", icon: <Users size={22} strokeWidth={1.9} /> },
  { key: "settled", label: "Settled", icon: <CheckSquare size={22} strokeWidth={1.9} /> },
];

export default function BottomTabBar({ activeTab, onTabChange, swipeProgress = 0 }: LayoutProps) {
  const { allowedTabs } = useAuth();
  const allowedKey = allowedTabs.join("|");
  const tabs = useMemo(
    () => ALL_TAB_DEFS.filter((tab) => allowedTabs.includes(tab.key)),
    [allowedKey],
  );
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
      left: `calc(${(visualIndex / total) * 100}% + 3px)`,
      width: `calc(${100 / total}% - 6px)`,
      transition: swiping ? "none" : changed ? "left 280ms cubic-bezier(0.22,1,0.36,1)" : "none",
    });

    if (changed && !swiping) {
      requestAnimationFrame(() => {
        indicatorRef.current?.animate(
          [
            { transform: "translateY(1px) scale(0.88)" },
            { transform: "translateY(-1px) scale(1.04)" },
            { transform: "translateY(0) scale(1)" },
          ],
          { duration: 280, easing: "cubic-bezier(0.22,1,0.36,1)" },
        );
      });
    }
    previousTabRef.current = activeTab;
  }, [activeTab, tabs, swipeProgress]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 pointer-events-none" data-ocid="bottom_tab_bar" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="mx-3 mb-3 pointer-events-auto sm:mx-auto sm:max-w-[680px]">
        <div
          className="relative h-[74px] overflow-hidden rounded-[26px] border"
          style={{
            background: "linear-gradient(145deg, rgba(18,28,46,0.98), rgba(5,11,22,0.99))",
            borderColor: "rgba(255,255,255,0.09)",
            boxShadow: "0 16px 42px rgba(0,0,0,0.52), 0 2px 0 rgba(255,255,255,0.04) inset",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.65), transparent)" }} />
          <div className="relative flex h-full items-center px-1.5">
            <div
              ref={indicatorRef}
              className="absolute top-1.5 bottom-1.5 rounded-[21px] pointer-events-none"
              style={{
                ...indicatorStyle,
                background: "linear-gradient(180deg, rgba(249,115,22,0.19), rgba(249,115,22,0.06))",
                border: "1px solid rgba(249,115,22,0.22)",
                boxShadow: "0 8px 24px rgba(249,115,22,0.10), inset 0 1px 0 rgba(255,255,255,0.06)",
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
                  className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[21px] px-0.5 active:scale-[0.97]"
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", transition: "transform 120ms ease" }}
                  data-ocid={`tab.${tab.key}`}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className="flex h-8 w-9 items-center justify-center rounded-2xl"
                    style={{
                      color: isActive ? "#fb923c" : "#7d879a",
                      transform: isActive ? "translateY(-1px) scale(1.08)" : "translateY(1px) scale(1)",
                      transition: "color 220ms ease, transform 280ms cubic-bezier(0.22,1,0.36,1)",
                      filter: isActive ? "drop-shadow(0 0 7px rgba(249,115,22,0.28))" : "none",
                    }}
                  >
                    {tab.icon}
                  </span>
                  <span className="max-w-full truncate text-[9px] font-bold tracking-[0.015em]" style={{ color: isActive ? "#f7f8fa" : "#687286", transition: "color 180ms ease" }}>
                    {tab.label}
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

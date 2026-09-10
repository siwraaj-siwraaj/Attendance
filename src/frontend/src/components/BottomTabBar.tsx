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

interface BottomTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const ALL_TAB_DEFS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "contracts", label: "Contracts", icon: <FileText size={24} strokeWidth={2} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={24} strokeWidth={2} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={24} strokeWidth={2} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={24} strokeWidth={2} /> },
  { key: "labours", label: "Labours", icon: <Users size={24} strokeWidth={2} /> },
  { key: "settled", label: "Settled", icon: <CheckSquare size={24} strokeWidth={2} /> },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const { allowedTabs } = useAuth();
  const tabs = ALL_TAB_DEFS.filter((t) => allowedTabs.includes(t.key));
  const prevTabRef = useRef<Tab>(activeTab);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.key === activeTab);
    const total = tabs.length;
    if (idx < 0 || total === 0) return;
    setIndicatorStyle({
      left: `${(idx / total) * 100}%`,
      width: `${100 / total}%`,
      boxShadow: "0 0 8px rgba(249, 115, 22, 0.7)",
      transition:
        prevTabRef.current !== activeTab
          ? "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)"
          : "none",
    });
    prevTabRef.current = activeTab;
  }, [activeTab, tabs]);

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
              <span
                className={`leading-none transition-transform duration-300 ease-out ${
                  isActive ? "scale-110" : "scale-100"
                }`}
              >
                {t.icon}
              </span>
              <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
        <div
          className="absolute bottom-0 h-0.5 bg-[#f97316] rounded-full pointer-events-none"
          style={indicatorStyle}
        />
      </div>
    </nav>
  );
}

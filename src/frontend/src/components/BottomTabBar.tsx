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
  {
    key: "contracts",
    label: "Contracts",
    icon: <FileText size={24} strokeWidth={2} />,
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: <ClipboardList size={24} strokeWidth={2} />,
  },
  {
    key: "advances",
    label: "Advances",
    icon: <Wallet size={24} strokeWidth={2} />,
  },
  {
    key: "payments",
    label: "Payments",
    icon: <CreditCard size={24} strokeWidth={2} />,
  },
  {
    key: "labours",
    label: "Labours",
    icon: <Users size={24} strokeWidth={2} />,
  },
  {
    key: "settled",
    label: "Settled",
    icon: <CheckSquare size={24} strokeWidth={2} />,
  },
];

export default function BottomTabBar({
  activeTab,
  onTabChange,
}: BottomTabBarProps) {
  // The visible tabs are driven by the signed-in role's allowed set, not by
  // the edit/view mode. Admin sees all six; Attendance-only and View-only see
  // only Attendance; Contract-only sees only Contracts.
  const { allowedTabs } = useAuth();
  const tabs = ALL_TAB_DEFS.filter((t) => allowedTabs.includes(t.key));
  const prevTabRef = useRef<Tab>(activeTab);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.key === activeTab);
    const total = tabs.length;
    const pct = (idx / total) * 100;
    const width = 100 / total;
    setIndicatorStyle({
      left: `${pct}%`,
      width: `${width}%`,
      boxShadow: "0 0 8px rgba(249, 115, 22, 0.7)",
      transition:
        prevTabRef.current !== activeTab
          ? "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)"
          : "none",
    });
    prevTabRef.current = activeTab;
  }, [activeTab, tabs]);

  return (
    <nav className="tab-bar z-50" data-ocid="bottom_tab_bar">
      <div className="flex items-center justify-around py-2 relative">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          const index = tabs.findIndex((tab) => tab.key === t.key);
          const totalTabs = tabs.length;
          const _indicatorLeft = `${(index / totalTabs) * 100}%`;
          const _indicatorWidth = `${100 / totalTabs}%`;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 ease-out ${
                isActive ? "text-[#f97316]" : "text-gray-500"
              }`}
              data-ocid={`tab.${t.key}`}
            >
              <span
                className={`leading-none transition-transform duration-300 ease-out ${
                  isActive ? "scale-110" : "scale-100"
                }`}
              >
                {t.icon}
              </span>
              <span className="text-[10px] mt-0.5 font-medium">{t.label}</span>
            </button>
          );
        })}
        {/* Animated active indicator — springs on swipe */}
        <div
          className="absolute bottom-0 h-0.5 bg-[#f97316] rounded-full"
          style={indicatorStyle}
        />
      </div>
    </nav>
  );
}

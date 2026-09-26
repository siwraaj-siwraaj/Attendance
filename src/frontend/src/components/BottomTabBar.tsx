import {
  CreditCard,
  FileText,
  Users,
  Wallet,
  MoreHorizontal,
} from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const ALL_TAB_DEFS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "contracts", label: "Contracts", icon: <FileText size={22} strokeWidth={1.9} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={22} strokeWidth={1.9} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={22} strokeWidth={1.9} /> },
  { key: "labours", label: "Labours", icon: <Users size={22} strokeWidth={1.9} /> },
  { key: "more", label: "More", icon: <MoreHorizontal size={22} strokeWidth={1.9} /> },
];

export default function BottomTabBar({ activeTab, onTabChange }: LayoutProps) {
  const { allowedTabs } = useAuth();
  const allowedKey = allowedTabs.join("|");
  const tabs = useMemo(
    () => ALL_TAB_DEFS.filter((tab) => allowedTabs.includes(tab.key)),
    [allowedKey],
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0c1322]/98 backdrop-blur-xl"
      data-ocid="bottom_tab_bar"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex h-16 w-full max-w-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors"
              style={{
                color: isActive ? "#f8fafc" : "#7f8aa0",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
              data-ocid={`tab.${tab.key}`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-orange-400" />
              )}
              <span className="flex h-6 items-center justify-center">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

}

import { CheckSquare, ClipboardList, CreditCard, FileText, Users, Wallet } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface LayoutProps { activeTab: Tab; onTabChange: (tab: Tab) => void; }

const ALL_TAB_DEFS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "contracts", label: "Contracts", icon: <FileText size={20} strokeWidth={2} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={20} strokeWidth={2} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={20} strokeWidth={2} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={20} strokeWidth={2} /> },
  { key: "labours", label: "Labours", icon: <Users size={20} strokeWidth={2} /> },
  { key: "settled", label: "Settled", icon: <CheckSquare size={20} strokeWidth={2} /> },
];

export default function BottomTabBar({ activeTab, onTabChange }: LayoutProps) {
  const { allowedTabs } = useAuth();
  const allowedKey = allowedTabs.join("|");
  const tabs = useMemo(() => ALL_TAB_DEFS.filter((tab) => allowedTabs.includes(tab.key)), [allowedKey]);

  return (
    <nav className="rossie-bottom-nav" data-ocid="bottom_tab_bar" aria-label="Primary navigation">
      <div className="rossie-bottom-dock">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={isActive ? "rossie-nav-item active" : "rossie-nav-item"}
              data-ocid={`tab.${tab.key}`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="rossie-nav-icon">{tab.icon}</span>
              <span className="rossie-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

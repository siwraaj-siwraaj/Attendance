import { ClipboardList, CreditCard, FileText, Home, MoreHorizontal, Wallet } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface Props { activeTab: Tab; onTabChange: (tab: Tab) => void; }

const ALL_TAB_DEFS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "contracts", label: "Contracts", icon: <FileText size={19} strokeWidth={1.9} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={19} strokeWidth={1.9} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={19} strokeWidth={1.9} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={19} strokeWidth={1.9} /> },
  { key: "labours", label: "Labours", icon: <MoreHorizontal size={19} strokeWidth={1.9} /> },
  { key: "settled", label: "Settled", icon: <Home size={19} strokeWidth={1.9} /> },
];

export default function BottomTabBar({ activeTab, onTabChange }: Props) {
  const { allowedTabs } = useAuth();
  const allowedKey = allowedTabs.join("|");
  const tabs = useMemo(() => ALL_TAB_DEFS.filter((tab) => allowedTabs.includes(tab.key)), [allowedKey]);

  return (
    <nav className="rossie-bottom-nav" data-ocid="bottom_tab_bar" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} aria-label="Primary navigation">
      <div className="rossie-bottom-nav-inner">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)} className={active ? "rossie-nav-item active" : "rossie-nav-item"}>
              <span className="rossie-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

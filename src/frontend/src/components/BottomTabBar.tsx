import { ClipboardCheck, CreditCard, FileText, Home, Menu } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onMore: () => void;
}

export default function BottomTabBar({ activeTab, onTabChange, onMore }: LayoutProps) {
  const { allowedTabs } = useAuth();
  const tabs = [
    { key: "home" as Tab, label: "Home", icon: Home },
    { key: "contracts" as Tab, label: "Contracts", icon: FileText },
    { key: "attendance" as Tab, label: "Attendance", icon: ClipboardCheck },
    { key: "payments" as Tab, label: "Payments", icon: CreditCard },
  ].filter((t) => allowedTabs.includes(t.key));

  return (
    <nav className="rossie-bottom-nav" data-ocid="bottom_tab_bar" aria-label="Primary navigation">
      <div className="rossie-bottom-dock">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)}
              className={active ? "rossie-nav-item active" : "rossie-nav-item"}
              data-ocid={`tab.${tab.key}`} aria-current={active ? "page" : undefined}>
              <span className="rossie-nav-icon"><Icon size={18} strokeWidth={active ? 2.5 : 2} /></span>
              <span className="rossie-nav-label">{tab.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={onMore} className="rossie-nav-item" data-ocid="tab.more" aria-label="More">
          <span className="rossie-nav-icon"><Menu size={18} /></span>
          <span className="rossie-nav-label">More</span>
        </button>
      </div>
    </nav>
  );
}
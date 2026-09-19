import { ClipboardList, CreditCard, FileText, Home, Menu } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onMore: () => void;
}

const TAB_DEFS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "Home", icon: <Home size={20} strokeWidth={1.9} /> },
  { key: "contracts", label: "Contracts", icon: <FileText size={20} strokeWidth={1.9} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={20} strokeWidth={1.9} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={20} strokeWidth={1.9} /> },
];

export default function BottomTabBar({ activeTab, onTabChange, onMore }: LayoutProps) {
  const { allowedTabs } = useAuth();
  const allowedKey = allowedTabs.join("|");
  const tabs = useMemo(() => TAB_DEFS.filter((tab) => allowedTabs.includes(tab.key)), [allowedKey]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 pointer-events-none" data-ocid="bottom_tab_bar" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} aria-label="Primary navigation">
      <div className="mx-3 mb-3 pointer-events-auto sm:mx-auto sm:max-w-[700px]">
        <div className="relative overflow-hidden rounded-[25px] border" style={{ height: 76, background: "linear-gradient(135deg, rgba(13,24,42,0.985) 0%, rgba(8,15,28,0.99) 62%, rgba(18,17,20,0.985) 100%)", borderColor: "rgba(126,151,188,0.25)", boxShadow: "0 16px 42px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(249,115,22,0.10)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
          <div className="relative flex h-full items-stretch gap-0.5 px-1.5 py-1.5">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)} className="group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center rounded-[20px] px-0.5" data-ocid={`tab.${tab.key}`} aria-current={active ? "page" : undefined}>
                  {active && <span className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ background: "linear-gradient(180deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.11) 58%, rgba(249,115,22,0.045) 100%)", border: "1px solid rgba(249,115,22,0.36)" }} />}
                  <span className="relative z-10 flex h-8 w-10 items-center justify-center" style={{ color: active ? "#fb923c" : "#8792a7" }}>{tab.icon}</span>
                  <span className="relative z-10 mt-0.5 max-w-full truncate px-0.5 text-[9px] font-extrabold leading-none" style={{ color: active ? "#f8fafc" : "#727d91" }}>{tab.label}</span>
                </button>
              );
            })}
            <button type="button" onClick={onMore} className="group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center rounded-[20px] px-0.5" data-ocid="tab.more" aria-label="More">
              <span className="relative z-10 flex h-8 w-10 items-center justify-center" style={{ color: "#8792a7" }}><Menu size={20} /></span>
              <span className="relative z-10 mt-0.5 text-[9px] font-extrabold leading-none" style={{ color: "#727d91" }}>More</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

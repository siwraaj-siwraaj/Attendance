import {
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
  Users,
  Wallet,
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
  { key: "contracts", label: "Contracts", icon: <FileText size={23} strokeWidth={1.8} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={23} strokeWidth={1.8} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={23} strokeWidth={1.8} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={23} strokeWidth={1.8} /> },
  { key: "labours", label: "Labours", icon: <Users size={23} strokeWidth={1.8} /> },
  { key: "settled", label: "Settled", icon: <CheckSquare size={23} strokeWidth={1.8} /> },
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
      className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
      data-ocid="bottom_tab_bar"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary navigation"
    >
      <div className="mx-3 mb-3 pointer-events-auto sm:mx-auto sm:max-w-[680px]">
        <div
          className="relative overflow-hidden rounded-[28px] border"
          style={{
            height: 78,
            background:
              "linear-gradient(145deg, rgba(22,34,56,0.985) 0%, rgba(8,15,29,0.995) 72%, rgba(6,11,21,0.995) 100%)",
            borderColor: "rgba(117,145,184,0.28)",
            boxShadow:
              "0 18px 48px rgba(0,0,0,0.58), 0 0 0 1px rgba(255,255,255,0.025) inset, 0 1px 0 rgba(255,255,255,0.08) inset",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-12 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(249,115,22,0.82), transparent)",
              boxShadow: "0 0 10px rgba(249,115,22,0.34)",
            }}
          />

          <div className="relative flex h-full items-stretch px-1.5 py-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className="group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center rounded-[23px] px-0.5 active:scale-[0.96]"
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    transition: "transform 140ms ease",
                  }}
                  data-ocid={`tab.${tab.key}`}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <span
                      className="pointer-events-none absolute inset-0 rounded-[23px]"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(249,115,22,0.24) 0%, rgba(249,115,22,0.10) 58%, rgba(249,115,22,0.04) 100%)",
                        border: "1px solid rgba(249,115,22,0.34)",
                        boxShadow:
                          "0 8px 22px rgba(249,115,22,0.16), inset 0 1px 0 rgba(255,255,255,0.10)",
                      }}
                    />
                  )}

                  <span
                    className="relative z-10 flex h-8 w-10 items-center justify-center"
                    style={{
                      color: isActive ? "#fb923c" : "#8a94a8",
                      transform: isActive ? "translateY(-1px) scale(1.06)" : "translateY(1px)",
                      transition: "color 220ms ease, transform 260ms cubic-bezier(0.22,1,0.36,1)",
                      filter: isActive ? "drop-shadow(0 0 8px rgba(249,115,22,0.34))" : "none",
                    }}
                  >
                    {tab.icon}
                  </span>

                  <span
                    className="relative z-10 mt-0.5 max-w-full truncate px-0.5 text-[9px] font-extrabold leading-none tracking-[0.01em]"
                    style={{
                      color: isActive ? "#f8fafc" : "#727d91",
                      transition: "color 180ms ease",
                    }}
                  >
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

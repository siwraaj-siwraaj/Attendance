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
  { key: "contracts", label: "Contracts", icon: <FileText size={22} strokeWidth={1.9} /> },
  { key: "attendance", label: "Attendance", icon: <ClipboardList size={22} strokeWidth={1.9} /> },
  { key: "advances", label: "Advances", icon: <Wallet size={22} strokeWidth={1.9} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={22} strokeWidth={1.9} /> },
  { key: "labours", label: "Labours", icon: <Users size={22} strokeWidth={1.9} /> },
  { key: "settled", label: "Settled", icon: <CheckSquare size={22} strokeWidth={1.9} /> },
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
      <div className="mx-3 mb-2.5 pointer-events-auto sm:mx-auto sm:max-w-[700px]">
        <div
          className="relative overflow-hidden rounded-[22px] border"
          style={{
            height: 68,
            background: "#ffffff",
            borderColor: "#dce7f4",
            boxShadow: "0 12px 30px rgba(44,82,130,0.15)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.78), transparent)",
              boxShadow: "0 0 12px rgba(249,115,22,0.30)",
            }}
          />
          <div
            className="pointer-events-none absolute -right-20 -top-16 h-36 w-36 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.16) 0%, transparent 70%)" }}
          />

          <div className="relative flex h-full items-stretch gap-0.5 px-1 py-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className="group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center rounded-[17px] px-0.5"
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    transition: "transform 160ms ease",
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType === "touch") event.currentTarget.style.transform = "scale(0.95)";
                  }}
                  onPointerUp={(event) => {
                    event.currentTarget.style.transform = "scale(1)";
                  }}
                  onPointerCancel={(event) => {
                    event.currentTarget.style.transform = "scale(1)";
                  }}
                  data-ocid={`tab.${tab.key}`}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <span
                      className="pointer-events-none absolute inset-0 rounded-[17px]"
                      style={{
                        background: "#eaf2ff",
                        border: "1px solid #cfe0fb",
                        boxShadow: "0 5px 14px rgba(52,127,242,0.10)",
                      }}
                    />
                  )}

                  <span
                    className="relative z-10 flex h-7 w-10 items-center justify-center"
                    style={{
                      color: isActive ? "#347ff2" : "#8293ac",
                      transform: isActive ? "translateY(-1px) scale(1.05)" : "translateY(1px)",
                      transition: "color 220ms ease, transform 260ms cubic-bezier(0.22,1,0.36,1), filter 220ms ease",
                      filter: isActive ? "drop-shadow(0 2px 5px rgba(52,127,242,0.20))" : "none",
                    }}
                  >
                    {tab.icon}
                  </span>

                  <span
                    className="relative z-10 mt-0 max-w-full truncate px-0.5 text-[8.5px] font-extrabold leading-none tracking-[0.01em]"
                    style={{
                      color: isActive ? "#2469dc" : "#7c8da6",
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

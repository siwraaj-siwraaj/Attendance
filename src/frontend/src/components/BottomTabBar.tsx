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
      <div className="mx-3 mb-3 pointer-events-auto sm:mx-auto sm:max-w-[700px]">
        <div
          className="relative overflow-hidden rounded-[25px] border"
          style={{
            height: 76,
            background:
              "linear-gradient(135deg, rgba(13,24,42,0.985) 0%, rgba(8,15,28,0.99) 62%, rgba(18,17,20,0.985) 100%)",
            borderColor: "rgba(126,151,188,0.25)",
            boxShadow:
              "0 16px 42px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(249,115,22,0.10)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
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

          <div className="relative flex h-full items-stretch gap-0.5 px-1.5 py-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className="group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center rounded-[20px] px-0.5"
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
                      className="pointer-events-none absolute inset-0 rounded-[20px]"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.11) 58%, rgba(249,115,22,0.045) 100%)",
                        border: "1px solid rgba(249,115,22,0.36)",
                        boxShadow:
                          "0 7px 20px rgba(249,115,22,0.13), inset 0 1px 0 rgba(255,255,255,0.10)",
                      }}
                    />
                  )}

                  <span
                    className="relative z-10 flex h-8 w-10 items-center justify-center"
                    style={{
                      color: isActive ? "#fb923c" : "#8792a7",
                      transform: isActive ? "translateY(-1px) scale(1.05)" : "translateY(1px)",
                      transition: "color 220ms ease, transform 260ms cubic-bezier(0.22,1,0.36,1), filter 220ms ease",
                      filter: isActive ? "drop-shadow(0 0 8px rgba(249,115,22,0.38))" : "none",
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

import { type ReactNode, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAutoBackupReminder } from "../hooks/useAutoBackupReminder";


import { BackButtonGuard } from "./BackButtonGuard";
import BottomTabBar from "./BottomTabBar";
import SettingsPage from "./SettingsPage";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { mode, activeTab, setActiveTab, username, name, allowedTabs } = useAuth();
  const onTabChange = setActiveTab;
  useAutoBackupReminder(mode === "edit");

  const profileName = name?.trim() || username?.trim() || "User";
  const profileInitial = profileName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e]">
      <BackButtonGuard enabled={mode !== null} returnToContractsOnly={activeTab === "admin"} onReturnToSelection={() => setActiveTab("contracts")} />

      <header
        className={`${activeTab === "admin" ? "hidden" : ""} sticky top-0 z-40 overflow-hidden border-b`}
        style={{
          background: "linear-gradient(135deg, #040913 0%, #071321 45%, #0a1726 70%, #12100e 100%)",
          borderColor: "rgba(116,143,181,0.22)",
          boxShadow: "0 8px 26px rgba(0,0,0,0.24), inset 0 -1px 0 rgba(249,115,22,0.14)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.34) 0%, rgba(249,115,22,0.10) 42%, transparent 72%)" }} />
        <div className="pointer-events-none absolute right-0 bottom-0 h-14 w-64" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(249,115,22,0.08) 45%, rgba(249,115,22,0.38) 100%)", borderTopLeftRadius: "100%" }} />
        <div className="relative flex min-h-[72px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px]" style={{ background: "linear-gradient(145deg, rgba(14,22,36,0.96), rgba(18,19,24,0.96))", border: "1.5px solid rgba(249,115,22,0.72)", boxShadow: "0 0 0 1px rgba(249,115,22,0.08), 0 6px 18px rgba(0,0,0,0.30)" }}>
              <span className="text-2xl font-black" style={{ color: "#f59e0b", textShadow: "0 0 14px rgba(245,158,11,0.30)" }}>R</span>
            </div>
            <h1 className="truncate text-[24px] font-extrabold leading-none tracking-tight text-white">Rossie</h1>
          </div>

          <button type="button" onClick={() => setSettingsOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-95" style={{ background: "rgba(3,10,19,0.62)", border: "1px solid rgba(130,153,185,0.28)", boxShadow: "0 6px 18px rgba(0,0,0,0.22)" }} aria-label={`Open profile for ${profileName}`} data-ocid="header.profile_button">
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "linear-gradient(145deg, #17263c, #0c1421)", border: "1px solid rgba(249,115,22,0.58)" }}>
              <span className="text-sm font-bold text-white">{profileInitial}</span>
            </span>
          </button>
        </div>
      </header>

      {settingsOpen && <div className="flex-1 min-h-0 overflow-hidden"><SettingsPage onBack={() => setSettingsOpen(false)} /></div>}

      <main
        ref={mainRef}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement | null;
          swipeBlocked.current = settingsOpen || !!target?.closest('table, [role="dialog"], [data-pdf-preview], [data-ocid="admin_panel"], input, textarea, select, button, [data-no-tab-swipe]');
          swipeIntent.current = false;
          touchStartX.current = e.touches[0]?.clientX ?? null;
          touchStartY.current = e.touches[0]?.clientY ?? null;
          if (!swipeBlocked.current) {
            const content = swipeContentRef.current;
            if (content) {
              content.style.transition = "none";
              content.style.transform = "translate3d(0, 0, 0)";
            }
          }
        }}
        onTouchMove={(e) => {
          if (swipeBlocked.current) return;
          const startX = touchStartX.current;
          const startY = touchStartY.current;
          const touch = e.touches[0];
          if (startX === null || startY === null || !touch) return;
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          if (!swipeIntent.current) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            if (Math.abs(dx) <= Math.abs(dy) * 1.15) return;
            swipeIntent.current = true;
          }
          if (!swipeIntent.current) return;
          if (Math.abs(dx) > 0) e.preventDefault();
          const index = swipeTabs.indexOf(activeTab);
          const atEdge = (dx > 0 && index <= 0) || (dx < 0 && index >= swipeTabs.length - 1);
          const dampedDx = atEdge ? dx * 0.28 : dx * 0.92;
          const content = swipeContentRef.current;
          if (content) content.style.transform = `translate3d(${dampedDx}px, 0, 0)`;
        }}
        onTouchEnd={(e) => {
          const startX = touchStartX.current;
          const startY = touchStartY.current;
          const blocked = swipeBlocked.current;
          const horizontal = swipeIntent.current;
          touchStartX.current = null;
          touchStartY.current = null;
          swipeBlocked.current = false;
          swipeIntent.current = false;
          if (blocked || !horizontal || startX === null || startY === null || swipeTabs.length < 2) return;
          const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
          const dy = (e.changedTouches[0]?.clientY ?? startY) - startY;
          const index = swipeTabs.indexOf(activeTab);
          const nextIndex = dx < 0 ? index + 1 : index - 1;
          const valid = Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.15 && nextIndex >= 0 && nextIndex < swipeTabs.length;
          const content = swipeContentRef.current;
          if (!content) return;
          content.style.transition = "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)";
          if (!valid) {
            content.style.transform = "translate3d(0, 0, 0)";
            return;
          }
          const width = Math.max(mainRef.current?.clientWidth ?? 0, 320);
          content.style.transform = `translate3d(${dx < 0 ? -width : width}px, 0, 0)`;
          setTimeout(() => {
            onTabChange(swipeTabs[nextIndex]);
            requestAnimationFrame(() => {
              const current = swipeContentRef.current;
              if (!current) return;
              current.style.transition = "none";
              current.style.transform = `translate3d(${dx < 0 ? width : -width}px, 0, 0)`;
              requestAnimationFrame(() => {
                current.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
                current.style.transform = "translate3d(0, 0, 0)";
              });
            });
          }, 180);
        }}
        className="flex-1 min-h-0 overflow-hidden flex flex-col"
        style={{ touchAction: "pan-y" }}
      >
        <div ref={swipeContentRef} className="flex-1 min-h-0 min-w-0 flex flex-col" style={{ width: "100%", willChange: "transform" }}>
          {settingsOpen ? null : children}
        </div>
      </main>

      {mode && !settingsOpen && activeTab !== "admin" && <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />}
    </div>
  );
}

import { type ReactNode, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Bell, FileText, LogOut, Menu, Settings, ShieldCheck, Upload, UserCircle, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  markBackupDownloaded,
  useAutoBackupReminder,
} from "../hooks/useAutoBackupReminder";
import { useExportData, useImportData } from "../hooks/useBackend";
import { safeParse, safeStringify } from "../lib/bigintJson";
import type { Tab } from "../types";
import { roleBadgeClass, roleLabel } from "../types";
import { BackButtonGuard } from "./BackButtonGuard";
import BottomTabBar from "./BottomTabBar";
import SettingsPanel from "./SettingsPanel";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { mode, activeTab, setActiveTab, logout, role, username } = useAuth();
  const exportDataMutation = useExportData();
  const importDataMutation = useImportData();
  const exportData = exportDataMutation.mutateAsync;
  const importData = importDataMutation.mutateAsync;
  const onTabChange = setActiveTab;
  const [menuOpen, setMenuOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeBlocked = useRef(false);
  const swipeIntent = useRef(false);
  const swipeTabs = useAuth().allowedTabs;
  const swipeContentRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  useAutoBackupReminder(mode === "edit");

  useEffect(() => {
    setMenuOpen(false);
  }, [activeTab]);

  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = async () => {
    setMenuOpen(false);
    markBackupDownloaded();
    try {
      const data = await exportData();
      const json = safeParse<any>(data as string);
      const rows: string[][] = [];
      rows.push(["Contracts"]);
      rows.push(["ID", "Name", "Multiplier", "ContractAmount", "MachineExpenses", "BedAmount", "PaperAmount", "Settled"]);
      for (const c of json.contracts || []) rows.push([String(c.id), c.name, String(c.multiplier), String(c.contractAmount), String(c.machineExpenses), String(c.bedAmount), String(c.paperAmount), String(c.settled)]);
      rows.push([]);
      rows.push(["Labours"]);
      rows.push(["ID", "Name"]);
      for (const l of json.labours || []) rows.push([String(l.id), l.name]);
      rows.push([]);
      rows.push(["Advances"]);
      rows.push(["ID", "ContractID", "LabourID", "Amount", "Note"]);
      for (const a of json.advances || []) rows.push([String(a.id), String(a.contractId), String(a.labourId), String(a.amount), a.note]);
      rows.push([]);
      rows.push(["Attendance"]);
      rows.push(["ContractID", "LabourID", "ColumnID", "ValueKind", "Value"]);
      for (const r of json.attendance || []) {
        const kind = r.value.__kind__;
        const val = kind === "partial" ? String(r.value.partial) : kind;
        rows.push([String(r.contractId), String(r.labourId), r.columnId, kind, val]);
      }
      const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `labour-manager-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  const handleExportExcel = async () => {
    setMenuOpen(false);
    markBackupDownloaded();
    try {
      const data = await exportData();
      const json = safeParse<{
        contracts?: Array<{ id: bigint | number | string; name?: string; multiplier?: number; contractAmount?: number; bedAmount?: number; paperAmount?: number; meshAmount?: number; machineExpenses?: number; createdAt?: bigint | number | string; settled?: boolean }>;
        labours?: Array<{ id: bigint | number | string; name?: string; employeeId?: string; joinDate?: string; active?: boolean; createdAt?: bigint | number | string }>;
        advances?: Array<{ id: bigint | number | string; contractId?: bigint | number | string; labourId?: bigint | number | string; amount?: number; note?: string; createdAt?: bigint | number | string; cleared?: boolean }>;
        attendance?: Array<{ contractId?: bigint | number | string; labourId?: bigint | number | string; columnId?: string; value?: { __kind__?: string; partial?: number }; markedAt?: bigint | number | string }>;
      }>(data as string);
      const contractMap = new Map<string, string>();
      for (const c of json.contracts || []) contractMap.set(String(c.id), c.name || "");
      const labourMap = new Map<string, string>();
      for (const l of json.labours || []) labourMap.set(String(l.id), l.name || "");
      const wb = XLSX.utils.book_new();
      const contractRows = [
        ["Contract Name", "Multiplier", "Contract Amount", "Bed Amount", "Paper Amount", "Mesh Amount", "Machine Expenses", "Created Date"],
        ...(json.contracts || []).map((c) => [c.name || "", c.multiplier ?? "", c.contractAmount ?? "", c.bedAmount ?? "", c.paperAmount ?? "", c.meshAmount ?? "", c.machineExpenses ?? "", c.createdAt ? new Date(Number(BigInt(String(c.createdAt)) / BigInt(1_000_000))).toLocaleDateString() : ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contractRows), "Contracts");
      const labourRows = [
        ["Name", "Employee ID", "Join Date", "Status"],
        ...(json.labours || []).map((l) => [l.name || "", l.employeeId || "", l.joinDate || "", l.active === false ? "Inactive" : "Active"]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(labourRows), "Labours");
      const advanceRows = [
        ["Labour Name", "Contract Name", "Amount", "Note", "Date", "Cleared"],
        ...(json.advances || []).map((a) => [labourMap.get(String(a.labourId)) || String(a.labourId), contractMap.get(String(a.contractId)) || String(a.contractId), a.amount ?? "", a.note || "", a.createdAt ? new Date(Number(BigInt(String(a.createdAt)) / BigInt(1_000_000))).toLocaleDateString() : "", a.cleared ? "Yes" : "No"]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(advanceRows), "Advances");
      const attendanceRows = [
        ["Contract Name", "Labour Name", "Column Name", "Value", "Date"],
        ...(json.attendance || []).map((r) => {
          const kind = r.value?.__kind__;
          const val = kind === "partial" ? String(r.value?.partial ?? "") : kind || "";
          return [contractMap.get(String(r.contractId)) || String(r.contractId), labourMap.get(String(r.labourId)) || String(r.labourId), r.columnId || "", val, r.markedAt ? new Date(Number(BigInt(String(r.markedAt)) / BigInt(1_000_000))).toLocaleDateString() : ""];
        }),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(attendanceRows), "Attendance");
      XLSX.writeFile(wb, `rossie-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      // silently fail
    }
  };

  const handleImportCSV = (file: File) => {
    setMenuOpen(false);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result);
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        const contracts: unknown[] = [];
        const labours: unknown[] = [];
        const advances: unknown[] = [];
        const attendance: unknown[] = [];
        let section = "";
        let headerSkipped = false;
        for (const line of lines) {
          const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          if (cols.length === 1 && ["Contracts", "Labours", "Advances", "Attendance"].includes(cols[0])) { section = cols[0]; headerSkipped = false; continue; }
          if (!headerSkipped) { headerSkipped = true; continue; }
          if (section === "Contracts" && cols.length >= 8) contracts.push({ id: BigInt(cols[0]), name: cols[1], multiplier: Number(cols[2]), contractAmount: Number(cols[3]), machineExpenses: Number(cols[4]), bedAmount: Number(cols[5]), paperAmount: Number(cols[6]), settled: cols[7] === "true", workColumns: [], createdAt: BigInt(Date.now()) * BigInt(1_000_000) });
          else if (section === "Labours" && cols.length >= 2) labours.push({ id: BigInt(cols[0]), name: cols[1], createdAt: BigInt(Date.now()) * BigInt(1_000_000) });
          else if (section === "Advances" && cols.length >= 5) advances.push({ id: BigInt(cols[0]), contractId: BigInt(cols[1]), labourId: BigInt(cols[2]), amount: Number(cols[3]), note: cols[4], createdAt: BigInt(Date.now()) * BigInt(1_000_000) });
          else if (section === "Attendance" && cols.length >= 5) {
            const kind = cols[3];
            const val = kind === "present" ? { __kind__: "present", present: null } : kind === "absent" ? { __kind__: "absent", absent: null } : { __kind__: "partial", partial: Number(cols[4]) || 0 };
            attendance.push({ contractId: BigInt(cols[0]), labourId: BigInt(cols[1]), columnId: cols[2], value: val });
          }
        }
        await importData(safeStringify({ contracts, labours, advances, attendance }));
        window.location.reload();
      } catch {
        // silently fail
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const profileName = username?.trim() || "User";
  const profileInitial = profileName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e]">
      <BackButtonGuard enabled={mode !== null} onReturnToSelection={() => { logout(); setActiveTab("contracts"); }} />

      <header
        className="sticky top-0 z-40 overflow-hidden rounded-b-[34px] border-b"
        style={{
          background: "linear-gradient(135deg, #040913 0%, #071321 42%, #0a1726 67%, #12100e 100%)",
          borderColor: "rgba(116,143,181,0.28)",
          boxShadow: "0 10px 32px rgba(0,0,0,0.30), inset 0 -1px 0 rgba(249,115,22,0.16)",
          paddingTop: "max(14px, env(safe-area-inset-top))",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.48) 0%, rgba(249,115,22,0.16) 42%, transparent 72%)" }} />
        <div className="pointer-events-none absolute right-0 bottom-0 h-20 w-72" style={{ background: "linear-gradient(120deg, transparent 0%, rgba(249,115,22,0.10) 45%, rgba(249,115,22,0.52) 100%)", borderTopLeftRadius: "100%" }} />
        <div className="relative flex min-h-[118px] items-center justify-between gap-3 px-4 pb-4 pt-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px]" style={{ background: "linear-gradient(145deg, rgba(14,22,36,0.96), rgba(18,19,24,0.96))", border: "2px solid rgba(249,115,22,0.78)", boxShadow: "0 0 0 1px rgba(249,115,22,0.10), 0 8px 24px rgba(0,0,0,0.35)" }}>
              <span className="text-3xl font-black" style={{ color: "#f59e0b", textShadow: "0 0 16px rgba(245,158,11,0.35)" }}>R</span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[26px] font-extrabold leading-none tracking-tight text-white">Rossie</h1>
              <p className="mt-2 truncate text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300/80">Attendance Management</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setMenuOpen(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-white/90 transition-all active:scale-95" aria-label="Open menu" data-ocid="header.notification_button">
              <Bell size={24} strokeWidth={2} />
              <span className="absolute right-[8px] top-[7px] h-2.5 w-2.5 rounded-full" style={{ background: "#f97316", boxShadow: "0 0 8px rgba(249,115,22,0.8)" }} />
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} className="flex h-12 items-center gap-2 rounded-2xl px-2.5 text-white transition-all active:scale-[0.98]" style={{ background: "rgba(3,10,19,0.72)", border: "1px solid rgba(130,153,185,0.30)", boxShadow: "0 6px 18px rgba(0,0,0,0.25)" }} aria-label={`Open profile for ${profileName}`} data-ocid="header.profile_button">
              <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "linear-gradient(145deg, #162338, #0c1421)", border: "1px solid rgba(249,115,22,0.55)" }}>
                <UserCircle size={23} strokeWidth={1.8} />
              </span>
              <span className="hidden max-w-[120px] text-left sm:block">
                <span className="block truncate text-xs font-semibold text-white">{profileName}</span>
                {role && <span className="block truncate text-[10px] text-slate-400">{roleLabel(role)}</span>}
              </span>
              <Menu size={20} className="text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && <>
        <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        <aside className="fixed right-0 top-0 z-[70] flex h-[100dvh] w-[min(88vw,380px)] flex-col overflow-hidden border-l" style={{ background: "linear-gradient(180deg, #08111f 0%, #0a1422 45%, #080e18 100%)", borderColor: "rgba(249,115,22,0.28)", boxShadow: "-18px 0 45px rgba(0,0,0,0.42)" }} aria-label="Settings and navigation sidebar">
          <div className="relative overflow-hidden border-b px-5 pb-5 pt-[max(18px,env(safe-area-inset-top))]" style={{ borderColor: "rgba(116,143,181,0.18)" }}>
            <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.30) 0%, transparent 68%)" }} />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: "linear-gradient(145deg, #17263c, #0d1522)", border: "1px solid rgba(249,115,22,0.60)" }}>
                  <UserCircle size={28} className="text-slate-200" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">{profileName}</p>
                  {role && <p className="mt-0.5 text-xs text-orange-300/80">{roleLabel(role)}</p>}
                </div>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/5" aria-label="Close sidebar" data-ocid="sidebar.close_button"><X size={22} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Account & settings</p>
            <div className="space-y-1">
              {mode === "edit" && <button type="button" onClick={() => { setMenuOpen(false); setActiveTab("admin"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/5" data-ocid="sidebar.admin_panel">
                <ShieldCheck size={19} className="text-orange-400" />
                <span>Admin Panel</span>
              </button>}
              <button type="button" onClick={handleExportCSV} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/5" data-ocid="sidebar.export_csv">
                <FileText size={19} className="text-slate-300" />
                <span>Export CSV</span>
              </button>
              <button type="button" onClick={handleExportExcel} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/5" data-ocid="sidebar.export_excel">
                <FileText size={19} className="text-slate-300" />
                <span>Export Excel</span>
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); csvInputRef.current?.click(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/5" data-ocid="sidebar.import_csv">
                <Upload size={19} className="text-slate-300" />
                <span>Import CSV</span>
              </button>
            </div>

            <div className="my-4 border-t border-white/10" />
            <div className="flex items-center gap-2 px-3 pb-2">
              <Settings size={15} className="text-orange-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/80">Settings</p>
            </div>
            <SettingsPanel onClose={() => setMenuOpen(false)} />
          </div>

          <div className="border-t p-3 pb-[max(12px,env(safe-area-inset-bottom))]" style={{ borderColor: "rgba(116,143,181,0.18)" }}>
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10" data-ocid="sidebar.logout">
              <LogOut size={19} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </>}

      <main
        ref={mainRef}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement | null;
          swipeBlocked.current = !!target?.closest('table, [role="dialog"], [data-pdf-preview], input, textarea, select, button, [data-no-tab-swipe]');
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
          const dx = e.changedTouches[0]?.clientX - startX;
          const dy = e.changedTouches[0]?.clientY - startY;
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
        style={{ height: "calc(100dvh - 56px - 64px)", touchAction: "pan-y" }}
      >
        <div ref={swipeContentRef} className="flex-1 min-h-0 min-w-0 flex flex-col" style={{ width: "100%", willChange: "transform" }}>
          {children}
        </div>
      </main>

      {mode && <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />}
      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImportCSV(file); e.target.value = ""; }} />
    </div>
  );
}

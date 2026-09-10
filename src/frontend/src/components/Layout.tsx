import { type ReactNode, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../hooks/useAuth";
import {
  markBackupDownloaded,
  useAutoBackupReminder,
} from "../hooks/useAutoBackupReminder";
import { useExportData, useImportData } from "../hooks/useBackend";
import { safeParse, safeStringify } from "../lib/bigintJson";
import type { AppMode, Tab } from "../types";
import { roleBadgeClass, roleLabel } from "../types";
import { BackButtonGuard } from "./BackButtonGuard";
import BottomTabBar from "./BottomTabBar";
import SettingsPanel from "./SettingsPanel";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { mode, activeTab, setActiveTab, logout, role } = useAuth();
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e]">
      <BackButtonGuard enabled={mode !== null} onReturnToSelection={() => { logout(); setActiveTab("contracts"); }} />
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #050708 0%, #081515 45%, #0d2928 72%, #1b1308 100%)", borderBottom: "1px solid rgba(249,115,22,0.22)", boxShadow: "inset 0 1px 0 rgba(255,200,100,0.06), 0 4px 22px rgba(0,0,0,0.35)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(145deg, rgba(20,184,166,0.22), rgba(249,115,22,0.16))", border: "1px solid rgba(249,115,22,0.25)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.25)" }}>
            <span className="text-xl font-bold" style={{ color: "#f59e0b", textShadow: "0 0 12px rgba(245,158,11,0.35)" }}>R</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight leading-tight" style={{ background: "linear-gradient(90deg, #ffffff 0%, #fbbf24 55%, #14b8a6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Rossie</h1>
            <p className="text-[10px] tracking-[0.16em] uppercase text-teal-200/60">Attendance Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role && <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeClass(role)}`} data-ocid="header.role_badge">{roleLabel(role)}</span>}
          {mode === "edit" && <div className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl transition-all active:scale-95" style={{ background: menuOpen ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.06)", border: menuOpen ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(255,255,255,0.1)", boxShadow: menuOpen ? "0 0 14px rgba(249,115,22,0.12)" : "none" }} aria-label="Menu" data-ocid="header.menu_button">☰</button>
            {menuOpen && <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} onKeyDown={(e) => { if (e.key === "Escape") setMenuOpen(false); }} tabIndex={-1} role="presentation" />
              <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl overflow-hidden" style={{ background: "rgba(13,18,20,0.97)", border: "1px solid rgba(249,115,22,0.2)", boxShadow: "0 14px 35px rgba(0,0,0,0.45), 0 0 20px rgba(249,115,22,0.06)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") setMenuOpen(false); }} role="presentation" tabIndex={-1}>
                <div className="py-1">
                  <button type="button" onClick={handleExportCSV} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-orange-500/10 transition-colors" data-ocid="header.export_csv">Export CSV</button>
                  <button type="button" onClick={handleExportExcel} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-orange-500/10 transition-colors" data-ocid="header.export_excel">Export Excel</button>
                  <button type="button" onClick={() => { setMenuOpen(false); csvInputRef.current?.click(); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-orange-500/10 transition-colors" data-ocid="header.import_csv">Import CSV</button>
                  <div className="border-t border-white/10 my-1" />
                  <button type="button" onClick={() => { setMenuOpen(false); setActiveTab("admin"); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-orange-500/10 transition-colors" data-ocid="header.admin_panel">Admin Panel</button>
                  <div className="border-t border-white/10 my-1" />
                  <SettingsPanel onClose={() => setMenuOpen(false)} />
                  <div className="border-t border-white/10 my-1" />
                  <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors" data-ocid="header.logout">Logout</button>
                </div>
              </div>
            </>}
          </div>}
        </div>
      </header>

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
        <div
          ref={swipeContentRef}
          className="flex-1 min-h-0 min-w-0 flex flex-col"
          style={{ width: "100%", willChange: "transform" }}
        >
          {children}
        </div>
      </main>

      {mode && <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />}
      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImportCSV(file); e.target.value = ""; }} />
    </div>
  );
}

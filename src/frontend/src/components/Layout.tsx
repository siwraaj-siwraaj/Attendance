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
  const swipeTabs = useAuth().allowedTabs;

  useAutoBackupReminder(mode === "edit");

  // Auto-close settings when switching tabs
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeTab change is intentionally the trigger
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

      // Contracts
      rows.push(["Contracts"]);
      rows.push([
        "ID",
        "Name",
        "Multiplier",
        "ContractAmount",
        "MachineExpenses",
        "BedAmount",
        "PaperAmount",
        "Settled",
      ]);
      for (const c of json.contracts || []) {
        rows.push([
          String(c.id),
          c.name,
          String(c.multiplier),
          String(c.contractAmount),
          String(c.machineExpenses),
          String(c.bedAmount),
          String(c.paperAmount),
          String(c.settled),
        ]);
      }
      rows.push([]);

      // Labours
      rows.push(["Labours"]);
      rows.push(["ID", "Name"]);
      for (const l of json.labours || []) {
        rows.push([String(l.id), l.name]);
      }
      rows.push([]);

      // Advances
      rows.push(["Advances"]);
      rows.push(["ID", "ContractID", "LabourID", "Amount", "Note"]);
      for (const a of json.advances || []) {
        rows.push([
          String(a.id),
          String(a.contractId),
          String(a.labourId),
          String(a.amount),
          a.note,
        ]);
      }
      rows.push([]);

      // Attendance
      rows.push(["Attendance"]);
      rows.push(["ContractID", "LabourID", "ColumnID", "ValueKind", "Value"]);
      for (const r of json.attendance || []) {
        const kind = r.value.__kind__;
        const val = kind === "partial" ? String(r.value.partial) : kind;
        rows.push([
          String(r.contractId),
          String(r.labourId),
          r.columnId,
          kind,
          val,
        ]);
      }

      const csv = rows
        .map((r) =>
          r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
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
        contracts?: Array<{
          id: bigint | number | string;
          name?: string;
          multiplier?: number;
          contractAmount?: number;
          bedAmount?: number;
          paperAmount?: number;
          meshAmount?: number;
          machineExpenses?: number;
          createdAt?: bigint | number | string;
          settled?: boolean;
        }>;
        labours?: Array<{
          id: bigint | number | string;
          name?: string;
          employeeId?: string;
          joinDate?: string;
          active?: boolean;
          createdAt?: bigint | number | string;
        }>;
        advances?: Array<{
          id: bigint | number | string;
          contractId?: bigint | number | string;
          labourId?: bigint | number | string;
          amount?: number;
          note?: string;
          createdAt?: bigint | number | string;
          cleared?: boolean;
        }>;
        attendance?: Array<{
          contractId?: bigint | number | string;
          labourId?: bigint | number | string;
          columnId?: string;
          value?: { __kind__?: string; partial?: number };
          markedAt?: bigint | number | string;
        }>;
      }>(data as string);

      // Build lookup maps
      const contractMap = new Map<string, string>();
      for (const c of json.contracts || []) {
        contractMap.set(String(c.id), c.name || "");
      }
      const labourMap = new Map<string, string>();
      for (const l of json.labours || []) {
        labourMap.set(String(l.id), l.name || "");
      }

      const wb = XLSX.utils.book_new();

      // Sheet 1: Contracts
      const contractRows = [
        [
          "Contract Name",
          "Multiplier",
          "Contract Amount",
          "Bed Amount",
          "Paper Amount",
          "Mesh Amount",
          "Machine Expenses",
          "Created Date",
        ],
        ...(json.contracts || []).map((c) => [
          c.name || "",
          c.multiplier ?? "",
          c.contractAmount ?? "",
          c.bedAmount ?? "",
          c.paperAmount ?? "",
          c.meshAmount ?? "",
          c.machineExpenses ?? "",
          c.createdAt
            ? new Date(
                Number(BigInt(String(c.createdAt)) / BigInt(1_000_000)),
              ).toLocaleDateString()
            : "",
        ]),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(contractRows),
        "Contracts",
      );

      // Sheet 2: Labours
      const labourRows = [
        ["Name", "Employee ID", "Join Date", "Status"],
        ...(json.labours || []).map((l) => [
          l.name || "",
          l.employeeId || "",
          l.joinDate || "",
          l.active === false ? "Inactive" : "Active",
        ]),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(labourRows),
        "Labours",
      );

      // Sheet 3: Advances
      const advanceRows = [
        ["Labour Name", "Contract Name", "Amount", "Note", "Date", "Cleared"],
        ...(json.advances || []).map((a) => [
          labourMap.get(String(a.labourId)) || String(a.labourId),
          contractMap.get(String(a.contractId)) || String(a.contractId),
          a.amount ?? "",
          a.note || "",
          a.createdAt
            ? new Date(
                Number(BigInt(String(a.createdAt)) / BigInt(1_000_000)),
              ).toLocaleDateString()
            : "",
          a.cleared ? "Yes" : "No",
        ]),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(advanceRows),
        "Advances",
      );

      // Sheet 4: Attendance
      const attendanceRows = [
        ["Contract Name", "Labour Name", "Column Name", "Value", "Date"],
        ...(json.attendance || []).map((r) => {
          const kind = r.value?.__kind__;
          const val =
            kind === "partial" ? String(r.value?.partial ?? "") : kind || "";
          return [
            contractMap.get(String(r.contractId)) || String(r.contractId),
            labourMap.get(String(r.labourId)) || String(r.labourId),
            r.columnId || "",
            val,
            r.markedAt
              ? new Date(
                  Number(BigInt(String(r.markedAt)) / BigInt(1_000_000)),
                ).toLocaleDateString()
              : "",
          ];
        }),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(attendanceRows),
        "Attendance",
      );

      XLSX.writeFile(
        wb,
        `rossie-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch {
      // silently fail
    }
  };

  // JSON backup/restore removed per requirements

  const handleImportCSV = (file: File) => {
    setMenuOpen(false);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result);
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const contracts: unknown[] = [];
        const labours: unknown[] = [];
        const advances: unknown[] = [];
        const attendance: unknown[] = [];
        let section = "";
        let headerSkipped = false;

        for (const line of lines) {
          const cols = line
            .split(",")
            .map((c) => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          if (
            cols.length === 1 &&
            ["Contracts", "Labours", "Advances", "Attendance"].includes(cols[0])
          ) {
            section = cols[0];
            headerSkipped = false;
            continue;
          }
          if (!headerSkipped) {
            headerSkipped = true;
            continue;
          }
          if (section === "Contracts" && cols.length >= 8) {
            contracts.push({
              id: BigInt(cols[0]),
              name: cols[1],
              multiplier: Number(cols[2]),
              contractAmount: Number(cols[3]),
              machineExpenses: Number(cols[4]),
              bedAmount: Number(cols[5]),
              paperAmount: Number(cols[6]),
              settled: cols[7] === "true",
              workColumns: [],
              createdAt: BigInt(Date.now()) * BigInt(1_000_000),
            });
          } else if (section === "Labours" && cols.length >= 2) {
            labours.push({
              id: BigInt(cols[0]),
              name: cols[1],
              createdAt: BigInt(Date.now()) * BigInt(1_000_000),
            });
          } else if (section === "Advances" && cols.length >= 5) {
            advances.push({
              id: BigInt(cols[0]),
              contractId: BigInt(cols[1]),
              labourId: BigInt(cols[2]),
              amount: Number(cols[3]),
              note: cols[4],
              createdAt: BigInt(Date.now()) * BigInt(1_000_000),
            });
          } else if (section === "Attendance" && cols.length >= 5) {
            const kind = cols[3];
            const val =
              kind === "present"
                ? { __kind__: "present", present: null }
                : kind === "absent"
                  ? { __kind__: "absent", absent: null }
                  : { __kind__: "partial", partial: Number(cols[4]) || 0 };
            attendance.push({
              contractId: BigInt(cols[0]),
              labourId: BigInt(cols[1]),
              columnId: cols[2],
              value: val,
            });
          }
        }

        const payload = safeStringify({
          contracts,
          labours,
          advances,
          attendance,
        });
        await importData(payload);
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
      <BackButtonGuard
        enabled={mode !== null}
        onReturnToSelection={() => {
          logout();
          setActiveTab("contracts");
        }}
      />
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #0a2a2a 35%, #0d4040 55%, #1a1800 80%, #2a0a00 100%)",
          borderBottom: "1px solid rgba(249,115,22,0.25)",
          boxShadow:
            "0 0 0 0 transparent, inset 0 1px 0 rgba(255,200,100,0.08), 0 2px 24px rgba(249,115,22,0.18)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1
          className="font-display text-lg font-bold tracking-tight"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, #fb923c 50%, #14b8a6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Rossie
        </h1>
        {role && (
          <span
            className={`ml-3 px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeClass(
              role,
            )}`}
            data-ocid="header.role_badge"
          >
            {roleLabel(role)}
          </span>
        )}
        {mode === "edit" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="text-white text-xl p-1 hover:text-[#f97316] transition-colors"
              aria-label="Menu"
              data-ocid="header.menu_button"
            >
              ☰
            </button>
            {/* Compact dropdown menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setMenuOpen(false);
                  }}
                  tabIndex={-1}
                  role="presentation"
                />
                <div
                  className="absolute right-0 top-10 z-40 w-56 rounded-xl border border-orange-500/20 shadow-2xl overflow-hidden"
                  style={{
                    background: "rgba(13,18,32,0.95)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setMenuOpen(false);
                  }}
                  role="presentation"
                  tabIndex={-1}
                >
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                      data-ocid="header.export_csv"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                      data-ocid="header.export_excel"
                    >
                      Export Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        csvInputRef.current?.click();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                      data-ocid="header.import_csv"
                    >
                      Import CSV
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setActiveTab("admin");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                      data-ocid="header.admin_panel"
                    >
                      Admin Panel
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <SettingsPanel onClose={() => setMenuOpen(false)} />
                    <div className="border-t border-white/10 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
                      data-ocid="header.logout"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main content — fills viewport between header and tab bar */}
      <main
        onTouchStart={(e) => {
              const target = e.target as HTMLElement | null;
              swipeBlocked.current = !!target?.closest(
                'table, [role="dialog"], [data-pdf-preview], input, textarea, select, button, [data-no-tab-swipe]'
              );

              touchStartX.current = e.touches[0]?.clientX ?? null;
              touchStartY.current = e.touches[0]?.clientY ?? null;
            }}
        onTouchEnd={(e) => {
          const startX = touchStartX.current;
          const startY = touchStartY.current;
          touchStartX.current = null;
          touchStartY.current = null;
            if (swipeBlocked.current) {
              swipeBlocked.current = false;
              touchStartX.current = null;
              touchStartY.current = null;
              return;
            }
            
          if (startX === null || startY === null || swipeTabs.length < 2) return;
          const dx = e.changedTouches[0]?.clientX - startX;
          const dy = e.changedTouches[0]?.clientY - startY;
          if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
          const index = swipeTabs.indexOf(activeTab);
          if (index < 0) return;
          const nextIndex = dx < 0 ? index + 1 : index - 1;
          if (nextIndex >= 0 && nextIndex < swipeTabs.length) onTabChange(swipeTabs[nextIndex]);
        }}
        className="flex-1 overflow-hidden flex flex-col"
        style={{ height: "calc(100dvh - 56px - 64px)" }}
      >
        {children}
      </main>

      {/* Bottom tab bar */}
      {mode && <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />}

      {/* Hidden file inputs */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportCSV(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

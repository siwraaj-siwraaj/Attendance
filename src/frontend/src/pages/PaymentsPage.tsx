import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAdvances,
  useAllAttendance,
  useContracts,
  useLabours,
} from "../hooks/useBackend";

import {
  BarChart3,
  Calculator,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileText,
  Search,
  X,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { safeParse, safeStringify } from "../lib/bigintJson";
import { type AttendanceValue, getAttendanceDisplay } from "../types";
import html2pdf from "html2pdf.js";
import { registerPlugin } from "@capacitor/core";

const AttendancePdf = registerPlugin<{
  savePdf(options: { html: string; fileName: string }): Promise<{ uri: string; fileName: string }>;
  openPdf(options: { uri: string }): Promise<void>;
}>("AttendancePdf");

function calculateLabourSalary(
  contract: any,
  allRecords: any[],
  labourId: bigint,
): number {
  let total = 0;
  const workTypes = ["bed", "paper", "mesh", "custom"];
  for (const workType of workTypes) {
    const cols = contract.workColumns.filter(
      (c: any) => c.workType === workType,
    );
    if (cols.length === 0) continue;
    const workTypeAmount =
      workType === "bed"
        ? contract.bedAmount
        : workType === "paper"
          ? contract.paperAmount
          : workType === "mesh"
            ? contract.meshAmount
            : 0;
    if (workTypeAmount === 0) continue;
    const colIds = new Set(cols.map((c: any) => c.id));
    const relevantRecords = allRecords.filter(
      (r: any) => r.contractId === contract.id && colIds.has(r.columnId),
    );
    const totalSum = relevantRecords.reduce((sum: number, r: any) => {
      if (r.value.__kind__ === "present") return sum + 1;
      if (r.value.__kind__ === "partial") return sum + r.value.partial;
      return sum;
    }, 0);
    if (totalSum === 0) continue;
    const labourRecords = relevantRecords.filter(
      (r: any) => r.labourId === labourId,
    );
    const labourSum = labourRecords.reduce((sum: number, r: any) => {
      if (r.value.__kind__ === "present") return sum + 1;
      if (r.value.__kind__ === "partial") return sum + r.value.partial;
      return sum;
    }, 0);
    total += (labourSum / totalSum) * workTypeAmount;
  }
  return total;
}

interface PaymentsPageProps {
  selectedContractIds: Set<string>;
  setSelectedContractIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  paymentData: any[] | null;
  setPaymentData: React.Dispatch<React.SetStateAction<any[] | null>>;
}

/* ============================================================
   Professional report CSS — mirrors the .report classes and
   report tokens from index.css. Inlined into the print window
   because window.print HTML does not inherit the app stylesheet.
   Always light so it prints cleanly on white paper.
   ============================================================ */
const REPORT_CSS = `
  * { box-sizing: border-box; }
  @page { size: A4 portrait; margin: 8mm; }
  html, body { width: 100%; min-width: 0; margin: 0; padding: 0; background: #ffffff; color: #27313d; font-family: 'Figtree', 'Space Grotesk', -apple-system, sans-serif; font-size: 10.5pt; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report { width: 100%; max-width: none; margin: 0; background: #ffffff; color: #27313d; font-family: 'Figtree', 'Space Grotesk', -apple-system, sans-serif; font-size: 10.5pt; line-height: 1.35; border-radius: 0; box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report-header { background: #26384f; color: #f7f8fa; padding: 8mm 7mm 6mm; border-radius: 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 5mm; }
  .report-title { font-family: 'Space Grotesk', sans-serif; font-size: 18pt; font-weight: 700; letter-spacing: -0.01em; margin: 0; line-height: 1.15; }
  .report-subtitle { font-size: 9pt; opacity: 0.85; margin-top: 1.5mm; font-weight: 500; }
  .report-brand { font-family: 'Space Grotesk', sans-serif; font-size: 10pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-align: right; opacity: 0.9; }
  .report-meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4mm; padding: 5mm 7mm; border-bottom: 1px solid #e2e5e9; background: #f1f3f5; }
  .report-meta-label { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #68727e; margin-bottom: 1mm; }
  .report-meta-value { font-size: 9.5pt; font-weight: 700; color: #27313d; overflow-wrap: anywhere; }
  .report-body { padding: 5mm 7mm 7mm; }
  .report-section { font-family: 'Space Grotesk', sans-serif; font-size: 11pt; font-weight: 700; color: #27313d; margin: 4mm 0 2.5mm; padding-bottom: 1.5mm; border-bottom: 1px solid #26384f; }
  .report-section:first-child { margin-top: 0; }
  .report-table { width: 100%; table-layout: auto; border-collapse: collapse; font-size: 8.5pt; }
  .report-table th { background: #304765; color: #f7f8fa; font-weight: 700; text-align: left; padding: 2.2mm 2.5mm; border: 1px solid #304765; white-space: nowrap; }
  .report-table td { padding: 1.8mm 2.5mm; border: 1px solid #d2d7dd; vertical-align: middle; }
  .report-table tbody tr:nth-child(even) { background: #f1f3f5; }
  .report-table .num, .report-table td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .report-table .center { text-align: center; }
  /* Strong vertical boundaries make each contract group easy to identify in the PDF. */
  .report-table .contract-boundary-left { border-left: 3px solid #26384f !important; }
  .report-table .contract-boundary-right { border-right: 3px solid #26384f !important; }
  .report-total-row td { background: #c47716; color: #ffffff; font-weight: 700; border-color: #c47716; }
  .report-total-label { text-align: right; text-transform: uppercase; letter-spacing: 0.04em; font-size: 8pt; }
  .report-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4mm; margin-top: 5mm; }
  .report-summary-item { background: #f1f3f5; border: 1px solid #d2d7dd; border-radius: 1.5mm; padding: 3mm; }
  .report-summary-label { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #68727e; }
  .report-summary-value { font-family: 'Space Grotesk', sans-serif; font-size: 11pt; font-weight: 700; color: #c47716; margin-top: 1mm; }
  .report-footer { padding: 4mm 7mm; border-top: 1px solid #e2e5e9; font-size: 7.5pt; color: #68727e; display: flex; justify-content: space-between; gap: 4mm; }
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    body { background: #ffffff !important; }
    .report { box-shadow: none; border-radius: 0; max-width: none; }
    .report-table tr, .report-section, .report-summary-item, .report-total-row { break-inside: avoid; page-break-inside: avoid; }
    .report-table thead { display: table-header-group; }
  }

`;

async function openPrintWindow(title: string, bodyHTML: string) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = bodyHTML;
  wrapper.style.position = "fixed";
  wrapper.style.left = "-100000px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.background = "#ffffff";
  document.body.appendChild(wrapper);

  try {
    const report = wrapper.querySelector(".report") as HTMLElement | null;
    if (!report) throw new Error("Report could not be created");

    const filename = `${title.replace(/[^a-z0-9_-]+/gi, "_")}.pdf`;
const isNative =
  typeof window !== "undefined" &&
  "Capacitor" in window &&
  (window as any).Capacitor?.isNativePlatform?.();
    if (isNative) {
      const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        ${REPORT_CSS}
        @media print {
          .report { width: 100%; max-width: none; margin: 0; }
        }
      </style>
    </head>
    <body>
      ${report.outerHTML}
    </body>
  </html>
`;
      const saved = await AttendancePdf.savePdf({
        html,
        fileName: filename,
      });

      console.info("PDF saved to Downloads:", saved.uri);
      await AttendancePdf.openPdf({ uri: saved.uri });
      return;
    }
      const pdf = await html2pdf()
  .set({
    margin: 8,
    filename,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
  })
  .from(report)
  .outputPdf("datauristring");

const link = document.createElement("a");
link.href = pdf;
link.download = filename;
link.click();
  } catch (error) {
    console.error("PDF generation failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : (error as any)?.message || JSON.stringify(error);
    alert(`Unable to create the PDF.\\n\\n${message || "Unknown PDF error"}`);
  } finally {
    wrapper.remove();
  }
}

export default function PaymentsPage({
  selectedContractIds,
  setSelectedContractIds,
  paymentData,
  setPaymentData,
}: PaymentsPageProps) {
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const { data: labours = [], isLoading: laboursLoading } = useLabours();
  const { data: allAttendance = [] } = useAllAttendance();
  const { data: advances = [] } = useAdvances();

  // Props are lifted to App.tsx to persist across tab switches
  const [contractDropdownOpen, setContractDropdownOpen] = useState(false);
  const [contractSearch, setContractSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showPaymentPdfPreview, setShowPaymentPdfPreview] = useState(false);
  const [paymentPreviewHTML, setPaymentPreviewHTML] = useState("");
  const [paymentPreviewTitle, setPaymentPreviewTitle] = useState<"Payment Sheet" | "Attendance Sheet">("Payment Sheet");
  const paymentsScrollRef = useRef<HTMLDivElement>(null);
  const [overviewMode, setOverviewMode] = useState<"oneByOne" | "multiSelect">(
    "oneByOne",
  );
  const [overviewIndex, setOverviewIndex] = useState(0);
  const [selectedOverviewLabours, setSelectedOverviewLabours] = useState<
    Set<string>
  >(new Set());
  const [excludeAdvances, setExcludeAdvances] = useState(false);
  const [showAdvanceBreakdown, setShowAdvanceBreakdown] = useState(false);

  // Reset search query whenever the dropdown closes
  useEffect(() => {
    if (!contractDropdownOpen) setContractSearch("");
  }, [contractDropdownOpen]);

  // Close the contract dropdown on Escape
  useEffect(() => {
    if (!contractDropdownOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setContractDropdownOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return (
    <div className="flex h-full min-h-0 flex-col bg-[#080d18] text-white">
      {/* Payment header */}
      <div className="shrink-0 border-b border-white/10 bg-[#0b1220] px-4 pb-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">
              Payroll
            </p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight">Payments</h1>
            <p className="mt-1 text-xs text-white/45">
              Select contracts, calculate wages and review what is payable.
            </p>
          </div>
          <button
            type="button"
            onClick={calculatePayments}
            disabled={selectedContractIds.size === 0}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
            data-ocid="payments.calculate_button"
          >
            <Calculator size={17} />
            Calculate
          </button>
        </div>

        {/* Contract picker */}
        <div className="relative mt-4" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setContractDropdownOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111a2b] px-4 py-3.5 text-left transition hover:border-orange-500/50"
            data-ocid="payments.contract_select_trigger"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <CheckCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                  Contracts
                </p>
                <p className="truncate text-sm font-semibold text-white/90">
                  {selectedContractIds.size === 0
                    ? "Choose contracts for payroll"
                    : `${selectedContractIds.size} contract${selectedContractIds.size === 1 ? "" : "s"} selected`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {selectedContractIds.size > 0 && (
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-black">
                  {selectedContractIds.size}
                </span>
              )}
              <ChevronDown
                size={18}
                className={`text-white/45 transition-transform ${contractDropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {contractDropdownOpen && (
            <div
              className="absolute left-0 right-0 top-full z-[300] mt-2 flex max-h-[55vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1525] shadow-2xl shadow-black/50"
              data-ocid="payments.contract_select_dropdown"
            >
              {unsettledContracts.length === 0 ? (
                <p className="py-10 text-center text-sm text-white/35">No active contracts</p>
              ) : (
                <>
                  <div className="relative border-b border-white/10 p-3">
                    <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      value={contractSearch}
                      onChange={(e) => setContractSearch(e.target.value)}
                      placeholder="Search contracts..."
                      className="w-full rounded-xl border border-white/10 bg-[#080d18] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
                      data-ocid="payments.contract_search_input"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        allContractsSelected
                          ? setSelectedContractIds(new Set())
                          : setSelectedContractIds(
                              new Set(unsettledContracts.map((c: any) => c.id.toString())),
                            )
                      }
                      className="text-xs font-bold text-orange-400"
                      data-ocid="payments.contract_select_all"
                    >
                      {allContractsSelected ? "Clear all" : "Select all"}
                    </button>
                    <span className="text-[11px] text-white/30">
                      {filteredDropdownContracts.length} of {unsettledContracts.length}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {filteredDropdownContracts.length === 0 ? (
                      <p className="py-10 text-center text-sm text-white/30">
                        No contracts match “{contractSearch}”
                      </p>
                    ) : (
                      filteredDropdownContracts.map((c: any, idx: number) => {
                        const id = c.id.toString();
                        const checked = selectedContractIds.has(id);
                        return (
                          <label
                            key={id}
                            className={`flex cursor-pointer items-center gap-3 border-b border-white/5 px-4 py-3 transition ${checked ? "bg-orange-500/10" : "hover:bg-white/[0.03]"}`}
                            data-ocid={`payments.contract_option.${idx + 1}`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => toggleContractSelection(id)}
                            />
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-orange-500 bg-orange-500" : "border-white/20"}`}>
                              {checked && <CheckCheck size={13} />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/85">
                              {c.name}
                            </span>
                            <span className="shrink-0 text-xs font-semibold text-white/35">
                              ₹{c.contractAmount?.toLocaleString("en-IN") ?? "—"}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-4">
        {!paymentData ? (
          <div className="flex min-h-[55vh] items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d1525] p-7 text-center shadow-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                <Calculator size={30} />
              </div>
              <h2 className="mt-5 text-xl font-black">Ready for payroll</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Select one or more active contracts above, then calculate to build the payment sheet.
              </p>
              <button
                type="button"
                onClick={calculatePayments}
                disabled={selectedContractIds.size === 0}
                className="mt-6 w-full rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-30"
              >
                Select contracts & calculate
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Gross salary</p>
                <p className="mt-2 text-xl font-black text-cyan-300">
                  {fmt(visiblePaymentData.reduce((s: number, r: any) => s + r.totalNetSalary, 0))}
                </p>
              </div>
              <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-300/60">Advances</p>
                <p className="mt-2 text-xl font-black text-red-300">
                  {fmt(visiblePaymentData.reduce((s: number, r: any) => s + r.totalAdvances, 0))}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-orange-500/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300/70">Total payable</p>
                    <p className="mt-1 text-3xl font-black text-orange-300">
                      {fmt(visiblePaymentData.reduce((s: number, r: any) => s + r.amountPayable, 0))}
                    </p>
                  </div>
                  <div className="rounded-xl bg-orange-500/15 p-3 text-orange-300">
                    <BarChart3 size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button type="button" onClick={downloadPaymentPDF} className="flex flex-col items-center gap-1.5 rounded-2xl border border-orange-500/30 bg-orange-500/5 px-2 py-3 text-[11px] font-bold text-orange-300 active:scale-95" data-ocid="payments.download_payment_sheet">
                <FileText size={17} /> Payment
              </button>
              <button type="button" onClick={downloadAttendancePDF} className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-[11px] font-bold text-white/60 active:scale-95" data-ocid="payments.download_attendance_sheet">
                <FileDown size={17} /> Attendance
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverview(true);
                  setOverviewIndex(0);
                  setSelectedOverviewLabours(new Set());
                }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-2 py-3 text-[11px] font-bold text-cyan-300 active:scale-95"
                data-ocid="payments.overview_button"
              >
                <BarChart3 size={17} /> Overview
              </button>
            </div>

            {/* Labour payment cards */}
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Labour payments</h2>
                  <p className="text-xs text-white/35">{visiblePaymentData.length} labours with calculated amounts</p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  {selectedContracts.length} contract{selectedContracts.length === 1 ? "" : "s"}
                </span>
              </div>

              {visiblePaymentData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">
                  No payable labour records for the selected contracts.
                </div>
              ) : (
                <div className="space-y-3">
                  {visiblePaymentData.map((row: any) => (
                    <div key={row.labour.id.toString()} className="rounded-2xl border border-white/10 bg-[#0d1525] p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-black text-orange-300">
                            {(row.labour.name || "?").trim().split(/\s+/).map((x: string) => x[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-white">{row.labour.name}</p>
                            <p className="text-[11px] text-white/35">Labour payment summary</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300/60">Payable</p>
                          <p className="text-xl font-black text-orange-300">{fmt(row.amountPayable)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {selectedContracts.map((c: any) => (
                          <div key={c.id.toString()} className="rounded-xl bg-white/[0.035] px-3 py-2.5">
                            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white/30">{c.name}</p>
                            <p className="mt-1 text-sm font-bold text-white/80">{fmt(row.contractSalaries[c.id.toString()] || 0)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                        <span className="text-white/40">Gross salary</span>
                        <span className="font-bold text-cyan-300">{fmt(row.totalNetSalary)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-white/40">Advances</span>
                        <span className="font-bold text-red-300">− {fmt(row.totalAdvances)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Payment overview */}
      {showOverview && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-3">
          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0c1423] shadow-2xl">
            <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-orange-500 to-orange-600 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">Payroll</p>
                <h2 className="mt-1 text-2xl font-black text-white">Payment Overview</h2>
                <p className="mt-1 text-xs text-white/70">
                  {overviewMode === "oneByOne"
                    ? overviewData.length ? `${overviewIndex + 1} of ${overviewData.length}` : "No labour records"
                    : `${selectedOverviewLabours.size} selected`}
                </p>
              </div>
              <button type="button" onClick={() => setShowOverview(false)} className="rounded-xl bg-white/15 p-2 text-white" data-ocid="payments.overview.close_button">
                <X size={18} />
              </button>
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="text-sm text-white/70">Deduct advances</span>
              <button
                type="button"
                onClick={() => setExcludeAdvances((v) => !v)}
                className={`relative h-6 w-11 rounded-full ${excludeAdvances ? "bg-white/15" : "bg-orange-500"}`}
                aria-label={excludeAdvances ? "Advances excluded" : "Advances included"}
                data-ocid="payments.overview.include_advances_toggle"
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${excludeAdvances ? "left-0.5" : "left-[22px]"}`} />
              </button>
            </div>

            <div className="flex shrink-0 gap-2 border-b border-white/10 p-3">
              <button type="button" onClick={() => setOverviewMode("oneByOne")} className={`flex-1 rounded-xl py-2 text-sm font-bold ${overviewMode === "oneByOne" ? "bg-orange-500 text-white" : "bg-white/5 text-white/45"}`} data-ocid="payments.overview.mode_onebyone">One by One</button>
              <button type="button" onClick={() => setOverviewMode("multiSelect")} className={`flex-1 rounded-xl py-2 text-sm font-bold ${overviewMode === "multiSelect" ? "bg-orange-500 text-white" : "bg-white/5 text-white/45"}`} data-ocid="payments.overview.mode_multiselect">Multi Select</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {overviewMode === "oneByOne" && overviewData.length > 0 && (
                <div className="space-y-4 p-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/35">Labour</p>
                    <h3 className="mt-1 text-3xl font-black">{overviewData[overviewIndex]?.labour.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-cyan-400/5 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/60">Gross</p>
                      <p className="mt-1 text-lg font-black text-cyan-300">{fmt(overviewData[overviewIndex]?.totalNetSalary || 0)}</p>
                    </div>
                    <div className="rounded-2xl bg-red-400/5 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-300/60">Advances</p>
                      <p className="mt-1 text-lg font-black text-red-300">{fmt(overviewData[overviewIndex]?.totalAdvances || 0)}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-300/70">Net pay</p>
                    <p className="mt-1 text-4xl font-black text-orange-300">
                      {fmt(excludeAdvances ? overviewData[overviewIndex]?.totalNetSalary || 0 : overviewData[overviewIndex]?.amountPayable || 0)}
                    </p>
                  </div>
                </div>
              )}

              {overviewMode === "multiSelect" && (
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-white/40">SELECT LABOURS</span>
                    <button type="button" onClick={() => setSelectedOverviewLabours(new Set())} className="text-xs font-bold text-orange-400" data-ocid="payments.overview.deselect_all">Clear</button>
                  </div>
                  {overviewData.map((row: any) => {
                    const id = row.labour.id.toString();
                    const checked = selectedOverviewLabours.has(id);
                    return (
                      <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 ${checked ? "bg-orange-500/10" : "hover:bg-white/5"}`}>
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => setSelectedOverviewLabours((prev) => { const next = new Set(prev); checked ? next.delete(id) : next.add(id); return next; })} />
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${checked ? "border-orange-500 bg-orange-500" : "border-white/20"}`}>
                          {checked && <CheckCheck size={13} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.labour.name}</span>
                        <span className="text-sm font-bold text-orange-300">{fmt(row.amountPayable)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-white/10 p-4">
              {overviewMode === "oneByOne" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOverviewIndex((i) => Math.max(0, i - 1))} disabled={overviewIndex === 0} className="rounded-xl bg-white/5 py-3 text-sm font-bold disabled:opacity-25" data-ocid="payments.overview.prev_button">Previous</button>
                  <button type="button" onClick={() => setOverviewIndex((i) => Math.min(overviewData.length - 1, i + 1))} disabled={overviewIndex >= overviewData.length - 1} className="rounded-xl bg-orange-500 py-3 text-sm font-bold disabled:opacity-25" data-ocid="payments.overview.next_button">Next</button>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/35">Selected labour</p>
                  <p className="mt-1 text-3xl font-black text-orange-300">
                    {fmt(excludeAdvances ? overviewTotals.netSalary : overviewTotals.payable)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF preview */}
      {showPaymentPdfPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3">
          <div className="flex h-full max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex-1 overflow-auto p-2">
              <div dangerouslySetInnerHTML={{ __html: `<style>${REPORT_CSS}</style>${paymentPreviewHTML}` }} />
            </div>
            <div className="flex shrink-0 gap-3 border-t bg-white p-4">
              <button type="button" onClick={() => setShowPaymentPdfPreview(false)} className="flex-1 rounded-xl bg-gray-500 px-4 py-3 font-bold text-white">Close</button>
              <button type="button" onClick={async () => { await openPrintWindow(paymentPreviewTitle, paymentPreviewHTML); setShowPaymentPdfPreview(false); }} className="flex-1 rounded-xl bg-orange-500 px-4 py-3 font-bold text-white">Save PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

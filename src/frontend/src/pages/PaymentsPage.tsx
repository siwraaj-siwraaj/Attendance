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
import { PdfGenerator } from "@capgo/capacitor-pdf-generator";
import { FileSharer } from "@capgo/capacitor-file-sharer";
import { FileOpener } from "@capacitor-community/file-opener";

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
  body { margin: 0; background: #fbfcfd; color: #27313d; font-family: 'Figtree', 'Space Grotesk', -apple-system, sans-serif; font-size: 13px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report { background: #fbfcfd; color: #27313d; font-family: 'Figtree', 'Space Grotesk', -apple-system, sans-serif; font-size: 13px; line-height: 1.5; max-width: 820px; margin: 0 auto; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(15,23,42,0.08); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report-header { background: #26384f; color: #f7f8fa; padding: 20px 24px; border-radius: 0.5rem 0.5rem 0 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .report-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; margin: 0; line-height: 1.2; }
  .report-subtitle { font-size: 12px; opacity: 0.85; margin-top: 4px; font-weight: 500; }
  .report-brand { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-align: right; opacity: 0.9; }
  .report-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; padding: 16px 24px; border-bottom: 1px solid #e2e5e9; background: #f1f3f5; }
  .report-meta-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #68727e; margin-bottom: 2px; }
  .report-meta-value { font-size: 14px; font-weight: 700; color: #27313d; }
  .report-body { padding: 16px 24px 24px; }
  .report-section { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #27313d; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #26384f; }
  .report-section:first-child { margin-top: 0; }
  .report-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .report-table th { background: #304765; color: #f7f8fa; font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid #304765; white-space: nowrap; }
  .report-table td { padding: 7px 10px; border: 1px solid #d2d7dd; vertical-align: middle; }
  .report-table tbody tr:nth-child(even) { background: #f1f3f5; }
  .report-table .num, .report-table td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .report-table .center { text-align: center; }
  .report-total-row td { background: #c47716; color: #ffffff; font-weight: 700; border-color: #c47716; }
  .report-total-label { text-align: right; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
  .report-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 18px; }
  .report-summary-item { background: #f1f3f5; border: 1px solid #d2d7dd; border-radius: 0.375rem; padding: 10px 12px; }
  .report-summary-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #68727e; }
  .report-summary-value { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: #c47716; margin-top: 2px; }
  .report-footer { padding: 12px 24px; border-top: 1px solid #e2e5e9; font-size: 10.5px; color: #68727e; display: flex; justify-content: space-between; gap: 12px; }
  @media print { @page { size: A4; margin: 12mm; } body { background: #fbfcfd !important; } .report { box-shadow: none; border-radius: 0; max-width: 100%; } .report-table tr, .report-section, .report-summary-item, .report-total-row { page-break-inside: avoid; } .report-table thead { display: table-header-group; } }
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
      </style>
    </head>
    <body>
      ${report.outerHTML}
    </body>
  </html>
`;
      const result = await PdfGenerator.fromData({
  data: html,
  documentSize: "A4",
  orientation: "portrait",
  type: "base64",
  fileName: filename,
});

if (result.type !== "base64") {
  throw new Error("PDF was not generated as base64");
}

const saved = await FileSharer.save({
  filename,
  contentType: "application/pdf",
  base64Data: result.base64,
  android: {
    saveDirectory: "downloads",
    relativePath: "Download",
  },
});
      await FileOpener.open({
  filePath: saved.uri!,
  contentType: "application/pdf",
  openWithDefault: true,
});

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
    alert("Unable to create the PDF. Please try again.");
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
    return () => document.removeEventListener("keydown", handleKey);
  }, [contractDropdownOpen]);

  // Close the contract dropdown on outside click
  useEffect(() => {
    if (!contractDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setContractDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contractDropdownOpen]);

  const selectedContracts = useMemo(
    () =>
      contracts.filter((c: any) => selectedContractIds.has(c.id.toString())),
    [contracts, selectedContractIds],
  );

  const toggleContractSelection = (id: string) => {
    setSelectedContractIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unsettledContracts = useMemo(
    () => contracts.filter((c: any) => !c.settled),
    [contracts],
  );

  const filteredDropdownContracts = useMemo(() => {
    const q = contractSearch.trim().toLowerCase();
    if (!q) return unsettledContracts;
    return unsettledContracts.filter((c: any) =>
      c.name.toLowerCase().includes(q),
    );
  }, [unsettledContracts, contractSearch]);

  const allContractsSelected =
    unsettledContracts.length > 0 &&
    selectedContractIds.size === unsettledContracts.length;

  const calculatePayments = () => {
    // Advances are counted only for the contracts selected for this payment.
    const selectedContractIdSet = new Set(
      selectedContracts.map((c: any) => c.id.toString()),
    );
    const data = labours.map((labour: any) => {
      const contractSalaries: { [key: string]: number } = {};
      let totalNetSalary = 0;
      for (const contract of selectedContracts) {
        const salary = calculateLabourSalary(
          contract,
          allAttendance,
          labour.id,
        );
        contractSalaries[contract.id.toString()] = salary;
        totalNetSalary += salary;
      }
      const totalAdvances = advances
        .filter((a: any) => {
          if (a.labourId !== labour.id) return false;
          return selectedContractIdSet.has(a.contractId.toString());
        })
        .reduce((sum: number, a: any) => sum + a.amount, 0);
      return {
        labour,
        contractSalaries,
        totalNetSalary,
        totalAdvances,
        amountPayable: excludeAdvances
          ? totalNetSalary
          : totalNetSalary - totalAdvances,
      };
    });
    setPaymentData(data);
  };

  // Omit rows that are entirely blank (all zero values) from the payment
  // table and the payment PDF.
  const visiblePaymentData = useMemo(
    () =>
      (paymentData || []).filter(
        (row: any) => row.totalNetSalary !== 0 || row.totalAdvances !== 0,
      ),
    [paymentData],
  );

  const downloadPaymentPDF = () => {
    if (!paymentData) return;
    const fmt = (n: number) =>
      `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    const rows = visiblePaymentData.map((row: any) => [
      row.labour.name,
      ...selectedContracts.map((c: any) =>
        fmt(row.contractSalaries[c.id.toString()] || 0),
      ),
      fmt(row.totalNetSalary),
      fmt(row.totalAdvances),
      fmt(row.amountPayable),
    ]);
    const totalRow = [
      "TOTAL",
      ...selectedContracts.map((c: any) =>
        fmt(
          visiblePaymentData.reduce(
            (s: number, r: any) =>
              s + (r.contractSalaries[c.id.toString()] || 0),
            0,
          ),
        ),
      ),
      fmt(
        visiblePaymentData.reduce(
          (s: number, r: any) => s + r.totalNetSalary,
          0,
        ),
      ),
      fmt(
        visiblePaymentData.reduce(
          (s: number, r: any) => s + r.totalAdvances,
          0,
        ),
      ),
      fmt(
        visiblePaymentData.reduce(
          (s: number, r: any) => s + r.amountPayable,
          0,
        ),
      ),
    ];

    const generated = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const contractNames =
      selectedContracts.length > 0
        ? selectedContracts.map((c: any) => c.name).join(", ")
        : "—";

    const headerHTML = `
      <div class="report-header">
        <div>
          <h1 class="report-title">Payment Report</h1>
          <div class="report-subtitle">Labour payment summary across selected contracts</div>
        </div>
        <div class="report-brand">Rossie</div>
      </div>
      <div class="report-meta">
        <div><div class="report-meta-label">Contracts</div><div class="report-meta-value">${contractNames}</div></div>
        <div><div class="report-meta-label">Labours</div><div class="report-meta-value">${visiblePaymentData.length}</div></div>
        <div><div class="report-meta-label">Generated</div><div class="report-meta-value">${generated}</div></div>
        <div><div class="report-meta-label">Total Payable</div><div class="report-meta-value">${fmt(visiblePaymentData.reduce((s: number, r: any) => s + r.amountPayable, 0))}</div></div>
      </div>`;

    const thead = `<tr><th>Labour</th>${selectedContracts
      .map((c: any) => `<th class="num">${c.name}</th>`)
      .join(
        "",
      )}<th class="num">Net Salary</th><th class="num">Advances</th><th class="num">Payable</th></tr>`;

    const bodyRows = rows
      .map(
        (r: string[]) =>
          `<tr>${r
            .map(
              (c: string, i: number) =>
                `<td class="${i === 0 ? "" : "num"}">${c}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");

    const totalCells = totalRow
      .map(
        (c: string, i: number) =>
          `<td class="${i === 0 ? "report-total-label" : "num"}">${c}</td>`,
      )
      .join("");

    const summaryHTML = `
      <div class="report-summary">
        <div class="report-summary-item"><div class="report-summary-label">Total Net Salary</div><div class="report-summary-value">${fmt(visiblePaymentData.reduce((s: number, r: any) => s + r.totalNetSalary, 0))}</div></div>
        <div class="report-summary-item"><div class="report-summary-label">Total Advances</div><div class="report-summary-value">${fmt(visiblePaymentData.reduce((s: number, r: any) => s + r.totalAdvances, 0))}</div></div>
        <div class="report-summary-item"><div class="report-summary-label">Total Payable</div><div class="report-summary-value">${fmt(visiblePaymentData.reduce((s: number, r: any) => s + r.amountPayable, 0))}</div></div>
      </div>`;

    const footerHTML = `
      <div class="report-footer">
        <span>Rossie — Construction Labour Management</span>
        <span>Generated ${generated}</span>
      </div>`;

    const bodyHTML = `
      <div class="report">
        ${headerHTML}
        <div class="report-body">
          <h2 class="report-section">Payment Details</h2>
          <table class="report-table">
            <thead>${thead}</thead>
            <tbody>${bodyRows}<tr class="report-total-row">${totalCells}</tr></tbody>
          </table>
          ${summaryHTML}
        </div>
        ${footerHTML}
      </div>`;

    setPaymentPreviewHTML(bodyHTML);
setShowPaymentPdfPreview(true);
  };

  const downloadAttendancePDF = () => {
    if (!paymentData || selectedContracts.length === 0) return;

    // A column value is "present" if there is a record whose value is
    // present or partial (getAttendanceDisplay > 0). Absent means no
    // record, or __kind__ === "absent" (display === 0).
    const isValuePresent = (v: AttendanceValue | undefined): boolean =>
      !!v && getAttendanceDisplay(v) > 0;

    // For each contract, pre-compute the subset of work columns that have
    // at least one present value across all labours. All-absent columns
    // are omitted from both the header and every body row.
    const contractVisibleCols = selectedContracts.map((contract: any) => {
      const cols = contract.workColumns || [];
      const visible = cols.filter((col: any) =>
        paymentData.some((row: any) =>
          isValuePresent(
            allAttendance.find(
              (r: any) =>
                r.contractId === contract.id &&
                r.labourId === row.labour.id &&
                r.columnId === col.id,
            )?.value,
          ),
        ),
      );
      return { contract, visible };
    });

    // Omit rows that are entirely blank (all absent) from the attendance
    // table and PDF.
    const visibleRows = paymentData.filter((row: any) =>
      contractVisibleCols.some(({ contract, visible }: any) =>
        visible.some((col: any) =>
          isValuePresent(
            allAttendance.find(
              (r: any) =>
                r.contractId === contract.id &&
                r.labourId === row.labour.id &&
                r.columnId === col.id,
            )?.value,
          ),
        ),
      ),
    );

    const generated = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const contractNames = selectedContracts.map((c: any) => c.name).join(", ");

    const headerHTML = `
      <div class="report-header">
        <div>
          <h1 class="report-title">Attendance Report</h1>
          <div class="report-subtitle">Daily attendance across selected contracts</div>
        </div>
        <div class="report-brand">Rossie</div>
      </div>
      <div class="report-meta">
        <div><div class="report-meta-label">Contracts</div><div class="report-meta-value">${contractNames}</div></div>
        <div><div class="report-meta-label">Labours</div><div class="report-meta-value">${visibleRows.length}</div></div>
        <div><div class="report-meta-label">Generated</div><div class="report-meta-value">${generated}</div></div>
      </div>`;

    // Header rows — only visible columns are emitted. A contract whose
    // visible column count is 0 still gets a single placeholder cell so
    // its header remains visible.
    let tableHeaderHTML = "";
    let subHeaderHTML = "";
    for (const { contract, visible } of contractVisibleCols) {
      const colCount = Math.max(visible.length, 1);
      tableHeaderHTML += `<th class="center" colspan="${colCount}">${contract.name}</th>`;
      if (visible.length === 0) {
        subHeaderHTML += '<th class="center">—</th>';
      } else {
        for (const col of visible) {
          subHeaderHTML += `<th class="center">${col.name}</th>`;
        }
      }
    }

    // Data rows — only visible columns get cells.
    let bodyRows = "";
    for (const row of visibleRows) {
      let cells = "";
      for (const { contract, visible } of contractVisibleCols) {
        if (visible.length === 0) {
          cells += '<td class="center">—</td>';
        } else {
          for (const col of visible) {
            const rec = allAttendance.find(
              (r: any) =>
                r.contractId === contract.id &&
                r.labourId === row.labour.id &&
                r.columnId === col.id,
            );
            const v = rec?.value;
            const display = !v
              ? "A"
              : v.__kind__ === "present"
                ? "P"
                : v.__kind__ === "partial"
                  ? String(v.partial)
                  : "A";
            cells += `<td class="center">${display}</td>`;
          }
        }
      }
      bodyRows += `<tr><td>${row.labour.name}</td>${cells}</tr>`;
    }

    const footerHTML = `
      <div class="report-footer">
        <span>Rossie — Construction Labour Management</span>
        <span>P = Present &nbsp;·&nbsp; A = Absent &nbsp;·&nbsp; value = Partial</span>
      </div>`;

    const bodyHTML = `
      <div class="report">
        ${headerHTML}
        <div class="report-body">
          <h2 class="report-section">Attendance Details</h2>
          <table class="report-table">
            <thead><tr><th rowspan="2">Labour</th>${tableHeaderHTML}</tr><tr>${subHeaderHTML}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
        ${footerHTML}
      </div>`;

    openPrintWindow("Attendance Sheet", bodyHTML);
  };

  const overviewData = paymentData || [];

  const overviewTotals = useMemo(() => {
    const selected = overviewData.filter((r: any) =>
      selectedOverviewLabours.has(r.labour.id.toString()),
    );
    return {
      netSalary: selected.reduce(
        (s: number, r: any) => s + r.totalNetSalary,
        0,
      ),
      advances: selected.reduce((s: number, r: any) => s + r.totalAdvances, 0),
      payable: selected.reduce((s: number, r: any) => s + r.amountPayable, 0),
    };
  }, [overviewData, selectedOverviewLabours]);

  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  if (contractsLoading || laboursLoading)
    return (
      <div className="flex justify-center pt-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Frozen top controls */}
      <div className="shrink-0 sticky top-0 z-[100] bg-[#0a0f1e] px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Payments</h1>
          {/* Calculate Payments — top right */}
          <button
            type="button"
            onClick={calculatePayments}
            disabled={selectedContractIds.size === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              background:
                selectedContractIds.size > 0
                  ? "linear-gradient(135deg, #f97316, #ea580c)"
                  : "rgba(255,255,255,0.06)",
              color:
                selectedContractIds.size > 0 ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow:
                selectedContractIds.size > 0
                  ? "0 4px 20px rgba(249,115,22,0.35)"
                  : "none",
            }}
            data-ocid="payments.calculate_button"
          >
            <Calculator size={14} />
            Calculate
          </button>
        </div>

        {/* Contract selection — dropdown instead of a modal dialog */}
        <div className="relative mb-3" ref={dropdownRef}>
          {/* Trigger button with selected-count chip */}
          <button
            type="button"
            onClick={() => setContractDropdownOpen((o) => !o)}
            data-ocid="payments.contract_select_trigger"
            className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 bg-[#0d1220] border-white/15 text-white/85 hover:border-orange-500/60 hover:bg-[#101630]"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-white/8 text-orange-400 group-hover:bg-orange-500/20">
                <CheckCheck size={15} />
              </span>
              <span className="truncate">
                {selectedContractIds.size === 0
                  ? "Select Contracts"
                  : `${selectedContractIds.size} contract${selectedContractIds.size === 1 ? "" : "s"} selected`}
              </span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              {selectedContractIds.size > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 2px 8px rgba(249,115,22,0.4)",
                  }}
                >
                  {selectedContractIds.size}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`text-orange-400 transition-transform duration-200 ${
                  contractDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </button>

          {/* Dropdown panel */}
          {contractDropdownOpen && (
            <div
              className="relative w-full mt-2 z-[200] max-h-[60vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
              style={{ background: "rgba(5,10,20,0.98)" }}
              data-ocid="payments.contract_select_dropdown"
            >
              {unsettledContracts.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-10">
                  No active contracts
                </p>
              ) : (
                <>
                  {/* Search input */}
                  <div className="relative p-2.5 border-b border-white/10 shrink-0">
                    <Search
                      size={15}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={contractSearch}
                      onChange={(e) => setContractSearch(e.target.value)}
                      placeholder="Search contracts by name…"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0a0f1e] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                      data-ocid="payments.contract_search_input"
                    />
                  </div>

                  {/* Select All / Clear All controls */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02] shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (allContractsSelected) {
                          setSelectedContractIds(new Set());
                        } else {
                          setSelectedContractIds(
                            new Set(
                              unsettledContracts.map((c: any) =>
                                c.id.toString(),
                              ),
                            ),
                          );
                        }
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-300 hover:bg-orange-500/10 transition-colors"
                      data-ocid="payments.contract_select_all"
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          allContractsSelected
                            ? "bg-orange-500 border-orange-500"
                            : "border-orange-500/60"
                        }`}
                      >
                        {allContractsSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {allContractsSelected ? "Clear All" : "Select All"}
                    </button>
                    <span className="text-xs text-white/40">
                      {filteredDropdownContracts.length} of{" "}
                      {unsettledContracts.length}
                    </span>
                  </div>

                  {/* Contract rows */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {filteredDropdownContracts.length === 0 ? (
                      <p className="text-white/30 text-sm text-center py-10">
                        No contracts match “{contractSearch}”
                      </p>
                    ) : (
                      filteredDropdownContracts.map((c: any, idx: number) => {
                        const id = c.id.toString();
                        const isSelected = selectedContractIds.has(id);
                        return (
                          <label
                            key={id}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-white/5 last:border-0 transition-colors ${
                              isSelected
                                ? "bg-orange-500/10 hover:bg-orange-500/15"
                                : "hover:bg-white/5"
                            }`}
                            data-ocid={`payments.contract_option.${idx + 1}`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                                isSelected
                                  ? "bg-orange-500 border-orange-500 scale-100"
                                  : "border-white/25 scale-95"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => toggleContractSelection(id)}
                            />
                            <span className="flex-1 text-sm text-white truncate min-w-0">
                              {c.name}
                            </span>
                            <span className="text-xs font-medium text-orange-400/80 shrink-0 tabular-nums">
                              ₹
                              {c.contractAmount?.toLocaleString("en-IN") ?? "—"}
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {/* Payment Table */}
        {paymentData && (
          <>
            {/* Action buttons above the payment table */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={downloadPaymentPDF}
                const [paymentPreviewHTML, setPaymentPreviewHTML] = useState("");
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500"
                data-ocid="payments.download_payment_sheet"
              >
                <FileText size={14} />
                Payment
              </button>
              <button
                type="button"
                onClick={downloadAttendancePDF}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/20 text-white/60 hover:bg-white/5 hover:border-white/30"
                data-ocid="payments.download_attendance_sheet"
              >
                <FileDown size={14} />
                Attendance
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverview(true);
                  setOverviewIndex(0);
                  setSelectedOverviewLabours(new Set());
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                data-ocid="payments.overview_button"
              >
                <BarChart3 size={14} />
                Overview
              </button>
            </div>

            <div
              ref={paymentsScrollRef}
              className="swipeable-table-wrapper mt-0"
            >
              <table className="min-w-max text-sm">
                <thead>
                  <tr className="border-b border-orange-500/20">
                    <th className="text-left text-gray-400 py-2 pr-4 whitespace-nowrap">
                      Labour
                    </th>
                    {selectedContracts.map((c: any) => (
                      <th
                        key={c.id.toString()}
                        className="text-right text-gray-400 py-2 px-2 whitespace-nowrap"
                      >
                        {c.name}
                      </th>
                    ))}
                    <th className="text-right text-gray-400 py-2 px-2 whitespace-nowrap">
                      Net Salary
                    </th>
                    <th className="text-right text-gray-400 py-2 px-2 whitespace-nowrap">
                      Advances
                    </th>
                    <th className="text-right text-orange-400 py-2 pl-2 whitespace-nowrap">
                      Payable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePaymentData.map((row: any) => (
                    <tr
                      key={row.labour.id.toString()}
                      className="border-b border-white/5"
                    >
                      <td className="text-white py-2 pr-4 whitespace-nowrap">
                        {row.labour.name}
                      </td>
                      {selectedContracts.map((c: any) => (
                        <td
                          key={c.id.toString()}
                          className="text-right text-gray-300 py-2 px-2 whitespace-nowrap"
                        >
                          {fmt(row.contractSalaries[c.id.toString()] || 0)}
                        </td>
                      ))}
                      <td className="text-right text-white py-2 px-2 whitespace-nowrap">
                        {fmt(row.totalNetSalary)}
                      </td>
                      <td className="text-right text-red-400 py-2 px-2 whitespace-nowrap">
                        {fmt(row.totalAdvances)}
                      </td>
                      <td className="text-right text-orange-400 font-semibold py-2 pl-2 whitespace-nowrap">
                        {fmt(row.amountPayable)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t-2 border-orange-500/30 bg-white/5">
                    <td className="text-gray-400 font-bold py-2 pr-4 whitespace-nowrap">
                      TOTAL
                    </td>
                    {selectedContracts.map((c: any) => (
                      <td
                        key={c.id.toString()}
                        className="text-right text-gray-300 font-bold py-2 px-2 whitespace-nowrap"
                      >
                        {fmt(
                          visiblePaymentData.reduce(
                            (s: number, r: any) =>
                              s + (r.contractSalaries[c.id.toString()] || 0),
                            0,
                          ),
                        )}
                      </td>
                    ))}
                    <td className="text-right text-white font-bold py-2 px-2 whitespace-nowrap">
                      {fmt(
                        visiblePaymentData.reduce(
                          (s: number, r: any) => s + r.totalNetSalary,
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right text-red-400 font-bold py-2 px-2 whitespace-nowrap">
                      {fmt(
                        visiblePaymentData.reduce(
                          (s: number, r: any) => s + r.totalAdvances,
                          0,
                        ),
                      )}
                    </td>
                    <td className="text-right text-orange-400 font-bold py-2 pl-2 whitespace-nowrap">
                      {fmt(
                        visiblePaymentData.reduce(
                          (s: number, r: any) => s + r.amountPayable,
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Labour Payment Overview Dialog */}
      {showOverview && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          data-ocid="payments.overview.dialog"
        >
          <div
            className="w-full max-w-md mx-auto max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-white/10"
            style={{ background: "rgba(5,10,20,0.97)" }}
          >
            {/* Orange Gradient Header */}
            <div className="shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-t-2xl flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Payment Overview
                </h2>
                <p className="text-sm text-white/70 mt-0.5">
                  {overviewMode === "oneByOne"
                    ? `${overviewIndex + 1} / ${overviewData.length}`
                    : `${selectedOverviewLabours.size} of ${overviewData.length} selected`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOverview(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                data-ocid="payments.overview.close_button"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Include advances toggle */}
            <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-white/10">
              <span className="text-sm font-medium text-white/80">
                Include advances in net pay
              </span>
              <button
                type="button"
                onClick={() => setExcludeAdvances((v) => !v)}
                aria-label={
                  excludeAdvances ? "Advances excluded" : "Advances included"
                }
                className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  excludeAdvances ? "bg-white/20" : "bg-orange-500"
                }`}
                data-ocid="payments.overview.include_advances_toggle"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    excludeAdvances ? "translate-x-0.5" : "translate-x-[22px]"
                  }`}
                />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="shrink-0 px-4 py-3 border-b border-white/10 flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setOverviewMode("oneByOne")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${overviewMode === "oneByOne" ? "bg-orange-500 text-white" : "bg-white/10 text-white/60"}`}
                data-ocid="payments.overview.mode_onebyone"
              >
                One by One
              </button>
              <button
                type="button"
                onClick={() => setOverviewMode("multiSelect")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${overviewMode === "multiSelect" ? "bg-orange-500 text-white" : "bg-white/10 text-white/60"}`}
                data-ocid="payments.overview.mode_multiselect"
              >
                Multi Select
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {overviewMode === "oneByOne" && overviewData.length > 0 && (
                <div className="px-4 py-4 space-y-4">
                  {/* Counter pill */}
                  <div className="text-center">
                    <span className="inline-block bg-white/10 rounded-full px-4 py-1 text-white/60 text-sm">
                      {overviewIndex + 1} / {overviewData.length}
                    </span>
                  </div>

                  {/* Labour name — large */}
                  <h3 className="text-4xl font-black text-white text-center mb-4">
                    {overviewData[overviewIndex]?.labour.name}
                  </h3>

                  {/* Gross Salary row */}
                  <div className="rounded-xl px-4 py-2.5 border-l-4 border-cyan-400 bg-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Gross Salary
                    </span>
                    <span className="text-sm font-semibold text-cyan-300">
                      {fmt(overviewData[overviewIndex]?.totalNetSalary || 0)}
                    </span>
                  </div>

                  {/* Total Advances row */}
                  {!excludeAdvances && (
                    <div className="space-y-0">
                      <button
                        type="button"
                        onClick={() => setShowAdvanceBreakdown((s) => !s)}
                        className="w-full rounded-xl px-4 py-2.5 border-l-4 border-red-400 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                        data-ocid="payments.overview.show_breakdown"
                      >
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                          Total Advances
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-red-300">
                            {fmt(
                              overviewData[overviewIndex]?.totalAdvances || 0,
                            )}
                          </span>
                          {showAdvanceBreakdown ? (
                            <ChevronUp size={14} className="text-red-400" />
                          ) : (
                            <ChevronDown size={14} className="text-red-400" />
                          )}
                        </span>
                      </button>
                      {showAdvanceBreakdown && (
                        <div className="text-left space-y-1.5 max-h-32 overflow-y-auto">
                          {(() => {
                            const labour = overviewData[overviewIndex]?.labour;
                            if (!labour) return null;
                            const labourAdvances = advances.filter(
                              (a: any) => a.labourId === labour.id,
                            );
                            if (labourAdvances.length === 0) {
                              return (
                                <p className="text-gray-500 text-xs text-center py-2">
                                  No advances found
                                </p>
                              );
                            }
                            return labourAdvances.map((a: any) => {
                              const contract = contracts.find(
                                (c: any) => c.id === a.contractId,
                              );
                              return (
                                <div
                                  key={a.id.toString()}
                                  className="glass-card rounded-lg p-2 flex justify-between items-center"
                                >
                                  <div>
                                    <p className="text-white text-xs">
                                      {fmt(a.amount)}
                                    </p>
                                    {a.note && (
                                      <p className="text-gray-500 text-[10px]">
                                        {a.note}
                                      </p>
                                    )}
                                    {contract && (
                                      <p className="text-gray-500 text-[10px]">
                                        {contract.name}
                                        {contract.settled ? " (Settled)" : ""}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${contract?.settled ? "bg-gray-700 text-gray-400" : "bg-red-500/20 text-red-400"}`}
                                  >
                                    {contract?.settled ? "Cleared" : "Active"}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* NET PAY card */}
                  <div className="rounded-xl p-4 border-2 border-orange-500 bg-orange-500/10 text-center">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      Net Pay
                    </p>
                    <p className="text-5xl font-black text-orange-400 mt-1">
                      {fmt(
                        excludeAdvances
                          ? overviewData[overviewIndex]?.totalNetSalary || 0
                          : overviewData[overviewIndex]?.amountPayable || 0,
                      )}
                    </p>
                  </div>
                </div>
              )}

              {overviewMode === "multiSelect" && (
                <div className="flex flex-col h-full">
                  {/* Deselect All */}
                  <div className="shrink-0 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOverviewLabours(new Set())}
                      className="rounded-full border border-orange-500 text-orange-400 text-sm px-4 py-1 hover:bg-orange-500/10 transition-colors"
                      data-ocid="payments.overview.deselect_all"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Scrollable labour list */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-0">
                      {overviewData.map((row: any) => (
                        <label
                          key={row.labour.id.toString()}
                          className="flex items-center gap-3 py-2 px-4 cursor-pointer hover:bg-white/5 transition-colors"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedOverviewLabours.has(row.labour.id.toString()) ? "bg-orange-500 border-orange-500" : "border-orange-500"}`}
                          >
                            {selectedOverviewLabours.has(
                              row.labour.id.toString(),
                            ) && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedOverviewLabours.has(
                              row.labour.id.toString(),
                            )}
                            onChange={() => {
                              setSelectedOverviewLabours((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.labour.id.toString()))
                                  next.delete(row.labour.id.toString());
                                else next.add(row.labour.id.toString());
                                return next;
                              });
                            }}
                            className="sr-only"
                          />
                          <span className="flex-1 text-white text-sm">
                            {row.labour.name}
                          </span>
                          <span className="text-cyan-400 font-semibold text-sm">
                            {fmt(row.amountPayable)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className="shrink-0 border-t border-white/10">
              {overviewMode === "oneByOne" && (
                /* Prev / Next buttons pinned to bottom */
                <div className="grid grid-cols-2 gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => setOverviewIndex((i) => Math.max(0, i - 1))}
                    disabled={overviewIndex === 0}
                    className="bg-white/10 text-white rounded-xl py-3 font-semibold hover:bg-white/20 transition-colors disabled:opacity-30"
                    data-ocid="payments.overview.prev_button"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOverviewIndex((i) =>
                        Math.min(overviewData.length - 1, i + 1),
                      )
                    }
                    disabled={overviewIndex === overviewData.length - 1}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 font-semibold disabled:opacity-40"
                    data-ocid="payments.overview.next_button"
                  >
                    Next
                  </button>
                </div>
              )}

              {overviewMode === "multiSelect" && (
                /* Bottom summary section — fixed at bottom */
                <div className="shrink-0 p-4 border-t border-white/10">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                    Selected: {selectedOverviewLabours.size} labours
                  </p>
                  {!excludeAdvances && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Total Advances</span>
                      <span className="text-cyan-400 font-semibold">
                        {fmt(overviewTotals.advances)}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 mb-1">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      Combined Net Pay
                    </p>
                    <p className="text-5xl font-black text-orange-400">
                      {fmt(
                        excludeAdvances
                          ? overviewTotals.netSalary
                          : overviewTotals.payable,
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    {showPaymentPdfPreview && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col">
      
      <div className="flex-1 overflow-auto p-4">
        <div
          dangerouslySetInnerHTML={{ __html: paymentPreviewHTML }}
        />
      </div>

      <div className="flex gap-3 p-4 border-t bg-white">
        <button
          type="button"
          onClick={() => setShowPaymentPdfPreview(false)}
          className="flex-1 rounded-lg bg-gray-500 px-4 py-3 font-semibold text-white"
        >
          Close
        </button>

        <button
          type="button"
          className="flex-1 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white"
        >
          Save PDF
        </button>
      </div>

    </div>
  </div>
)}    
    </div>
  );
}

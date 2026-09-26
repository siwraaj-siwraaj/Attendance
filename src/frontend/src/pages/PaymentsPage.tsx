import type React from "react";
import { useMemo, useState } from "react";
import {
  useAdvances,
  useAllAttendance,
  useContracts,
  useLabours,
} from "../hooks/useBackend";
import {
  BarChart3,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileText,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { type AttendanceValue, getAttendanceDisplay } from "../types";
import html2pdf from "html2pdf.js";
import { registerPlugin } from "@capacitor/core";

const AttendancePdf = registerPlugin<{
  savePdf(options: { html: string; fileName: string }): Promise<{ uri: string; fileName: string }>;
  openPdf(options: { uri: string }): Promise<void>;
}>("AttendancePdf");

interface PaymentsPageProps {
  selectedContractIds: Set<string>;
  setSelectedContractIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  paymentData: any[] | null;
  setPaymentData: React.Dispatch<React.SetStateAction<any[] | null>>;
}

const money = (value: number) =>
  `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

const salaryUnits = (value: any) => {
  if (!value) return 0;
  if (value.__kind__ === "present") return 1;
  if (value.__kind__ === "partial") return Number(value.partial) || 0;
  return 0;
};

function calculateLabourSalary(contract: any, records: any[], labourId: bigint) {
  let total = 0;
  for (const workType of ["bed", "paper", "mesh", "custom"]) {
    const columns = (contract.workColumns || []).filter(
      (column: any) => column.workType === workType,
    );
    if (!columns.length) continue;

    const rate =
      workType === "bed"
        ? Number(contract.bedAmount) || 0
        : workType === "paper"
          ? Number(contract.paperAmount) || 0
          : workType === "mesh"
            ? Number(contract.meshAmount) || 0
            : 0;
    if (!rate) continue;

    const ids = new Set(columns.map((column: any) => column.id));
    const relevant = records.filter(
      (record: any) =>
        record.contractId === contract.id && ids.has(record.columnId),
    );
    const totalUnits = relevant.reduce(
      (sum: number, record: any) => sum + salaryUnits(record.value),
      0,
    );
    if (!totalUnits) continue;

    const labourUnits = relevant
      .filter((record: any) => record.labourId === labourId)
      .reduce((sum: number, record: any) => sum + salaryUnits(record.value), 0);

    total += (labourUnits / totalUnits) * rate;
  }
  return total;
}

const REPORT_CSS = `
*{box-sizing:border-box}
@page{size:A4 portrait;margin:8mm}
body{margin:0;background:#fff;color:#182230;font-family:Arial,sans-serif;font-size:10pt;line-height:1.35}
.report{width:100%;background:#fff}
.header{background:#172536;color:#fff;padding:20px 22px}
.brand{font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.7}
.title{font-size:24px;font-weight:800;margin:4px 0}
.subtitle{font-size:11px;opacity:.7}
.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:#f3f5f7;padding:16px 22px}
.label{font-size:8px;color:#657181;text-transform:uppercase;font-weight:700;letter-spacing:1px}
.value{font-size:11px;font-weight:800;margin-top:3px;overflow-wrap:anywhere}
.body{padding:18px 22px}
h2{font-size:13px;margin:0 0 10px;border-bottom:2px solid #172536;padding-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:8.5px}
th{background:#263c55;color:#fff;text-align:left;padding:7px}
td{border:1px solid #d9dee4;padding:6px}
.num{text-align:right;white-space:nowrap}
.total td{background:#c97716;color:#fff;font-weight:800;border-color:#c97716}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.summary div{background:#f3f5f7;border:1px solid #d9dee4;padding:10px}
.summary strong{display:block;color:#c97716;font-size:13px;margin-top:3px}
.footer{border-top:1px solid #d9dee4;padding:12px 22px;color:#657181;font-size:8px;display:flex;justify-content:space-between}
`;

async function saveReport(title: string, html: string) {
  const filename = `${title.replace(/[^a-z0-9_-]+/gi, "_")}.pdf`;
  const isNative =
    typeof window !== "undefined" &&
    "Capacitor" in window &&
    (window as any).Capacitor?.isNativePlatform?.();

  if (isNative) {
    const fullHtml = `<!doctype html><html><head><meta charset="UTF-8"><style>${REPORT_CSS}</style></head><body>${html}</body></html>`;
    const saved = await AttendancePdf.savePdf({ html: fullHtml, fileName: filename });
    await AttendancePdf.openPdf({ uri: saved.uri });
    return;
  }

  const host = document.createElement("div");
  host.innerHTML = `<style>${REPORT_CSS}</style>${html}`;
  document.body.appendChild(host);
  try {
    await html2pdf()
      .set({
        margin: 8,
        filename,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(host)
      .save();
  } finally {
    host.remove();
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

  const [contractPickerOpen, setContractPickerOpen] = useState(false);
  const [contractSearch, setContractSearch] = useState("");
  const [labourSearch, setLabourSearch] = useState("");
  const [expandedLabour, setExpandedLabour] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [overviewIndex, setOverviewIndex] = useState(0);
  const [overviewSelection, setOverviewSelection] = useState<Set<string>>(new Set());
  const [deductAdvances, setDeductAdvances] = useState(true);
  const [preview, setPreview] = useState<{ title: string; html: string } | null>(null);

  const activeContracts = useMemo(
    () => contracts.filter((contract: any) => !contract.settled),
    [contracts],
  );

  const selectedContracts = useMemo(
    () =>
      contracts.filter((contract: any) =>
        selectedContractIds.has(contract.id.toString()),
      ),
    [contracts, selectedContractIds],
  );

  const filteredContracts = useMemo(() => {
    const query = contractSearch.trim().toLowerCase();
    if (!query) return activeContracts;
    return activeContracts.filter((contract: any) =>
      String(contract.name || "").toLowerCase().includes(query),
    );
  }, [activeContracts, contractSearch]);

  const calculatePayments = () => {
    const selected = new Set(selectedContracts.map((contract: any) => contract.id.toString()));
    const result = labours.map((labour: any) => {
      const contractSalaries: Record<string, number> = {};
      let gross = 0;

      for (const contract of selectedContracts) {
        const amount = calculateLabourSalary(contract, allAttendance, labour.id);
        contractSalaries[contract.id.toString()] = amount;
        gross += amount;
      }

      const totalAdvances = advances
        .filter(
          (advance: any) =>
            advance.labourId === labour.id &&
            selected.has(advance.contractId.toString()),
        )
        .reduce((sum: number, advance: any) => sum + (Number(advance.amount) || 0), 0);

      return {
        labour,
        contractSalaries,
        totalNetSalary: gross,
        totalAdvances,
        amountPayable: deductAdvances ? gross - totalAdvances : gross,
      };
    });

    setPaymentData(result);
  };

  const visibleRows = useMemo(
    () =>
      (paymentData || []).filter(
        (row: any) => row.totalNetSalary !== 0 || row.totalAdvances !== 0,
      ),
    [paymentData],
  );

  const totals = useMemo(
    () => ({
      gross: visibleRows.reduce((sum: number, row: any) => sum + row.totalNetSalary, 0),
      advances: visibleRows.reduce((sum: number, row: any) => sum + row.totalAdvances, 0),
      payable: visibleRows.reduce((sum: number, row: any) => sum + row.amountPayable, 0),
    }),
    [visibleRows],
  );

  const filteredRows = useMemo(() => {
    const query = labourSearch.trim().toLowerCase();
    if (!query) return visibleRows;
    return visibleRows.filter((row: any) =>
      String(row.labour?.name || "").toLowerCase().includes(query),
    );
  }, [visibleRows, labourSearch]);

  const overviewRows = visibleRows;
  const selectedOverviewRows = overviewRows.filter((row: any) =>
    overviewSelection.has(row.labour.id.toString()),
  );
  const overviewTotals = {
    gross: selectedOverviewRows.reduce((s: number, r: any) => s + r.totalNetSalary, 0),
    advances: selectedOverviewRows.reduce((s: number, r: any) => s + r.totalAdvances, 0),
    payable: selectedOverviewRows.reduce((s: number, r: any) => s + r.amountPayable, 0),
  };

  const buildPaymentReport = () => {
    const contractNames = selectedContracts.map((c: any) => c.name).join(", ") || "None";
    const rows = visibleRows
      .map(
        (row: any) =>
          `<tr><td>${row.labour.name}</td>${selectedContracts
            .map((c: any) => `<td class="num">${money(row.contractSalaries[c.id.toString()] || 0)}</td>`)
            .join("")}<td class="num">${money(row.totalNetSalary)}</td><td class="num">${money(row.totalAdvances)}</td><td class="num">${money(row.amountPayable)}</td></tr>`,
      )
      .join("");
    const totalCells = selectedContracts
      .map((c: any) => {
        const total = visibleRows.reduce(
          (sum: number, row: any) => sum + (row.contractSalaries[c.id.toString()] || 0),
          0,
        );
        return `<td class="num">${money(total)}</td>`;
      })
      .join("");

    const html = `<div class="report">
      <div class="header"><div class="brand">Rossie Payroll</div><div class="title">Payment Report</div><div class="subtitle">Labour payment statement</div></div>
      <div class="meta">
        <div><div class="label">Contracts</div><div class="value">${contractNames}</div></div>
        <div><div class="label">Labours</div><div class="value">${visibleRows.length}</div></div>
        <div><div class="label">Gross</div><div class="value">${money(totals.gross)}</div></div>
        <div><div class="label">Payable</div><div class="value">${money(totals.payable)}</div></div>
      </div>
      <div class="body"><h2>Payment details</h2>
      <table><thead><tr><th>Labour</th>${selectedContracts.map((c: any) => `<th class="num">${c.name}</th>`).join("")}<th class="num">Gross</th><th class="num">Advances</th><th class="num">Payable</th></tr></thead>
      <tbody>${rows}<tr class="total"><td>TOTAL</td>${totalCells}<td class="num">${money(totals.gross)}</td><td class="num">${money(totals.advances)}</td><td class="num">${money(totals.payable)}</td></tr></tbody></table>
      <div class="summary"><div><div class="label">Gross salary</div><strong>${money(totals.gross)}</strong></div><div><div class="label">Advances</div><strong>${money(totals.advances)}</strong></div><div><div class="label">Total payable</div><strong>${money(totals.payable)}</strong></div></div></div>
      <div class="footer"><span>Rossie — Construction Labour Management</span><span>Generated ${new Date().toLocaleDateString("en-IN")}</span></div>
    </div>`;

    setPreview({ title: "Payment Sheet", html });
  };

  const buildAttendanceReport = () => {
    if (!selectedContracts.length) return;
    const rows: string[] = [];
    for (const contract of selectedContracts) {
      const columns = (contract.workColumns || []).filter((column: any) =>
        allAttendance.some(
          (record: any) =>
            record.contractId === contract.id &&
            record.columnId === column.id &&
            getAttendanceDisplay(record.value as AttendanceValue) > 0,
        ),
      );
      for (const labour of labours) {
        const values = columns.map((column: any) => {
          const record = allAttendance.find(
            (item: any) =>
              item.contractId === contract.id &&
              item.columnId === column.id &&
              item.labourId === labour.id,
          );
          return record ? String(getAttendanceDisplay(record.value as AttendanceValue)) : "0";
        });
        if (values.some((value) => value !== "0")) {
          rows.push(`<tr><td>${contract.name}</td><td>${labour.name}</td>${values.map((v) => `<td class="num">${v}</td>`).join("")}</tr>`);
        }
      }
    }

    const columns = selectedContracts.flatMap((contract: any) =>
      (contract.workColumns || [])
        .filter((column: any) =>
          allAttendance.some(
            (record: any) =>
              record.contractId === contract.id &&
              record.columnId === column.id &&
              getAttendanceDisplay(record.value as AttendanceValue) > 0,
          ),
        )
        .map((column: any) => column.name),
    );

    const html = `<div class="report">
      <div class="header"><div class="brand">Rossie Attendance</div><div class="title">Attendance Report</div><div class="subtitle">Attendance used for the selected payment calculation</div></div>
      <div class="body"><h2>Attendance details</h2>
      <table><thead><tr><th>Contract</th><th>Labour</th>${columns.map((name: string) => `<th class="num">${name}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>
      <div class="footer"><span>Rossie — Construction Labour Management</span><span>Generated ${new Date().toLocaleDateString("en-IN")}</span></div>
    </div>`;
    setPreview({ title: "Attendance Sheet", html });
  };

  if (contractsLoading || laboursLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f5f7fa]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col bg-[#f5f7fa] text-[#182230]">
      <header className="shrink-0 bg-[#172536] px-4 pb-5 pt-5 text-white sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">
                <Wallet size={14} /> Payroll
              </div>
              <h1 className="text-3xl font-black tracking-tight">Payments</h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/55">
                Calculate labour earnings from attendance, account for advances, and prepare payment sheets.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right sm:block">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Active contracts</p>
              <p className="text-xl font-black">{activeContracts.length}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setContractPickerOpen((open) => !open)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                data-ocid="payments.contract_select_trigger"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                  <BarChart3 size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-white/35">Payment period</span>
                  <span className="mt-0.5 block truncate text-sm font-bold">
                    {selectedContracts.length
                      ? selectedContracts.map((c: any) => c.name).join(", ")
                      : "Select active contracts"}
                  </span>
                </span>
                <ChevronDown className={`ml-auto shrink-0 text-white/40 transition ${contractPickerOpen ? "rotate-180" : ""}`} size={18} />
              </button>
              <button
                type="button"
                onClick={calculatePayments}
                disabled={!selectedContractIds.size}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-extrabold shadow-lg shadow-orange-950/30 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
                data-ocid="payments.calculate_button"
              >
                <Calculator size={16} /> Calculate
              </button>
            </div>

            {contractPickerOpen && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#0f1b2a]" data-ocid="payments.contract_select_dropdown">
                <div className="border-b border-white/10 p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" size={15} />
                    <input
                      value={contractSearch}
                      onChange={(event) => setContractSearch(event.target.value)}
                      placeholder="Search active contracts"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400/50"
                      data-ocid="payments.contract_search_input"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedContractIds(
                        selectedContractIds.size === activeContracts.length
                          ? new Set()
                          : new Set(activeContracts.map((c: any) => c.id.toString())),
                      )
                    }
                    className="font-extrabold text-orange-300"
                    data-ocid="payments.contract_select_all"
                  >
                    {selectedContractIds.size === activeContracts.length ? "Clear all" : "Select all"}
                  </button>
                  <span className="text-white/35">{filteredContracts.length} active</span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {filteredContracts.map((contract: any, index: number) => {
                    const id = contract.id.toString();
                    const checked = selectedContractIds.has(id);
                    return (
                      <label
                        key={id}
                        className={`flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-3 ${checked ? "bg-orange-500/10" : ""}`}
                        data-ocid={`payments.contract_option.${index + 1}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedContractIds((previous) => {
                              const next = new Set(previous);
                              checked ? next.delete(id) : next.add(id);
                              return next;
                            });
                          }}
                          className="sr-only"
                        />
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${checked ? "border-orange-500 bg-orange-500" : "border-white/20"}`}>
                          {checked && <Check size={13} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white/85">{contract.name}</span>
                        <span className="text-xs font-bold text-white/35">{money(Number(contract.contractAmount) || 0)}</span>
                      </label>
                    );
                  })}
                  {!filteredContracts.length && <p className="px-4 py-8 text-center text-xs text-white/35">No active contracts found.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-32 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          {!paymentData ? (
            <div className="py-8 sm:py-12">
              <div className="mx-auto max-w-xl rounded-3xl border border-[#dfe4ea] bg-white p-7 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Calculator size={30} />
                </div>
                <h2 className="mt-5 text-xl font-black">Build your payment sheet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b7785]">
                  Select the contracts you want to settle, then calculate. Rossie will distribute the attendance-based earnings across the labours and subtract their advances.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2 text-left">
                  <div className="rounded-2xl bg-[#f5f7fa] p-3"><Users size={17} className="text-orange-500" /><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#7b8794]">Labours</p><p className="text-lg font-black">{labours.length}</p></div>
                  <div className="rounded-2xl bg-[#f5f7fa] p-3"><BarChart3 size={17} className="text-orange-500" /><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#7b8794]">Contracts</p><p className="text-lg font-black">{selectedContracts.length}</p></div>
                  <div className="rounded-2xl bg-[#f5f7fa] p-3"><Wallet size={17} className="text-orange-500" /><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#7b8794]">Advances</p><p className="text-lg font-black">{money(advances.reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0))}</p></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#dfe4ea] bg-white p-4 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8a95a2]">Labours</p><p className="mt-1 text-2xl font-black">{visibleRows.length}</p></div>
                <div className="rounded-2xl border border-[#dfe4ea] bg-white p-4 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8a95a2]">Gross</p><p className="mt-1 text-2xl font-black text-slate-700">{money(totals.gross)}</p></div>
                <div className="rounded-2xl border border-[#eadfe0] bg-white p-4 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a27478]">Advances</p><p className="mt-1 text-2xl font-black text-red-600">{money(totals.advances)}</p></div>
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-widest text-orange-700/60">Payable</p><p className="mt-1 text-2xl font-black text-orange-600">{money(totals.payable)}</p></div>
              </section>

              <section className="mt-4 rounded-2xl border border-[#dfe4ea] bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black">Payment register</h2>
                    <p className="text-xs text-[#7b8794]">{selectedContracts.length} contract{selectedContracts.length === 1 ? "" : "s"} · {visibleRows.length} payable labour records</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={buildPaymentReport} className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-extrabold text-orange-700" data-ocid="payments.download_payment_sheet"><FileText size={15} /> Payment PDF</button>
                    <button type="button" onClick={buildAttendanceReport} className="flex items-center gap-2 rounded-xl border border-[#dfe4ea] bg-[#f7f9fb] px-3 py-2.5 text-xs font-extrabold text-[#425163]" data-ocid="payments.download_attendance_sheet"><FileDown size={15} /> Attendance PDF</button>
                    <button type="button" onClick={() => { setOverviewSelection(new Set()); setOverviewIndex(0); setShowOverview(true); }} className="flex items-center gap-2 rounded-xl border border-[#dfe4ea] bg-[#f7f9fb] px-3 py-2.5 text-xs font-extrabold text-[#425163]" data-ocid="payments.overview_button"><BarChart3 size={15} /> Overview</button>
                  </div>
                </div>

                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa4af]" size={16} />
                  <input value={labourSearch} onChange={(e) => setLabourSearch(e.target.value)} placeholder="Search labour by name" className="w-full rounded-xl border border-[#dfe4ea] bg-[#f8fafc] py-3 pl-10 pr-3 text-sm outline-none focus:border-orange-400" data-ocid="payments.labour_search_input" />
                </div>
              </section>

              <section className="mt-3 space-y-2">
                {filteredRows.map((row: any) => {
                  const id = row.labour.id.toString();
                  const expanded = expandedLabour === id;
                  return (
                    <article key={id} className="overflow-hidden rounded-2xl border border-[#dfe4ea] bg-white shadow-sm">
                      <button type="button" onClick={() => setExpandedLabour(expanded ? null : id)} className="w-full p-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#172536] text-sm font-black text-white">
                            {(row.labour.name || "?").trim().split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-extrabold">{row.labour.name}</p>
                            <p className="mt-0.5 text-[11px] text-[#8793a0]">{selectedContracts.length} contract{selectedContracts.length === 1 ? "" : "s"} · Tap to view breakdown</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600/60">Payable</p>
                            <p className="text-lg font-black text-orange-600">{money(row.amountPayable)}</p>
                          </div>
                          {expanded ? <ChevronDown size={18} className="text-[#8b96a2]" /> : <ChevronRight size={18} className="text-[#8b96a2]" />}
                        </div>
                      </button>
                      {expanded && (
                        <div className="border-t border-[#edf0f3] bg-[#fafbfc] p-4">
                          <div className="grid gap-2 sm:grid-cols-2">
                            {selectedContracts.map((contract: any) => (
                              <div key={contract.id.toString()} className="rounded-xl border border-[#e4e8ed] bg-white p-3">
                                <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-[#8793a0]">{contract.name}</p>
                                <p className="mt-1 text-base font-black">{money(row.contractSalaries[contract.id.toString()] || 0)}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-white p-3"><p className="text-[10px] font-bold text-[#8793a0]">Gross salary</p><p className="mt-1 font-extrabold">{money(row.totalNetSalary)}</p></div>
                            <div className="rounded-xl bg-red-50 p-3"><p className="text-[10px] font-bold text-red-500">Advances</p><p className="mt-1 font-extrabold text-red-600">− {money(row.totalAdvances)}</p></div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
                {!filteredRows.length && <div className="rounded-2xl border border-dashed border-[#d7dde4] bg-white p-10 text-center"><Users className="mx-auto text-[#a5afb9]" size={28} /><p className="mt-3 text-sm font-bold">No payment records found</p><p className="mt-1 text-xs text-[#8b96a2]">Try another labour name or recalculate the selected contracts.</p></div>}
              </section>
            </>
          )}
        </div>
      </main>

      {showOverview && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#07101b]/75 p-3">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between bg-[#172536] p-5 text-white">
              <div><p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-orange-300">Payroll review</p><h2 className="mt-1 text-2xl font-black">Payment Overview</h2><p className="mt-1 text-xs text-white/45">{overviewRows.length ? `${overviewIndex + 1} of ${overviewRows.length}` : "No payable records"}</p></div>
              <button type="button" onClick={() => setShowOverview(false)} className="rounded-xl bg-white/10 p-2 text-white" data-ocid="payments.overview.close_button"><X size={18} /></button>
            </div>
            <div className="flex items-center justify-between border-b border-[#e5e9ed] px-5 py-3">
              <div><p className="text-sm font-extrabold">Deduct advances</p><p className="text-[11px] text-[#8793a0]">Change only this review</p></div>
              <button type="button" onClick={() => setDeductAdvances((value) => !value)} className={`relative h-6 w-11 rounded-full ${deductAdvances ? "bg-orange-500" : "bg-[#d8dde3]"}`} data-ocid="payments.overview.include_advances_toggle"><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${deductAdvances ? "left-[22px]" : "left-0.5"}`} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {overviewRows.length > 0 && (
                <div className="p-5">
                  <div className="rounded-2xl bg-[#f5f7fa] p-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#172536] text-white"><Users size={22} /></div>
                    <p className="mt-3 text-[9px] font-extrabold uppercase tracking-widest text-[#8a95a2]">Labour</p>
                    <h3 className="mt-1 text-2xl font-black">{overviewRows[overviewIndex]?.labour.name}</h3>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#e0e5ea] p-4"><p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8a95a2]">Gross</p><p className="mt-1 text-xl font-black">{money(overviewRows[overviewIndex]?.totalNetSalary)}</p></div>
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><p className="text-[9px] font-extrabold uppercase tracking-widest text-red-400">Advances</p><p className="mt-1 text-xl font-black text-red-600">{money(overviewRows[overviewIndex]?.totalAdvances)}</p></div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-orange-50 p-5 text-center"><p className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600/60">Net payable</p><p className="mt-1 text-4xl font-black text-orange-600">{money(deductAdvances ? overviewRows[overviewIndex]?.amountPayable : overviewRows[overviewIndex]?.totalNetSalary)}</p></div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#e5e9ed] p-4">
              <button type="button" onClick={() => setOverviewIndex((i) => Math.max(0, i - 1))} disabled={overviewIndex === 0} className="rounded-xl border border-[#dfe4ea] py-3 text-sm font-extrabold disabled:opacity-30" data-ocid="payments.overview.prev_button">Previous</button>
              <button type="button" onClick={() => setOverviewIndex((i) => Math.min(overviewRows.length - 1, i + 1))} disabled={overviewIndex >= overviewRows.length - 1} className="rounded-xl bg-orange-500 py-3 text-sm font-extrabold text-white disabled:opacity-30" data-ocid="payments.overview.next_button">Next</button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-3">
          <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3"><div><p className="text-sm font-black">{preview.title}</p><p className="text-[10px] text-[#8793a0]">Preview before saving</p></div><button type="button" onClick={() => setPreview(null)} className="rounded-lg bg-[#f1f3f5] p-2"><X size={16} /></button></div>
            <div className="min-h-0 flex-1 overflow-auto p-2"><div dangerouslySetInnerHTML={{ __html: `<style>${REPORT_CSS}</style>${preview.html}` }} /></div>
            <div className="flex gap-2 border-t p-3"><button type="button" onClick={() => setPreview(null)} className="flex-1 rounded-xl bg-[#eef1f4] py-3 text-sm font-extrabold">Close</button><button type="button" onClick={async () => { try { await saveReport(preview.title, preview.html); setPreview(null); } catch (error) { console.error(error); alert("Unable to create the PDF."); } }} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-extrabold text-white">Save PDF</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

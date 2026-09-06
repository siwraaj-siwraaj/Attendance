import { c as createLucideIcon, a as useContracts, g as useLabours, k as useAllAttendance, q as useAdvances, r as reactExports, j as jsxRuntimeExports, F as FileText, i as getAttendanceDisplay } from "./index-B9IM4GPI.js";
import { L as LoadingSpinner } from "./LoadingSpinner-lMPiyUbD.js";
import { C as ChevronDown } from "./chevron-down-8Hpens4w.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$5 = [
  ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2", key: "1nb95v" }],
  ["line", { x1: "8", x2: "16", y1: "6", y2: "6", key: "x4nwl0" }],
  ["line", { x1: "16", x2: "16", y1: "14", y2: "18", key: "wjye3r" }],
  ["path", { d: "M16 10h.01", key: "1m94wz" }],
  ["path", { d: "M12 10h.01", key: "1nrarc" }],
  ["path", { d: "M8 10h.01", key: "19clt8" }],
  ["path", { d: "M12 14h.01", key: "1etili" }],
  ["path", { d: "M8 14h.01", key: "6423bh" }],
  ["path", { d: "M12 18h.01", key: "mhygvu" }],
  ["path", { d: "M8 18h.01", key: "lrp35t" }]
];
const Calculator = createLucideIcon("calculator", __iconNode$5);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$4 = [
  ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
  ["path", { d: "M18 17V9", key: "2bz60n" }],
  ["path", { d: "M13 17V5", key: "1frdt8" }],
  ["path", { d: "M8 17v-3", key: "17ska0" }]
];
const ChartColumn = createLucideIcon("chart-column", __iconNode$4);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  ["path", { d: "M18 6 7 17l-5-5", key: "116fxf" }],
  ["path", { d: "m22 10-7.5 7.5L13 16", key: "ke71qq" }]
];
const CheckCheck = createLucideIcon("check-check", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]];
const ChevronUp = createLucideIcon("chevron-up", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M12 18v-6", key: "17g6i2" }],
  ["path", { d: "m9 15 3 3 3-3", key: "1npd3o" }]
];
const FileDown = createLucideIcon("file-down", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
];
const Search = createLucideIcon("search", __iconNode);
function calculateLabourSalary(contract, allRecords, labourId) {
  let total = 0;
  const workTypes = ["bed", "paper", "mesh", "custom"];
  for (const workType of workTypes) {
    const cols = contract.workColumns.filter(
      (c) => c.workType === workType
    );
    if (cols.length === 0) continue;
    const workTypeAmount = workType === "bed" ? contract.bedAmount : workType === "paper" ? contract.paperAmount : workType === "mesh" ? contract.meshAmount : 0;
    if (workTypeAmount === 0) continue;
    const colIds = new Set(cols.map((c) => c.id));
    const relevantRecords = allRecords.filter(
      (r) => r.contractId === contract.id && colIds.has(r.columnId)
    );
    const totalSum = relevantRecords.reduce((sum, r) => {
      if (r.value.__kind__ === "present") return sum + 1;
      if (r.value.__kind__ === "partial") return sum + r.value.partial;
      return sum;
    }, 0);
    if (totalSum === 0) continue;
    const labourRecords = relevantRecords.filter(
      (r) => r.labourId === labourId
    );
    const labourSum = labourRecords.reduce((sum, r) => {
      if (r.value.__kind__ === "present") return sum + 1;
      if (r.value.__kind__ === "partial") return sum + r.value.partial;
      return sum;
    }, 0);
    total += labourSum / totalSum * workTypeAmount;
  }
  return total;
}
const REPORT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: oklch(0.99 0.005 255); color: oklch(0.22 0.02 255); font-family: 'Figtree', 'Space Grotesk', -apple-system, sans-serif; font-size: 13px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report { background: oklch(0.99 0.005 255); color: oklch(0.22 0.02 255); font-family: 'Figtree', 'Space Grotesk', -apple-system, sans-serif; font-size: 13px; line-height: 1.5; max-width: 820px; margin: 0 auto; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(15,23,42,0.08); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report-header { background: oklch(0.26 0.05 250); color: oklch(0.98 0.005 255); padding: 20px 24px; border-radius: 0.5rem 0.5rem 0 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .report-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; margin: 0; line-height: 1.2; }
  .report-subtitle { font-size: 12px; opacity: 0.85; margin-top: 4px; font-weight: 500; }
  .report-brand { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-align: right; opacity: 0.9; }
  .report-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; padding: 16px 24px; border-bottom: 1px solid oklch(0.92 0.01 255); background: oklch(0.965 0.008 255); }
  .report-meta-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: oklch(0.46 0.02 255); margin-bottom: 2px; }
  .report-meta-value { font-size: 14px; font-weight: 700; color: oklch(0.22 0.02 255); }
  .report-body { padding: 16px 24px 24px; }
  .report-section { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: oklch(0.22 0.02 255); margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid oklch(0.26 0.05 250); }
  .report-section:first-child { margin-top: 0; }
  .report-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .report-table th { background: oklch(0.3 0.05 250); color: oklch(0.98 0.005 255); font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid oklch(0.3 0.05 250); white-space: nowrap; }
  .report-table td { padding: 7px 10px; border: 1px solid oklch(0.86 0.012 255); vertical-align: middle; }
  .report-table tbody tr:nth-child(even) { background: oklch(0.965 0.008 255); }
  .report-table .num, .report-table td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .report-table .center { text-align: center; }
  .report-total-row td { background: oklch(0.55 0.16 60); color: oklch(0.99 0 0); font-weight: 700; border-color: oklch(0.55 0.16 60); }
  .report-total-label { text-align: right; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
  .report-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 18px; }
  .report-summary-item { background: oklch(0.965 0.008 255); border: 1px solid oklch(0.86 0.012 255); border-radius: 0.375rem; padding: 10px 12px; }
  .report-summary-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: oklch(0.46 0.02 255); }
  .report-summary-value { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: oklch(0.55 0.16 60); margin-top: 2px; }
  .report-footer { padding: 12px 24px; border-top: 1px solid oklch(0.92 0.01 255); font-size: 10.5px; color: oklch(0.46 0.02 255); display: flex; justify-content: space-between; gap: 12px; }
  @media print { @page { size: A4; margin: 12mm; } body { background: oklch(0.99 0.005 255) !important; } .report { box-shadow: none; border-radius: 0; max-width: 100%; } .report-table tr, .report-section, .report-summary-item, .report-total-row { page-break-inside: avoid; } .report-table thead { display: table-header-group; } }
`;
function openPrintWindow(title, bodyHTML) {
  const parts = [];
  parts.push(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>`
  );
  parts.push(`<style>${REPORT_CSS}</style>`);
  parts.push("</head><body>");
  parts.push(bodyHTML);
  parts.push("</body></html>");
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups for this site to download the PDF");
    return;
  }
  win.document.write(parts.join(""));
  win.document.close();
  win.focus();
  win.print();
}
function PaymentsPage({
  selectedContractIds,
  setSelectedContractIds,
  paymentData,
  setPaymentData
}) {
  var _a, _b, _c, _d, _e;
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const { data: labours = [], isLoading: laboursLoading } = useLabours();
  const { data: allAttendance = [] } = useAllAttendance();
  const { data: advances = [] } = useAdvances();
  const [contractDropdownOpen, setContractDropdownOpen] = reactExports.useState(false);
  const [contractSearch, setContractSearch] = reactExports.useState("");
  const dropdownRef = reactExports.useRef(null);
  const [showOverview, setShowOverview] = reactExports.useState(false);
  const paymentsScrollRef = reactExports.useRef(null);
  const [overviewMode, setOverviewMode] = reactExports.useState(
    "oneByOne"
  );
  const [overviewIndex, setOverviewIndex] = reactExports.useState(0);
  const [selectedOverviewLabours, setSelectedOverviewLabours] = reactExports.useState(/* @__PURE__ */ new Set());
  const [excludeAdvances, setExcludeAdvances] = reactExports.useState(false);
  const [showAdvanceBreakdown, setShowAdvanceBreakdown] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!contractDropdownOpen) setContractSearch("");
  }, [contractDropdownOpen]);
  reactExports.useEffect(() => {
    if (!contractDropdownOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") setContractDropdownOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [contractDropdownOpen]);
  reactExports.useEffect(() => {
    if (!contractDropdownOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setContractDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contractDropdownOpen]);
  const selectedContracts = reactExports.useMemo(
    () => contracts.filter((c) => selectedContractIds.has(c.id.toString())),
    [contracts, selectedContractIds]
  );
  const toggleContractSelection = (id) => {
    setSelectedContractIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const unsettledContracts = reactExports.useMemo(
    () => contracts.filter((c) => !c.settled),
    [contracts]
  );
  const filteredDropdownContracts = reactExports.useMemo(() => {
    const q = contractSearch.trim().toLowerCase();
    if (!q) return unsettledContracts;
    return unsettledContracts.filter(
      (c) => c.name.toLowerCase().includes(q)
    );
  }, [unsettledContracts, contractSearch]);
  const allContractsSelected = unsettledContracts.length > 0 && selectedContractIds.size === unsettledContracts.length;
  const calculatePayments = () => {
    const selectedContractIdSet = new Set(
      selectedContracts.map((c) => c.id.toString())
    );
    const data = labours.map((labour) => {
      const contractSalaries = {};
      let totalNetSalary = 0;
      for (const contract of selectedContracts) {
        const salary = calculateLabourSalary(
          contract,
          allAttendance,
          labour.id
        );
        contractSalaries[contract.id.toString()] = salary;
        totalNetSalary += salary;
      }
      const totalAdvances = advances.filter((a) => {
        if (a.labourId !== labour.id) return false;
        return selectedContractIdSet.has(a.contractId.toString());
      }).reduce((sum, a) => sum + a.amount, 0);
      return {
        labour,
        contractSalaries,
        totalNetSalary,
        totalAdvances,
        amountPayable: excludeAdvances ? totalNetSalary : totalNetSalary - totalAdvances
      };
    });
    setPaymentData(data);
  };
  const visiblePaymentData = reactExports.useMemo(
    () => (paymentData || []).filter(
      (row) => row.totalNetSalary !== 0 || row.totalAdvances !== 0
    ),
    [paymentData]
  );
  const downloadPaymentPDF = () => {
    if (!paymentData) return;
    const fmt2 = (n) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    const rows = visiblePaymentData.map((row) => [
      row.labour.name,
      ...selectedContracts.map(
        (c) => fmt2(row.contractSalaries[c.id.toString()] || 0)
      ),
      fmt2(row.totalNetSalary),
      fmt2(row.totalAdvances),
      fmt2(row.amountPayable)
    ]);
    const totalRow = [
      "TOTAL",
      ...selectedContracts.map(
        (c) => fmt2(
          visiblePaymentData.reduce(
            (s, r) => s + (r.contractSalaries[c.id.toString()] || 0),
            0
          )
        )
      ),
      fmt2(
        visiblePaymentData.reduce(
          (s, r) => s + r.totalNetSalary,
          0
        )
      ),
      fmt2(
        visiblePaymentData.reduce(
          (s, r) => s + r.totalAdvances,
          0
        )
      ),
      fmt2(
        visiblePaymentData.reduce(
          (s, r) => s + r.amountPayable,
          0
        )
      )
    ];
    const generated = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const contractNames = selectedContracts.length > 0 ? selectedContracts.map((c) => c.name).join(", ") : "—";
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
        <div><div class="report-meta-label">Total Payable</div><div class="report-meta-value">${fmt2(visiblePaymentData.reduce((s, r) => s + r.amountPayable, 0))}</div></div>
      </div>`;
    const thead = `<tr><th>Labour</th>${selectedContracts.map((c) => `<th class="num">${c.name}</th>`).join(
      ""
    )}<th class="num">Net Salary</th><th class="num">Advances</th><th class="num">Payable</th></tr>`;
    const bodyRows = rows.map(
      (r) => `<tr>${r.map(
        (c, i) => `<td class="${i === 0 ? "" : "num"}">${c}</td>`
      ).join("")}</tr>`
    ).join("");
    const totalCells = totalRow.map(
      (c, i) => `<td class="${i === 0 ? "report-total-label" : "num"}">${c}</td>`
    ).join("");
    const summaryHTML = `
      <div class="report-summary">
        <div class="report-summary-item"><div class="report-summary-label">Total Net Salary</div><div class="report-summary-value">${fmt2(visiblePaymentData.reduce((s, r) => s + r.totalNetSalary, 0))}</div></div>
        <div class="report-summary-item"><div class="report-summary-label">Total Advances</div><div class="report-summary-value">${fmt2(visiblePaymentData.reduce((s, r) => s + r.totalAdvances, 0))}</div></div>
        <div class="report-summary-item"><div class="report-summary-label">Total Payable</div><div class="report-summary-value">${fmt2(visiblePaymentData.reduce((s, r) => s + r.amountPayable, 0))}</div></div>
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
    openPrintWindow("Payment Sheet", bodyHTML);
  };
  const downloadAttendancePDF = () => {
    if (!paymentData || selectedContracts.length === 0) return;
    const isValuePresent = (v) => !!v && getAttendanceDisplay(v) > 0;
    const contractVisibleCols = selectedContracts.map((contract) => {
      const cols = contract.workColumns || [];
      const visible = cols.filter(
        (col) => paymentData.some(
          (row) => {
            var _a2;
            return isValuePresent(
              (_a2 = allAttendance.find(
                (r) => r.contractId === contract.id && r.labourId === row.labour.id && r.columnId === col.id
              )) == null ? void 0 : _a2.value
            );
          }
        )
      );
      return { contract, visible };
    });
    const visibleRows = paymentData.filter(
      (row) => contractVisibleCols.some(
        ({ contract, visible }) => visible.some(
          (col) => {
            var _a2;
            return isValuePresent(
              (_a2 = allAttendance.find(
                (r) => r.contractId === contract.id && r.labourId === row.labour.id && r.columnId === col.id
              )) == null ? void 0 : _a2.value
            );
          }
        )
      )
    );
    const generated = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const contractNames = selectedContracts.map((c) => c.name).join(", ");
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
    let bodyRows = "";
    for (const row of visibleRows) {
      let cells = "";
      for (const { contract, visible } of contractVisibleCols) {
        if (visible.length === 0) {
          cells += '<td class="center">—</td>';
        } else {
          for (const col of visible) {
            const rec = allAttendance.find(
              (r) => r.contractId === contract.id && r.labourId === row.labour.id && r.columnId === col.id
            );
            const v = rec == null ? void 0 : rec.value;
            const display = !v ? "A" : v.__kind__ === "present" ? "P" : v.__kind__ === "partial" ? String(v.partial) : "A";
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
  const overviewTotals = reactExports.useMemo(() => {
    const selected = overviewData.filter(
      (r) => selectedOverviewLabours.has(r.labour.id.toString())
    );
    return {
      netSalary: selected.reduce(
        (s, r) => s + r.totalNetSalary,
        0
      ),
      advances: selected.reduce((s, r) => s + r.totalAdvances, 0),
      payable: selected.reduce((s, r) => s + r.amountPayable, 0)
    };
  }, [overviewData, selectedOverviewLabours]);
  const fmt = (n) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (contractsLoading || laboursLoading)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center pt-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { size: "lg" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 sticky top-0 z-30 bg-[#0a0f1e] px-4 pt-4 pb-3 border-b border-white/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-white", children: "Payments" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: calculatePayments,
            disabled: selectedContractIds.size === 0,
            className: "flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0",
            style: {
              background: selectedContractIds.size > 0 ? "linear-gradient(135deg, #f97316, #ea580c)" : "rgba(255,255,255,0.06)",
              color: selectedContractIds.size > 0 ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow: selectedContractIds.size > 0 ? "0 4px 20px rgba(249,115,22,0.35)" : "none"
            },
            "data-ocid": "payments.calculate_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calculator, { size: 14 }),
              "Calculate"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-3", ref: dropdownRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setContractDropdownOpen((o) => !o),
            "data-ocid": "payments.contract_select_trigger",
            className: "group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 bg-[#0d1220] border-white/15 text-white/85 hover:border-orange-500/60 hover:bg-[#101630]",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2.5 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-white/8 text-orange-400 group-hover:bg-orange-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { size: 15 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: selectedContractIds.size === 0 ? "Select Contracts" : `${selectedContractIds.size} contract${selectedContractIds.size === 1 ? "" : "s"} selected` })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2 shrink-0", children: [
                selectedContractIds.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold text-white",
                    style: {
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      boxShadow: "0 2px 8px rgba(249,115,22,0.4)"
                    },
                    children: selectedContractIds.size
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChevronDown,
                  {
                    size: 16,
                    className: `text-orange-400 transition-transform duration-200 ${contractDropdownOpen ? "rotate-180" : ""}`
                  }
                )
              ] })
            ]
          }
        ),
        contractDropdownOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute left-0 right-0 top-full mt-2 z-40 max-h-[60vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl",
            style: { background: "rgba(5,10,20,0.98)" },
            "data-ocid": "payments.contract_select_dropdown",
            children: unsettledContracts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/30 text-sm text-center py-10", children: "No active contracts" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative p-2.5 border-b border-white/10 shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Search,
                  {
                    size: 15,
                    className: "absolute left-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: contractSearch,
                    onChange: (e) => setContractSearch(e.target.value),
                    placeholder: "Search contracts by name…",
                    className: "w-full pl-9 pr-3 py-2 rounded-lg bg-[#0a0f1e] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-colors",
                    "data-ocid": "payments.contract_search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02] shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      if (allContractsSelected) {
                        setSelectedContractIds(/* @__PURE__ */ new Set());
                      } else {
                        setSelectedContractIds(
                          new Set(
                            unsettledContracts.map(
                              (c) => c.id.toString()
                            )
                          )
                        );
                      }
                    },
                    className: "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-300 hover:bg-orange-500/10 transition-colors",
                    "data-ocid": "payments.contract_select_all",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: `w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${allContractsSelected ? "bg-orange-500 border-orange-500" : "border-orange-500/60"}`,
                          children: allContractsSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "svg",
                            {
                              xmlns: "http://www.w3.org/2000/svg",
                              width: "10",
                              height: "10",
                              viewBox: "0 0 24 24",
                              fill: "none",
                              stroke: "white",
                              strokeWidth: "3.5",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              "aria-hidden": "true",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" })
                            }
                          )
                        }
                      ),
                      allContractsSelected ? "Clear All" : "Select All"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-white/40", children: [
                  filteredDropdownContracts.length,
                  " of",
                  " ",
                  unsettledContracts.length
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto min-h-0", children: filteredDropdownContracts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/30 text-sm text-center py-10", children: [
                "No contracts match “",
                contractSearch,
                "”"
              ] }) : filteredDropdownContracts.map((c, idx) => {
                var _a2;
                const id = c.id.toString();
                const isSelected = selectedContractIds.has(id);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "label",
                  {
                    className: `flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-white/5 last:border-0 transition-colors ${isSelected ? "bg-orange-500/10 hover:bg-orange-500/15" : "hover:bg-white/5"}`,
                    "data-ocid": `payments.contract_option.${idx + 1}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: `w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${isSelected ? "bg-orange-500 border-orange-500 scale-100" : "border-white/25 scale-95"}`,
                          children: isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "svg",
                            {
                              xmlns: "http://www.w3.org/2000/svg",
                              width: "12",
                              height: "12",
                              viewBox: "0 0 24 24",
                              fill: "none",
                              stroke: "white",
                              strokeWidth: "3",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              "aria-hidden": "true",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" })
                            }
                          )
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "checkbox",
                          className: "sr-only",
                          checked: isSelected,
                          onChange: () => toggleContractSelection(id)
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm text-white truncate min-w-0", children: c.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium text-orange-400/80 shrink-0 tabular-nums", children: [
                        "₹",
                        ((_a2 = c.contractAmount) == null ? void 0 : _a2.toLocaleString("en-IN")) ?? "—"
                      ] })
                    ]
                  },
                  id
                );
              }) })
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-4 pt-4 pb-24", children: paymentData && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: downloadPaymentPDF,
            className: "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500",
            "data-ocid": "payments.download_payment_sheet",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14 }),
              "Payment"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: downloadAttendancePDF,
            className: "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/20 text-white/60 hover:bg-white/5 hover:border-white/30",
            "data-ocid": "payments.download_attendance_sheet",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { size: 14 }),
              "Attendance"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setShowOverview(true);
              setOverviewIndex(0);
              setSelectedOverviewLabours(/* @__PURE__ */ new Set());
            },
            className: "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-orange-500/40 text-orange-400 hover:bg-orange-500/10",
            "data-ocid": "payments.overview_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 14 }),
              "Overview"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          ref: paymentsScrollRef,
          className: "swipeable-table-wrapper mt-0",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-max text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-orange-500/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left text-gray-400 py-2 pr-4 whitespace-nowrap", children: "Labour" }),
              selectedContracts.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "th",
                {
                  className: "text-right text-gray-400 py-2 px-2 whitespace-nowrap",
                  children: c.name
                },
                c.id.toString()
              )),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right text-gray-400 py-2 px-2 whitespace-nowrap", children: "Net Salary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right text-gray-400 py-2 px-2 whitespace-nowrap", children: "Advances" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right text-orange-400 py-2 pl-2 whitespace-nowrap", children: "Payable" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
              visiblePaymentData.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "tr",
                {
                  className: "border-b border-white/5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-white py-2 pr-4 whitespace-nowrap", children: row.labour.name }),
                    selectedContracts.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "td",
                      {
                        className: "text-right text-gray-300 py-2 px-2 whitespace-nowrap",
                        children: fmt(row.contractSalaries[c.id.toString()] || 0)
                      },
                      c.id.toString()
                    )),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right text-white py-2 px-2 whitespace-nowrap", children: fmt(row.totalNetSalary) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right text-red-400 py-2 px-2 whitespace-nowrap", children: fmt(row.totalAdvances) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right text-orange-400 font-semibold py-2 pl-2 whitespace-nowrap", children: fmt(row.amountPayable) })
                  ]
                },
                row.labour.id.toString()
              )),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t-2 border-orange-500/30 bg-white/5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-gray-400 font-bold py-2 pr-4 whitespace-nowrap", children: "TOTAL" }),
                selectedContracts.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "td",
                  {
                    className: "text-right text-gray-300 font-bold py-2 px-2 whitespace-nowrap",
                    children: fmt(
                      visiblePaymentData.reduce(
                        (s, r) => s + (r.contractSalaries[c.id.toString()] || 0),
                        0
                      )
                    )
                  },
                  c.id.toString()
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right text-white font-bold py-2 px-2 whitespace-nowrap", children: fmt(
                  visiblePaymentData.reduce(
                    (s, r) => s + r.totalNetSalary,
                    0
                  )
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right text-red-400 font-bold py-2 px-2 whitespace-nowrap", children: fmt(
                  visiblePaymentData.reduce(
                    (s, r) => s + r.totalAdvances,
                    0
                  )
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right text-orange-400 font-bold py-2 pl-2 whitespace-nowrap", children: fmt(
                  visiblePaymentData.reduce(
                    (s, r) => s + r.amountPayable,
                    0
                  )
                ) })
              ] })
            ] })
          ] })
        }
      )
    ] }) }),
    showOverview && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4",
        "data-ocid": "payments.overview.dialog",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "w-full max-w-md mx-auto max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-white/10",
            style: { background: "rgba(5,10,20,0.97)" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-t-2xl flex items-start justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white", children: "Payment Overview" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/70 mt-0.5", children: overviewMode === "oneByOne" ? `${overviewIndex + 1} / ${overviewData.length}` : `${selectedOverviewLabours.size} of ${overviewData.length} selected` })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowOverview(false),
                    className: "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors",
                    "data-ocid": "payments.overview.close_button",
                    "aria-label": "Close",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "svg",
                      {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2.5",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        "aria-hidden": "true",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                        ]
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-4 py-3 flex items-center justify-between border-b border-white/10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-white/80", children: "Include advances in net pay" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setExcludeAdvances((v) => !v),
                    "aria-label": excludeAdvances ? "Advances excluded" : "Advances included",
                    className: `relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${excludeAdvances ? "bg-white/20" : "bg-orange-500"}`,
                    "data-ocid": "payments.overview.include_advances_toggle",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${excludeAdvances ? "translate-x-0.5" : "translate-x-[22px]"}`
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-4 py-3 border-b border-white/10 flex gap-2 justify-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setOverviewMode("oneByOne"),
                    className: `rounded-full px-5 py-2 text-sm font-semibold transition-colors ${overviewMode === "oneByOne" ? "bg-orange-500 text-white" : "bg-white/10 text-white/60"}`,
                    "data-ocid": "payments.overview.mode_onebyone",
                    children: "One by One"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setOverviewMode("multiSelect"),
                    className: `rounded-full px-5 py-2 text-sm font-semibold transition-colors ${overviewMode === "multiSelect" ? "bg-orange-500 text-white" : "bg-white/10 text-white/60"}`,
                    "data-ocid": "payments.overview.mode_multiselect",
                    children: "Multi Select"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto min-h-0", children: [
                overviewMode === "oneByOne" && overviewData.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-4 space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-block bg-white/10 rounded-full px-4 py-1 text-white/60 text-sm", children: [
                    overviewIndex + 1,
                    " / ",
                    overviewData.length
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-4xl font-black text-white text-center mb-4", children: (_a = overviewData[overviewIndex]) == null ? void 0 : _a.labour.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl px-4 py-2.5 border-l-4 border-cyan-400 bg-white/5 flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-cyan-400 uppercase tracking-wider", children: "Gross Salary" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-cyan-300", children: fmt(((_b = overviewData[overviewIndex]) == null ? void 0 : _b.totalNetSalary) || 0) })
                  ] }),
                  !excludeAdvances && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowAdvanceBreakdown((s) => !s),
                        className: "w-full rounded-xl px-4 py-2.5 border-l-4 border-red-400 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors",
                        "data-ocid": "payments.overview.show_breakdown",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-red-400 uppercase tracking-wider", children: "Total Advances" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-red-300", children: fmt(
                              ((_c = overviewData[overviewIndex]) == null ? void 0 : _c.totalAdvances) || 0
                            ) }),
                            showAdvanceBreakdown ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 14, className: "text-red-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-red-400" })
                          ] })
                        ]
                      }
                    ),
                    showAdvanceBreakdown && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-left space-y-1.5 max-h-32 overflow-y-auto", children: (() => {
                      var _a2;
                      const labour = (_a2 = overviewData[overviewIndex]) == null ? void 0 : _a2.labour;
                      if (!labour) return null;
                      const labourAdvances = advances.filter(
                        (a) => a.labourId === labour.id
                      );
                      if (labourAdvances.length === 0) {
                        return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs text-center py-2", children: "No advances found" });
                      }
                      return labourAdvances.map((a) => {
                        const contract = contracts.find(
                          (c) => c.id === a.contractId
                        );
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "div",
                          {
                            className: "glass-card rounded-lg p-2 flex justify-between items-center",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white text-xs", children: fmt(a.amount) }),
                                a.note && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-[10px]", children: a.note }),
                                contract && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-500 text-[10px]", children: [
                                  contract.name,
                                  contract.settled ? " (Settled)" : ""
                                ] })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "span",
                                {
                                  className: `text-[10px] px-1.5 py-0.5 rounded-full ${(contract == null ? void 0 : contract.settled) ? "bg-gray-700 text-gray-400" : "bg-red-500/20 text-red-400"}`,
                                  children: (contract == null ? void 0 : contract.settled) ? "Cleared" : "Active"
                                }
                              )
                            ]
                          },
                          a.id.toString()
                        );
                      });
                    })() })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl p-4 border-2 border-orange-500 bg-orange-500/10 text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-orange-400 uppercase tracking-wider", children: "Net Pay" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-5xl font-black text-orange-400 mt-1", children: fmt(
                      excludeAdvances ? ((_d = overviewData[overviewIndex]) == null ? void 0 : _d.totalNetSalary) || 0 : ((_e = overviewData[overviewIndex]) == null ? void 0 : _e.amountPayable) || 0
                    ) })
                  ] })
                ] }),
                overviewMode === "multiSelect" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setSelectedOverviewLabours(/* @__PURE__ */ new Set()),
                      className: "rounded-full border border-orange-500 text-orange-400 text-sm px-4 py-1 hover:bg-orange-500/10 transition-colors",
                      "data-ocid": "payments.overview.deselect_all",
                      children: "Deselect All"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0", children: overviewData.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "label",
                    {
                      className: "flex items-center gap-3 py-2 px-4 cursor-pointer hover:bg-white/5 transition-colors",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: `w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedOverviewLabours.has(row.labour.id.toString()) ? "bg-orange-500 border-orange-500" : "border-orange-500"}`,
                            children: selectedOverviewLabours.has(
                              row.labour.id.toString()
                            ) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "svg",
                              {
                                xmlns: "http://www.w3.org/2000/svg",
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "white",
                                strokeWidth: "3",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                "aria-hidden": "true",
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" })
                              }
                            )
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "checkbox",
                            checked: selectedOverviewLabours.has(
                              row.labour.id.toString()
                            ),
                            onChange: () => {
                              setSelectedOverviewLabours((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.labour.id.toString()))
                                  next.delete(row.labour.id.toString());
                                else next.add(row.labour.id.toString());
                                return next;
                              });
                            },
                            className: "sr-only"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-white text-sm", children: row.labour.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-cyan-400 font-semibold text-sm", children: fmt(row.amountPayable) })
                      ]
                    },
                    row.labour.id.toString()
                  )) }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 border-t border-white/10", children: [
                overviewMode === "oneByOne" && /* Prev / Next buttons pinned to bottom */
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 p-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setOverviewIndex((i) => Math.max(0, i - 1)),
                      disabled: overviewIndex === 0,
                      className: "bg-white/10 text-white rounded-xl py-3 font-semibold hover:bg-white/20 transition-colors disabled:opacity-30",
                      "data-ocid": "payments.overview.prev_button",
                      children: "Prev"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setOverviewIndex(
                        (i) => Math.min(overviewData.length - 1, i + 1)
                      ),
                      disabled: overviewIndex === overviewData.length - 1,
                      className: "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 font-semibold disabled:opacity-40",
                      "data-ocid": "payments.overview.next_button",
                      children: "Next"
                    }
                  )
                ] }),
                overviewMode === "multiSelect" && /* Bottom summary section — fixed at bottom */
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 p-4 border-t border-white/10", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold text-orange-400 uppercase tracking-wider mb-2", children: [
                    "Selected: ",
                    selectedOverviewLabours.size,
                    " labours"
                  ] }),
                  !excludeAdvances && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/60", children: "Total Advances" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-cyan-400 font-semibold", children: fmt(overviewTotals.advances) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 mb-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-orange-400 uppercase tracking-wider", children: "Combined Net Pay" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-5xl font-black text-orange-400", children: fmt(
                      excludeAdvances ? overviewTotals.netSalary : overviewTotals.payable
                    ) })
                  ] })
                ] })
              ] })
            ]
          }
        )
      }
    )
  ] });
}
export {
  PaymentsPage as default
};

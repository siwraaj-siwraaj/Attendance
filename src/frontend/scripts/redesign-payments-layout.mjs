import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

if (source.includes("PAYMENTS_LAYOUT_COMPACT_V1")) {
  console.log("Payments compact layout already applied.");
  process.exit(0);
}

// Add More-menu state beside the existing Payments UI state.
const stateMarker = '  const [showOverview, setShowOverview] = useState(false);';
if (!source.includes(stateMarker)) {
  throw new Error("Payments overview state marker not found");
}
source = source.replace(
  stateMarker,
  `${stateMarker}\n  const [showMoreMenu, setShowMoreMenu] = useState(false);`,
);

// Replace the old three-button Payment/Attendance/PDF action row visually and
// functionally with one compact More control. The existing handlers are reused.
const calculatePattern = /(data-ocid="payments\.calculate_button"[\s\S]*?<\/button>)/;
const calculateMatch = source.match(calculatePattern);
if (!calculateMatch) {
  throw new Error("Payments Calculate button not found");
}

const moreControl = `

          <div className="payments-more-control relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu((open) => !open)}
              aria-expanded={showMoreMenu}
              aria-haspopup="menu"
              className="payments-more-button inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-400/25 bg-[#0d1a30] px-3 py-3 text-sm font-semibold text-white/90 shadow-sm transition-all duration-200 hover:border-orange-500/60 hover:bg-[#101d35]"
              data-ocid="payments.more_button"
            >
              <span aria-hidden="true" className="text-lg leading-none">⋮</span>
              <span>More</span>
              <ChevronDown size={14} className={showMoreMenu ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {showMoreMenu && (
              <div
                role="menu"
                className="payments-more-menu absolute right-0 top-[calc(100%+8px)] z-[200] w-52 overflow-hidden rounded-2xl border border-blue-400/25 bg-[#0d1a30]/98 p-1.5 shadow-2xl backdrop-blur-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowOverview(true);
                    setSelectedOverviewLabours(new Set());
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/90 transition-colors hover:bg-white/8"
                >
                  <BarChart3 size={18} className="text-orange-400" />
                  Overview
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMoreMenu(false);
                    downloadPaymentPDF();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/90 transition-colors hover:bg-white/8"
                >
                  <FileDown size={18} className="text-orange-400" />
                  Payment PDF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMoreMenu(false);
                    downloadAttendancePDF();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/90 transition-colors hover:bg-white/8"
                >
                  <FileDown size={18} className="text-orange-400" />
                  Attendance PDF
                </button>
              </div>
            )}
          </div>`;

source = source.replace(calculatePattern, `${calculateMatch[1]}${moreControl}`);

// Add a dedicated marker and CSS. CSS reorders the existing contract selector
// into the Payments title row, hides the old three-button row, and lets the
// payment table begin immediately after the compact header.
const css = `
const PAYMENTS_LAYOUT_COMPACT_V1 = true;
const PAYMENTS_LAYOUT_COMPACT_CSS = String.raw\`
  .payments-page-shell .payments-topbar { position: relative; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-height: 64px; }
  .payments-page-shell .payments-topbar > div:first-child { display: contents; }
  .payments-page-shell .payments-topbar .payments-title { order: 1; flex: 0 0 auto; font-size: clamp(1.15rem, 5vw, 1.5rem); }
  .payments-page-shell .payments-topbar > div:has([data-ocid="payments.contract_select_trigger"]) { order: 2; flex: 1 1 120px; min-width: 110px; max-width: 230px; margin: 0; }
  .payments-page-shell .payments-topbar [data-ocid="payments.contract_select_trigger"] { min-height: 46px; width: 100%; padding: 8px 10px; border-radius: 13px; font-size: 12px; }
  .payments-page-shell .payments-topbar [data-ocid="payments.calculate_button"] { order: 3; flex: 0 0 auto; min-height: 46px; height: 46px; padding: 0 13px; border-radius: 13px; font-size: 13px; }
  .payments-page-shell .payments-more-control { order: 4; flex: 0 0 auto; }
  .payments-page-shell .payments-more-button { min-height: 46px; height: 46px; padding: 0 10px; }
  .payments-page-shell .payments-more-menu { margin-top: 0; }
  .payments-page-shell .payments-action-tabs { display: none !important; }
  .payments-page-shell .payments-content { padding-top: 8px; }
  .payments-page-shell .payments-table-card { margin-top: 0 !important; }
  .payments-page-shell .payments-table-card table { min-width: max-content; }
  @media (max-width: 430px) {
    .payments-page-shell .payments-topbar { gap: 6px; padding-left: 10px; padding-right: 10px; }
    .payments-page-shell .payments-topbar .payments-title { font-size: 19px; }
    .payments-page-shell .payments-topbar > div:has([data-ocid="payments.contract_select_trigger"]) { flex-basis: 105px; min-width: 95px; max-width: 132px; }
    .payments-page-shell .payments-topbar [data-ocid="payments.contract_select_trigger"] { min-height: 44px; height: 44px; padding: 6px 8px; font-size: 11px; }
    .payments-page-shell .payments-topbar [data-ocid="payments.calculate_button"] { min-height: 44px; height: 44px; padding: 0 9px; font-size: 12px; }
    .payments-page-shell .payments-more-button { min-height: 44px; height: 44px; padding: 0 8px; font-size: 12px; }
    .payments-page-shell .payments-more-button > span:first-child { display: none; }
  }
\`;
`;

const marker = 'const REPORT_CSS = `';
if (!source.includes("PAYMENTS_LAYOUT_COMPACT_CSS")) {
  source = source.replace(marker, `${css}\n${marker}`);
}

if (!source.includes('<style>{PAYMENTS_LAYOUT_COMPACT_CSS}</style>')) {
  const styleMarker = '<style>{PAYMENT_UI_CSS}</style>';
  if (source.includes(styleMarker)) {
    source = source.replace(styleMarker, `${styleMarker}\n      <style>{PAYMENTS_LAYOUT_COMPACT_CSS}</style>`);
  } else {
    throw new Error("Payments UI style marker not found");
  }
}

fs.writeFileSync(paymentsPath, source);
console.log("Payments compact layout applied: contract selector beside title, More menu for Overview/Payment PDF/Attendance PDF, old action buttons hidden, table moved directly below header.");

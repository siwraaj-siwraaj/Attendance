import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const paymentsPath = path.resolve(here, "../src/pages/PaymentsPage.tsx");
let source = fs.readFileSync(paymentsPath, "utf8");

if (!source.includes("payments-more-control")) {
  throw new Error("Payments More control was not created by the previous layout step");
}

source = source.replace('<div className="flex items-center justify-between mb-3">', '<div className="payments-header-row">');
source = source.replace('<h1 className="text-xl font-bold text-white">Payments</h1>', '<h1 className="payments-title text-xl font-bold text-white">Payments</h1>');
source = source.replace('<div className="relative mb-3" ref={dropdownRef}>', '<div className="relative mb-3 payments-contract-wrapper" ref={dropdownRef}>');
source = source.replace('className="relative w-full mt-2 z-[200] max-h-[60vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"', 'className="payments-contract-dropdown absolute left-0 top-[calc(100%+8px)] z-[250] w-[min(360px,90vw)] max-h-[60vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"');

if (!source.includes("PAYMENTS_LAYOUT_COMPACT_V2_CSS")) {
  const css = String.raw`
const PAYMENTS_LAYOUT_COMPACT_V2_CSS = String.raw\`
  .payments-page-shell .payments-topbar {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(90px,1fr) auto auto;
    align-items: center;
    gap: 6px;
    min-height: 64px;
    padding-top: 10px;
    padding-bottom: 10px;
    overflow: visible;
  }
  .payments-page-shell .payments-header-row { display: contents; }
  .payments-page-shell .payments-title { order: 1; min-width: 0; white-space: nowrap; font-size: clamp(1.15rem, 5vw, 1.45rem); line-height: 1; }
  .payments-page-shell .payments-contract-wrapper { order: 2; min-width: 0; width: 100%; margin: 0 !important; position: relative; }
  .payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"] { width: 100%; min-width: 0; min-height: 44px; height: 44px; padding: 6px 8px; border-radius: 13px; font-size: 12px; }
  .payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"] > span:first-child { min-width: 0; }
  .payments-page-shell .payments-contract-dropdown { position: absolute !important; left: 0; top: calc(100% + 8px); width: min(360px, 90vw); max-height: min(60vh, 520px); margin: 0 !important; }
  .payments-page-shell [data-ocid="payments.calculate_button"] { order: 3; min-width: 104px; min-height: 44px; height: 44px; padding: 0 10px; border-radius: 13px; font-size: 12px; }
  .payments-page-shell .payments-more-control { order: 4; min-width: 68px; position: relative; }
  .payments-page-shell .payments-more-button { min-width: 68px; min-height: 44px; height: 44px; padding: 0 8px; border-radius: 13px; white-space: nowrap; }
  .payments-page-shell .payments-more-menu { position: absolute !important; right: 0; top: calc(100% + 8px); z-index: 300; width: 208px; margin: 0 !important; }
  .payments-page-shell .payments-action-tabs { display: none !important; }
  .payments-page-shell .payments-content { padding-top: 4px; }
  .payments-page-shell .payments-table-card { margin-top: 0 !important; }
  @media (max-width: 430px) {
    .payments-page-shell .payments-topbar { grid-template-columns: 82px minmax(88px,1fr) 104px 68px; gap: 5px; padding-left: 10px; padding-right: 10px; }
    .payments-page-shell .payments-title { font-size: 20px; }
    .payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"] { font-size: 11px; padding-left: 7px; padding-right: 7px; }
    .payments-page-shell .payments-more-button > span:first-child { display: none; }
  }
  @media (max-width: 370px) {
    .payments-page-shell .payments-topbar { grid-template-columns: 76px minmax(76px,1fr) 96px 62px; gap: 4px; padding-left: 8px; padding-right: 8px; }
    .payments-page-shell .payments-title { font-size: 18px; }
    .payments-page-shell [data-ocid="payments.calculate_button"] { min-width: 96px; padding-left: 7px; padding-right: 7px; }
    .payments-page-shell .payments-more-control, .payments-page-shell .payments-more-button { min-width: 62px; }
  }
\`;
`;
  const marker = 'const REPORT_CSS = `';
  if (!source.includes(marker)) throw new Error("Payments report CSS marker not found");
  source = source.replace(marker, `${css}\n${marker}`);
}

if (!source.includes('<style>{PAYMENTS_LAYOUT_COMPACT_V2_CSS}</style>')) {
  const styleMarker = '<style>{PAYMENT_UI_CSS}</style>';
  if (!source.includes(styleMarker)) throw new Error("Payments UI style marker not found");
  source = source.replace(styleMarker, `${styleMarker}\n      <style>{PAYMENTS_LAYOUT_COMPACT_V2_CSS}</style>`);
}

fs.writeFileSync(paymentsPath, source);
console.log("Payments layout V2 fixed: single-row header, absolute contract dropdown, anchored More menu.");

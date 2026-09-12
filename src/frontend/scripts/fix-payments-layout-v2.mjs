import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const paymentsPath = path.resolve(here, "../src/pages/PaymentsPage.tsx");
let source = fs.readFileSync(paymentsPath, "utf8");

if (!source.includes("payments-more-control")) throw new Error("Payments More control missing");
source = source.replace('<div className="flex items-center justify-between mb-3">', '<div className="payments-header-row">');
source = source.replace('<h1 className="text-xl font-bold text-white">Payments</h1>', '<h1 className="payments-title text-xl font-bold text-white">Payments</h1>');
source = source.replace('<div className="relative mb-3" ref={dropdownRef}>', '<div className="relative mb-3 payments-contract-wrapper" ref={dropdownRef}>');
source = source.replace('className="relative w-full mt-2 z-[200] max-h-[60vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"', 'className="payments-contract-dropdown absolute left-0 top-[calc(100%+8px)] z-[250] w-[min(360px,90vw)] max-h-[60vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"');

const css = `
const PAYMENTS_LAYOUT_COMPACT_V2_CSS = String.raw\`
.payments-page-shell .payments-topbar{position:relative!important;display:grid!important;grid-template-columns:minmax(76px,auto) minmax(78px,1fr) 98px 60px!important;align-items:center!important;gap:4px!important;width:100%!important;box-sizing:border-box!important;min-height:58px!important;height:auto!important;padding:6px!important;margin:0!important;overflow:visible!important;flex-wrap:nowrap!important}
.payments-page-shell .payments-topbar>div:first-child,.payments-page-shell .payments-header-row{display:contents!important}
.payments-page-shell .payments-title{order:1!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:19px!important;line-height:1!important;margin:0!important}
.payments-page-shell .payments-contract-wrapper{order:2!important;display:block!important;min-width:0!important;width:100%!important;margin:0!important;position:relative!important}
.payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"]{display:flex!important;width:100%!important;min-width:0!important;height:42px!important;min-height:42px!important;padding:5px 7px!important;border-radius:13px!important;font-size:10.5px!important;overflow:hidden!important}
.payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"]>span{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
.payments-page-shell .payments-contract-dropdown{position:absolute!important;left:0!important;right:auto!important;top:calc(100% + 6px)!important;width:min(330px,88vw)!important;max-width:calc(100vw - 24px)!important;max-height:min(58vh,500px)!important;margin:0!important;z-index:1000!important;transform:none!important}
.payments-page-shell [data-ocid="payments.calculate_button"]{order:3!important;min-width:98px!important;width:100%!important;height:42px!important;min-height:42px!important;padding:0 7px!important;border-radius:13px!important;font-size:11.5px!important;white-space:nowrap!important}
.payments-page-shell .payments-more-control{order:4!important;display:block!important;width:60px!important;min-width:60px!important;max-width:60px!important;position:relative!important;align-self:center!important}
.payments-page-shell .payments-more-button{display:inline-flex!important;width:60px!important;min-width:60px!important;height:42px!important;min-height:42px!important;padding:0 5px!important;border-radius:13px!important;font-size:11px!important;white-space:nowrap!important}
.payments-page-shell .payments-more-menu{position:absolute!important;left:auto!important;right:0!important;top:calc(100% + 6px)!important;z-index:1100!important;width:208px!important;max-width:calc(100vw - 16px)!important;margin:0!important;transform:none!important}
.payments-page-shell .payments-action-tabs{display:none!important}
.payments-page-shell .payments-content{padding-top:2px!important}
.payments-page-shell .payments-table-card{margin-top:0!important}
@media(max-width:370px){.payments-page-shell .payments-topbar{grid-template-columns:minmax(70px,auto) minmax(72px,1fr) 92px 56px!important;gap:3px!important;padding-left:5px!important;padding-right:5px!important}.payments-page-shell .payments-title{font-size:18px!important}.payments-page-shell [data-ocid="payments.calculate_button"]{min-width:92px!important;font-size:11px!important}.payments-page-shell .payments-more-control,.payments-page-shell .payments-more-button{width:56px!important;min-width:56px!important;max-width:56px!important}.payments-page-shell .payments-more-button{font-size:10px!important}}
\`;
`;

const marker = 'const REPORT_CSS = `';
if (!source.includes(marker)) throw new Error("Payments report CSS marker missing");
source = source.replace(marker, `${css}\n${marker}`);

const styleMarker = '<style>{PAYMENT_UI_CSS}</style>';
if (!source.includes(styleMarker)) throw new Error("Payments UI style marker missing");
source = source.replace(styleMarker, `${styleMarker}\n      <style>{PAYMENTS_LAYOUT_COMPACT_V2_CSS}</style>`);

fs.writeFileSync(paymentsPath, source);
console.log("Payments compact layout corrected: one-row mobile header, anchored dropdowns, no action-tab row.");

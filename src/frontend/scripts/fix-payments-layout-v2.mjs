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
source = source.replace('data-ocid="payments.contract_select_trigger"', 'data-ocid="payments.contract_select_trigger" aria-label="Select contracts"');

const css = `
const PAYMENTS_LAYOUT_COMPACT_V2_CSS = String.raw\`
/* Compact Payments header: title + contract arrow stay together; actions stay right. */
.payments-page-shell .payments-topbar{position:relative!important;display:flex!important;align-items:center!important;gap:4px!important;width:100%!important;box-sizing:border-box!important;min-height:58px!important;height:auto!important;padding:6px 8px!important;margin:0!important;overflow:visible!important;flex-wrap:nowrap!important}
.payments-page-shell .payments-topbar>div:first-child,.payments-page-shell .payments-header-row{display:contents!important}
.payments-page-shell .payments-title{order:1!important;flex:0 0 auto!important;min-width:0!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;font-size:19px!important;line-height:1!important;margin:0!important}
.payments-page-shell .payments-contract-wrapper{order:2!important;display:block!important;flex:0 0 30px!important;width:30px!important;min-width:30px!important;height:42px!important;margin:0!important;position:relative!important;align-self:center!important}
.payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"]{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:30px!important;min-width:30px!important;height:42px!important;min-height:42px!important;padding:0!important;margin:0!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;color:rgba(255,255,255,.95)!important;overflow:visible!important;cursor:pointer!important}
.payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"]>*{display:none!important}
.payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"]::after{content:""!important;display:inline-block!important;width:11px!important;height:11px!important;border:solid currentColor!important;border-width:0 2.5px 2.5px 0!important;transform:rotate(45deg)!important;margin-top:-6px!important;transition:transform .18s ease!important}
.payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"][aria-expanded="true"]::after{transform:rotate(225deg)!important;margin-top:6px!important}

/* New floating contract picker. */
.payments-page-shell .payments-contract-dropdown{position:absolute!important;left:0!important;right:auto!important;top:calc(100% + 7px)!important;width:min(310px,calc(100vw - 28px))!important;max-width:calc(100vw - 28px)!important;max-height:min(54vh,460px)!important;margin:0!important;padding:0!important;z-index:1000!important;transform:none!important;border:1px solid rgba(96,165,250,.28)!important;border-radius:20px!important;background:linear-gradient(145deg,rgba(10,20,38,.99),rgba(20,13,24,.99))!important;box-shadow:0 22px 55px rgba(0,0,0,.55),0 0 0 1px rgba(249,115,22,.06) inset!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
.payments-page-shell .payments-contract-dropdown>div:first-child{padding:14px 14px 12px!important;background:linear-gradient(135deg,rgba(249,115,22,.13),rgba(37,99,235,.08))!important;border-bottom:1px solid rgba(255,255,255,.08)!important}
.payments-page-shell .payments-contract-dropdown input{height:44px!important;border-radius:13px!important;border:1px solid rgba(148,163,184,.20)!important;background:rgba(2,8,23,.72)!important;color:white!important;font-size:14px!important;padding-left:42px!important;outline:none!important;box-shadow:none!important}
.payments-page-shell .payments-contract-dropdown input:focus{border-color:rgba(249,115,22,.60)!important;box-shadow:0 0 0 3px rgba(249,115,22,.10)!important}
.payments-page-shell .payments-contract-dropdown input::placeholder{color:rgba(148,163,184,.72)!important}
.payments-page-shell .payments-contract-dropdown>div:nth-child(2){padding:9px 12px!important;background:rgba(255,255,255,.025)!important;border-bottom:1px solid rgba(255,255,255,.07)!important}
.payments-page-shell .payments-contract-dropdown>div:nth-child(2) button{border-radius:11px!important;padding:9px 10px!important;color:#fdba74!important;font-weight:700!important;background:rgba(249,115,22,.08)!important}
.payments-page-shell .payments-contract-dropdown>div:nth-child(2) button:hover{background:rgba(249,115,22,.16)!important}
.payments-page-shell .payments-contract-dropdown>div:nth-child(3){padding:5px 7px 8px!important;overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-width:thin!important}
.payments-page-shell .payments-contract-dropdown>div:nth-child(3)>*{min-height:48px!important;border-radius:12px!important;margin:2px 0!important;padding:8px 10px!important;border:1px solid transparent!important;transition:background .16s ease,border-color .16s ease,transform .16s ease!important}
.payments-page-shell .payments-contract-dropdown>div:nth-child(3)>*:hover{background:rgba(255,255,255,.06)!important;border-color:rgba(96,165,250,.16)!important}
.payments-page-shell .payments-contract-dropdown label{color:rgba(255,255,255,.94)!important}
.payments-page-shell .payments-contract-dropdown button{color:rgba(255,255,255,.94)!important}
.payments-page-shell .payments-contract-dropdown svg{color:#fb923c!important;flex-shrink:0!important}

.payments-page-shell [data-ocid="payments.calculate_button"]{order:3!important;margin-left:auto!important;flex:0 0 98px!important;min-width:98px!important;width:98px!important;height:42px!important;min-height:42px!important;padding:0 7px!important;border-radius:13px!important;font-size:11.5px!important;white-space:nowrap!important}
.payments-page-shell .payments-more-control{order:4!important;display:block!important;flex:0 0 60px!important;width:60px!important;min-width:60px!important;max-width:60px!important;position:relative!important;align-self:center!important}
.payments-page-shell .payments-more-button{display:inline-flex!important;width:60px!important;min-width:60px!important;height:42px!important;min-height:42px!important;padding:0 5px!important;border-radius:13px!important;font-size:11px!important;white-space:nowrap!important}
.payments-page-shell .payments-more-menu{position:absolute!important;left:auto!important;right:0!important;top:calc(100% + 6px)!important;z-index:1100!important;width:208px!important;max-width:calc(100vw - 16px)!important;margin:0!important;transform:none!important}
.payments-page-shell .payments-action-tabs{display:none!important}
.payments-page-shell .payments-content{padding-top:2px!important}
.payments-page-shell .payments-table-card{margin-top:0!important}

@media(max-width:370px){
  .payments-page-shell .payments-topbar{gap:2px!important;padding-left:5px!important;padding-right:5px!important}
  .payments-page-shell .payments-title{font-size:18px!important}
  .payments-page-shell .payments-contract-wrapper{flex-basis:28px!important;width:28px!important;min-width:28px!important}
  .payments-page-shell .payments-contract-wrapper [data-ocid="payments.contract_select_trigger"]{width:28px!important;min-width:28px!important}
  .payments-page-shell [data-ocid="payments.calculate_button"]{flex-basis:92px!important;width:92px!important;min-width:92px!important;font-size:11px!important}
  .payments-page-shell .payments-more-control,.payments-page-shell .payments-more-button{flex-basis:56px!important;width:56px!important;min-width:56px!important;max-width:56px!important}
  .payments-page-shell .payments-more-button{font-size:10px!important}
  .payments-page-shell .payments-contract-dropdown{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important}
}
\`;
`;

const marker = 'const REPORT_CSS = `';
if (!source.includes(marker)) throw new Error("Payments report CSS marker missing");
source = source.replace(marker, `${css}\n${marker}`);

const styleMarker = '<style>{PAYMENT_UI_CSS}</style>';
if (!source.includes(styleMarker)) throw new Error("Payments UI style marker missing");
source = source.replace(styleMarker, `${styleMarker}\n      <style>{PAYMENTS_LAYOUT_COMPACT_V2_CSS}</style>`);

fs.writeFileSync(paymentsPath, source);
console.log("Payments contract picker redesigned as a compact floating glass panel anchored to the title arrow.");

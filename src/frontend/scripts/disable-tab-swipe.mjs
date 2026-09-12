import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const layoutPath = path.join(frontendRoot, "src/components/Layout.tsx");
const attendanceActorPath = path.join(frontendRoot, "src/hooks/supabaseActor.ts");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");
const attendancePagePath = path.join(frontendRoot, "src/pages/AttendancePage.tsx");
const adminPanelPath = path.join(frontendRoot, "src/pages/AdminPanel.tsx");

function removeJsxAttribute(input, attributeName) {
  let output = input;
  let searchFrom = 0;
  while (true) {
    const marker = `${attributeName}={`;
    const start = output.indexOf(marker, searchFrom);
    if (start === -1) break;
    let i = start + marker.length;
    let depth = 1;
    let quote = null;
    let template = false;
    for (; i < output.length; i += 1) {
      const ch = output[i];
      const prev = output[i - 1];
      if (quote) {
        if (ch === quote && prev !== "\\") quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === "`") {
        template = !template;
        continue;
      }
      if (template) continue;
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          break;
        }
      }
    }
    output = `${output.slice(0, start)}${output.slice(i)}`;
    searchFrom = start;
  }
  return output;
}

let source = fs.readFileSync(layoutPath, "utf8");

for (const attribute of ["onTouchStart", "onTouchMove", "onTouchEnd"]) {
  source = removeJsxAttribute(source, attribute);
}

source = source
  .replace(/\n  const touchStartX = useRef<number \| null>\(null\);/, "")
  .replace(/\n  const touchStartY = useRef<number \| null>\(null\);/, "")
  .replace(/\n  const swipeBlocked = useRef\(false\);/, "")
  .replace(/\n  const swipeIntent = useRef\(false\);/, "")
  .replace(/\n  const swipeTabs = allowedTabs;/, "")
  .replace(/\n  const swipeContentRef = useRef<HTMLDivElement \| null>\(null\);/, "")
  .replace(/\n  const mainRef = useRef<HTMLElement \| null>\(null\);/, "")
  .replace(/\sref=\{mainRef\}/g, "")
  .replace(/\sref=\{swipeContentRef\}/g, "")
  .replace(/, allowedTabs } = useAuth\(\);/, " } = useAuth();")
  .replace(/ style=\{\{ width: "100%", willChange: "transform" \}\}/g, "")
  .replace(/z-\[70px\]/g, "!z-[2147483647]")
  .replace(/z-\[60px\]/g, "!z-[2147483646]")
  .replace(/w-\[min\(78vw,320px\)\]/g, "!w-[320px] !max-w-[78vw]");

// The profile drawer must escape the React app's stacking/overflow contexts.
const portalPattern = /\{menuOpen\s*&&\s*<>[\s\S]*?<\/aside>\s*<\/>\}\s*\n\s*<main/;
const portalMatch = source.match(portalPattern);
if (portalMatch) {
  const block = portalMatch[0];
  const mainIndex = block.lastIndexOf("<main");
  const beforeMain = block.slice(0, mainIndex);
  const fragmentStart = beforeMain.indexOf("<>");
  const fragmentBody = beforeMain
    .slice(fragmentStart + 2)
    .replace(/\s*<\/>\}\s*$/, "");
  source = source.replace(
    portalPattern,
    `{menuOpen && typeof document !== "undefined" && createPortal(<>${fragmentBody}</>, document.body)}\n\n      <main`,
  );
} else if (!source.includes("createPortal(<>") && source.includes("{menuOpen &&")) {
  throw new Error("Unable to locate profile sidebar JSX for portal conversion");
}

if (!source.includes('import { createPortal } from "react-dom";')) {
  source = source.replace(
    'import { type ReactNode, useRef, useState } from "react";',
    'import { type ReactNode, useRef, useState } from "react";\nimport { createPortal } from "react-dom";',
  );
}

source = source.replace(
  'style={{ background: "linear-gradient(180deg, #08111f 0%, #0a1422 45%, #080e18 100%)", borderColor: "rgba(249,115,22,0.28)", boxShadow: "-18px 0 45px rgba(0,0,0,0.42)" }}',
  'style={{ position: "fixed", inset: "0 0 0 auto", width: "min(320px, 78vw)", height: "100dvh", zIndex: 2147483647, display: "flex", visibility: "visible", opacity: 1, transform: "none", pointerEvents: "auto", background: "linear-gradient(180deg, #08111f 0%, #0a1422 45%, #080e18 100%)", borderColor: "rgba(249,115,22,0.28)", boxShadow: "-18px 0 45px rgba(0,0,0,0.42)" }}',
);

fs.writeFileSync(layoutPath, source);

let attendanceActor = fs.readFileSync(attendanceActorPath, "utf8");
attendanceActor = attendanceActor
  .replace(
    'return { __kind__: "partial", value: Number(row.partial_value ?? 0) };',
    'return { __kind__: "partial", partial: Number(row.partial_value ?? 0) };',
  )
  .replace(
    'if (row.value_type === "absent") return { __kind__: "absent" };',
    'if (row.value_type === "absent") return { __kind__: "absent", absent: null };',
  )
  .replace(
    'return { __kind__: "present" };',
    'return { __kind__: "present", present: null };',
  );
fs.writeFileSync(attendanceActorPath, attendanceActor);

// Attendance page: keep the app-wide header untouched, but remove the solid
// background from Attendance's own frozen header/banner.
let attendancePage = fs.readFileSync(attendancePagePath, "utf8");
attendancePage = attendancePage.replace(
  'style={{ background: "#0a0f1e" }}',
  'style={{ background: "transparent" }}',
);
fs.writeFileSync(attendancePagePath, attendancePage);

// Admin panel: reserve enough space for the persistent bottom navigation so
// the last controls/cards are never hidden behind it.
let adminPanel = fs.readFileSync(adminPanelPath, "utf8");
adminPanel = adminPanel.replace(
  'className="flex-1 min-h-0 overflow-y-auto pb-safe" data-ocid="admin_panel"',
  'className="flex-1 min-h-0 overflow-y-auto pb-24 pb-safe" data-ocid="admin_panel"',
);
fs.writeFileSync(adminPanelPath, adminPanel);

// Payments page: keep every existing calculation, contract selector, PDF,
// Attendance, Overview and table behavior, but give the screen a cleaner
// business-app hierarchy. No summary cards are added.
let paymentsPage = fs.readFileSync(paymentsPath, "utf8");
if (!paymentsPage.includes("const PAYMENT_UI_CSS =")) {
  const paymentCss = String.raw`
const PAYMENT_UI_CSS = ` + "`" + String.raw`
  .payments-page-shell { background: radial-gradient(circle at 100% 0%, rgba(249,115,22,.07), transparent 30%), #0a0f1e; }
  .payments-page-shell > .payments-topbar { background: linear-gradient(180deg, rgba(10,15,30,.98), rgba(10,15,30,.92)); border-bottom-color: rgba(249,115,22,.14); }
  .payments-page-shell .payments-title { letter-spacing: -.025em; }
  .payments-page-shell .payments-contract-trigger { min-height: 68px; border-radius: 18px; background: linear-gradient(135deg, rgba(18,30,50,.92), rgba(10,17,31,.96)); border-color: rgba(148,163,184,.20); box-shadow: 0 10px 28px rgba(0,0,0,.16), inset 0 1px rgba(255,255,255,.035); }
  .payments-page-shell .payments-contract-trigger:hover { border-color: rgba(249,115,22,.48); }
  .payments-page-shell .payments-action-tabs { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; padding: 5px; margin-bottom: 14px; border: 1px solid rgba(148,163,184,.15); border-radius: 18px; background: rgba(13,20,35,.84); box-shadow: inset 0 1px rgba(255,255,255,.025); }
  .payments-page-shell .payments-action-tabs > button { min-height: 48px; border: 1px solid rgba(148,163,184,.16); border-radius: 13px; background: transparent; color: rgba(203,213,225,.72); font-weight: 700; }
  .payments-page-shell .payments-action-tabs > button:first-child { background: linear-gradient(135deg,#f97316,#ea580c); color: white; border-color: rgba(249,115,22,.75); box-shadow: 0 7px 18px rgba(249,115,22,.22); }
  .payments-page-shell .payments-action-tabs > button:last-child { color: #fb923c; border-color: rgba(249,115,22,.38); }
  .payments-page-shell .payments-table-card { overflow: auto; border: 1px solid rgba(96,165,250,.18); border-radius: 20px; background: linear-gradient(145deg, rgba(16,31,53,.88), rgba(8,16,29,.94)); box-shadow: 0 14px 34px rgba(0,0,0,.20); scrollbar-width: thin; scrollbar-color: rgba(249,115,22,.55) rgba(255,255,255,.04); }
  .payments-page-shell .payments-table-card table { border-collapse: separate; border-spacing: 0; min-width: max-content; width: 100%; }
  .payments-page-shell .payments-table-card thead { position: sticky; top: 0; z-index: 5; background: #13233b; }
  .payments-page-shell .payments-table-card th { height: 50px; padding: 0 14px; color: #9fb3d1; font-size: 12px; font-weight: 800; letter-spacing: .025em; border-bottom: 1px solid rgba(96,165,250,.18); }
  .payments-page-shell .payments-table-card td { height: 52px; padding: 0 14px; border-bottom: 1px solid rgba(148,163,184,.09); font-variant-numeric: tabular-nums; }
  .payments-page-shell .payments-table-card tbody tr:hover { background: rgba(255,255,255,.025); }
  .payments-page-shell .payments-table-card tbody tr:last-child td { border-bottom: 0; }
  .payments-page-shell .payments-table-card tbody tr:last-child { background: linear-gradient(90deg, rgba(249,115,22,.12), rgba(255,255,255,.035)); box-shadow: inset 3px 0 #f97316; }
  .payments-page-shell .payments-table-card tbody tr:last-child td { height: 58px; }
  .payments-page-shell .payments-table-card th:first-child,
  .payments-page-shell .payments-table-card td:first-child { position: sticky; left: 0; z-index: 4; background: #0f1b2d; }
  .payments-page-shell .payments-table-card thead th:first-child { z-index: 7; background: #13233b; }
  .payments-page-shell .payments-table-card tbody tr:last-child td:first-child { background: #162235; }
  .payments-page-shell .payments-content { padding-bottom: 112px; }
  @media (max-width: 640px) {
    .payments-page-shell .payments-topbar { padding-left: 14px; padding-right: 14px; }
    .payments-page-shell .payments-action-tabs > button { font-size: 12px; padding-left: 6px; padding-right: 6px; }
    .payments-page-shell .payments-table-card th, .payments-page-shell .payments-table-card td { padding-left: 12px; padding-right: 12px; }
  }
` + "`" + ";\n";
  paymentsPage = paymentsPage.replace(
    'export default function PaymentsPage({',
    `${paymentCss}\nexport default function PaymentsPage({`,
  );
}

paymentsPage = paymentsPage
  .replace(
    '<div className="flex flex-col h-full overflow-hidden">',
    '<div className="flex flex-col h-full overflow-hidden payments-page-shell">',
  )
  .replace(
    '<div className="shrink-0 sticky top-0 z-[100] bg-[#0a0f1e] px-4 pt-4 pb-3 border-b border-white/10">',
    '<div className="shrink-0 sticky top-0 z-[100] payments-topbar px-4 pt-4 pb-4 border-b border-white/10">',
  )
  .replace(
    '<h1 className="text-xl font-bold text-white">Payments</h1>',
    '<h1 className="text-2xl font-extrabold text-white payments-title">Payments</h1>',
  )
  .replace(
    'className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 bg-[#0d1220] border-white/15 text-white/85 hover:border-orange-500/60 hover:bg-[#101630]"',
    'className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 payments-contract-trigger bg-[#0d1220] border-white/15 text-white/85 hover:border-orange-500/60 hover:bg-[#101630]"',
  )
  .replace(
    '<div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">',
    '<div className="flex-1 overflow-y-auto px-4 pt-4 payments-content">',
  )
  .replace(
    '<div className="flex gap-2 mb-3">',
    '<div className="flex gap-2 mb-3 payments-action-tabs">',
  )
  .replace(
    'className="swipeable-table-wrapper mt-0"',
    'className="swipeable-table-wrapper mt-0 payments-table-card"',
  );

if (!paymentsPage.includes('<style>{PAYMENT_UI_CSS}</style>')) {
  paymentsPage = paymentsPage.replace(
    'return (\n    <div className="flex flex-col h-full overflow-hidden payments-page-shell">',
    'return (\n    <>\n      <style>{PAYMENT_UI_CSS}</style>\n      <div className="flex flex-col h-full overflow-hidden payments-page-shell">',
  );
  paymentsPage = paymentsPage.replace(
    '      {/* Labour Payment Overview Dialog */}',
    '      </div>\n\n      {/* Labour Payment Overview Dialog */}',
  );
  // The dialog belongs outside the main page shell; close the fragment at the
  // component return boundary. The exact final close is normalized below.
  paymentsPage = paymentsPage.replace(/\n  \);\n}\n$/, '\n    </>\n  );\n}\n');
}
fs.writeFileSync(paymentsPath, paymentsPage);

console.log("Horizontal tab swipe disabled; attendance values normalized; profile sidebar rendered in a body-level portal; Payments layout polished; admin bottom spacing added; Attendance header background removed.");

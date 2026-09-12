import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const layoutPath = path.join(frontendRoot, "src/components/Layout.tsx");
const attendanceActorPath = path.join(frontendRoot, "src/hooks/supabaseActor.ts");

let source = fs.readFileSync(layoutPath, "utf8");

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

console.log("Horizontal tab swipe disabled; attendance values normalized; profile sidebar rendered in a body-level portal.");

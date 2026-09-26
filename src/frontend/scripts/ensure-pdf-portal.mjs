import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

// PaymentsPage has a self-contained PDF preview in the redesigned UI.
// Keep this legacy migration script non-destructive when that implementation is present.
if (!source.includes("showPaymentPdfPreview")) {
  console.log("PaymentsPage uses the current PDF preview implementation; no legacy portal migration needed.");
  process.exit(0);
}

if (!source.includes('from "react-dom"')) {
  source = source.replace(
    'import { useEffect, useMemo, useRef, useState } from "react";',
    'import { useEffect, useMemo, useRef, useState } from "react";\nimport { createPortal } from "react-dom";',
  );
}

const start = source.lastIndexOf("    {showPaymentPdfPreview && (");
const close = "\n  </div>\n)}";
const end = source.indexOf(close, start);

if (start === -1 || end === -1) {
  throw new Error("Could not locate the PaymentsPage PDF preview block; refusing to modify the file.");
}

const portal = `    {showPaymentPdfPreview &&
      typeof document !== "undefined" &&
      createPortal(
        <div data-pdf-preview data-pdf-viewer="fullscreen">
          {/* Legacy portal wrapper retained for older PaymentsPage implementations. */}
          <div
            data-pdf-scroll
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2147483647,
              width: "100vw",
              height: "100dvh",
              overflow: "auto",
              background: "#ffffff",
              touchAction: "pan-x pan-y",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="report" dangerouslySetInnerHTML={{ __html: paymentPreviewHTML }} />
          </div>
        </div>,
        document.body,
      )}`;

source = source.slice(0, start) + portal + source.slice(end + close.length);
fs.writeFileSync(paymentsPath, source);
console.log("PDF preview is compiled as an isolated fullscreen React portal.");

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

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
        <div
          data-pdf-preview
          className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden"
          style={{ width: "100vw", height: "100dvh", touchAction: "auto" }}
        >
          <div
            className="min-h-0 min-w-0 overflow-auto bg-white"
            style={{ flex: "1 1 0%", height: 0, WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
          >
            <div
              className="report"
              style={{ width: 820, minWidth: 820, maxWidth: 820, margin: "0 auto" }}
              dangerouslySetInnerHTML={{ __html: paymentPreviewHTML }}
            />
          </div>

          <div
            className="shrink-0 flex flex-row items-center gap-3 border-t bg-white"
            style={{ flex: "0 0 auto", height: "auto", padding: "10px 12px max(10px, env(safe-area-inset-bottom))", touchAction: "manipulation" }}
          >
            <button
              type="button"
              onClick={() => setShowPaymentPdfPreview(false)}
              className="flex-1 min-w-0 h-11 rounded-lg bg-gray-500 px-4 font-semibold text-white"
              style={{ flex: "1 1 0%", height: 44, minHeight: 44, maxHeight: 44 }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={async () => {
                await openPrintWindow(
                  paymentPreviewHTML.includes("Attendance Report")
                    ? "Attendance Sheet"
                    : "Payment Sheet",
                  paymentPreviewHTML,
                );
                setShowPaymentPdfPreview(false);
              }}
              className="flex-1 min-w-0 h-11 rounded-lg bg-orange-500 px-4 font-semibold text-white"
              style={{ flex: "1 1 0%", height: 44, minHeight: 44, maxHeight: 44 }}
            >
              Save PDF
            </button>
          </div>
        </div>,
        document.body,
      )}`;

source = source.slice(0, start) + portal + source.slice(end + close.length);
fs.writeFileSync(paymentsPath, source);
console.log("PDF preview is compiled as a React portal mounted directly under document.body.");

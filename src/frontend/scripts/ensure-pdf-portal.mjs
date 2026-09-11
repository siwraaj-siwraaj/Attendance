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

const start = source.lastIndexOf("      {showPaymentPdfPreview && (");
const endMarker = "\n)}    \n    </div>\n  );";
const end = source.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  throw new Error("Could not locate the PaymentsPage PDF preview block; refusing to modify the file.");
}

const portal = `      {showPaymentPdfPreview &&
        typeof document !== "undefined" &&
        createPortal(\n          <div\n            data-pdf-preview\n            className="fixed inset-0 z-[9999] bg-white flex flex-col"\n            style={{ width: "100vw", height: "100dvh", touchAction: "auto" }}\n          >\n            <div className="flex-1 min-h-0 min-w-0 overflow-auto bg-white" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>\n              <div\n                className="report"\n                style={{ width: 820, minWidth: 820, maxWidth: 820, margin: "0 auto" }}\n                dangerouslySetInnerHTML={{ __html: paymentPreviewHTML }}\n              />\n            </div>\n\n            <div className="flex shrink-0 gap-3 p-4 border-t bg-white" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))", touchAction: "manipulation" }}>\n              <button\n                type="button"\n                onClick={() => setShowPaymentPdfPreview(false)}\n                className="flex-1 rounded-lg bg-gray-500 px-4 py-3 font-semibold text-white"\n              >\n                Close\n              </button>\n\n              <button\n                type="button"\n                onClick={async () => {\n                  await openPrintWindow(\n                    paymentPreviewHTML.includes("Attendance Report")\n                      ? "Attendance Sheet"\n                      : "Payment Sheet",\n                    paymentPreviewHTML,\n                  );\n                  setShowPaymentPdfPreview(false);\n                }}\n                className="flex-1 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white"\n              >\n                Save PDF\n              </button>\n            </div>\n          </div>,\n          document.body,\n        )}`;

source = source.slice(0, start) + portal + source.slice(end);
fs.writeFileSync(paymentsPath, source);
console.log("PDF preview is compiled as a React portal mounted directly under document.body.");

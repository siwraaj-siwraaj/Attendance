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
          data-pdf-viewer="fullscreen"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            width: "100vw",
            height: "100dvh",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#ffffff",
            opacity: 1,
            visibility: "visible",
            transform: "none",
            isolation: "isolate",
            touchAction: "auto",
            boxSizing: "border-box",
          }}
        >
          {/* The Android activity is edge-to-edge. Reserve the system status-bar
              area so report content never sits underneath the clock/icons. */}
          <div
            data-pdf-status-spacer
            aria-hidden="true"
            style={{
              flex: "0 0 auto",
              width: "100%",
              height: "max(24px, env(safe-area-inset-top))",
              minHeight: "max(24px, env(safe-area-inset-top))",
              background: "#26384f",
            }}
          />

          <div
            data-pdf-scroll
            style={{
              flex: "1 1 0%",
              minHeight: 0,
              minWidth: 0,
              width: "100%",
              height: 0,
              overflow: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              background: "#ffffff",
              touchAction: "pan-x pan-y",
            }}
          >
            <div
              className="report"
              style={{
                width: 820,
                minWidth: 820,
                maxWidth: 820,
                margin: "0 auto",
                background: "#ffffff",
                opacity: 1,
              }}
              dangerouslySetInnerHTML={{ __html: paymentPreviewHTML }}
            />
          </div>

          <div
            data-pdf-actions
            style={{
              flex: "0 0 auto",
              width: "100%",
              minHeight: 64,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "stretch",
              gap: 10,
              padding: "10px 12px max(10px, env(safe-area-inset-bottom))",
              borderTop: "1px solid #e5e7eb",
              background: "#ffffff",
              overflow: "hidden",
              touchAction: "manipulation",
            }}
          >
            <button
              type="button"
              onClick={() => setShowPaymentPdfPreview(false)}
              style={{
                flex: "1 1 0%",
                width: 0,
                minWidth: 0,
                height: 44,
                minHeight: 44,
                maxHeight: 44,
                margin: 0,
                border: 0,
                borderRadius: 10,
                background: "#6b7280",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 600,
              }}
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
              style={{
                flex: "1 1 0%",
                width: 0,
                minWidth: 0,
                height: 44,
                minHeight: 44,
                maxHeight: 44,
                margin: 0,
                border: 0,
                borderRadius: 10,
                background: "#f97316",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Save PDF
            </button>
          </div>
        </div>,
        document.body,
      )}`;

source = source.slice(0, start) + portal + source.slice(end + close.length);

// Attendance reports can be substantially larger than payment reports.
// Passing the generated PDF as base64 through the Capacitor bridge can exhaust
// Android WebView/native memory and terminate the app. Keep the existing direct
// Downloads flow for Payment PDF, but use the PDF generator's native share flow
// for Attendance PDF so the large PDF remains native instead of crossing JS as
// a giant base64 string.
const nativeAttendancePdf = `const nativeAttendancePdf = title.includes("Attendance Sheet");`;
const generatedPdfMarker = `      const result = await PdfGenerator.fromData({
  data: html,
  documentSize: "A4",
  orientation: "portrait",
  type: "base64",
  fileName: filename,
});`;
const generatedPdfReplacement = `      ${nativeAttendancePdf}
      const result = await PdfGenerator.fromData({
  data: html,
  documentSize: "A4",
  orientation: "portrait",
  type: nativeAttendancePdf ? "share" : "base64",
  fileName: filename,
});

if (nativeAttendancePdf) {
  if (result.type !== "share" || result.completed === false) {
    throw new Error("Attendance PDF share/save flow was cancelled or failed");
  }
  return;
}`;

if (source.includes(generatedPdfMarker) && !source.includes("const nativeAttendancePdf")) {
  source = source.replace(generatedPdfMarker, generatedPdfReplacement);
}

fs.writeFileSync(paymentsPath, source);
console.log("PDF preview is compiled as an isolated fullscreen React portal with a dedicated status-bar safe area and native Attendance PDF save flow.");

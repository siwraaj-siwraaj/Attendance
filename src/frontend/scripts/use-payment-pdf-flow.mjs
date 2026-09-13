import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

if (source.includes('const isAttendancePdf = title === "Attendance Sheet";')) {
  console.log("Attendance PDF native-safe flow already present; leaving PaymentsPage.tsx unchanged.");
  process.exit(0);
}

const nativeBlock = `const result = await PdfGenerator.fromData({
  data: html,
  documentSize: "A4",
  orientation: "portrait",
  type: "base64",
  fileName: filename,
});`;

const safeNativeBlock = `const isAttendancePdf = title === "Attendance Sheet";
      if (isAttendancePdf) {
        // Attendance reports can be large. Keep the PDF entirely on the native
        // side: the patched PdfGenerator writes its temporary PDF directly to
        // Android Downloads. This avoids creating a large base64 string in the
        // WebView, which can terminate the Android process under memory pressure.
        const nativeResult = await PdfGenerator.fromData({
          data: html,
          documentSize: "A4",
          orientation: "portrait",
          type: "share",
          fileName: filename,
        });

        if ((nativeResult as any)?.type !== "share" || !(nativeResult as any)?.completed) {
          throw new Error("Android did not complete saving the Attendance PDF");
        }

        return;
      }

      ${nativeBlock}`;

if (!source.includes(nativeBlock)) {
  throw new Error("Could not locate the native base64 PDF block; refusing to build.");
}

source = source.replace(nativeBlock, safeNativeBlock);
fs.writeFileSync(paymentsPath, source);
console.log("Attendance PDF now uses native Downloads output only; the base64/FileSharer fallback is disabled to prevent Android memory crashes.");
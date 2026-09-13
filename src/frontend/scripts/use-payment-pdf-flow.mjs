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
        // Attendance reports can be much larger than payment reports. Avoid
        // creating a large base64 PDF in the WebView/JS bridge, which can
        // duplicate the PDF in memory and terminate Android's WebView process.
        // The native plugin writes the PDF directly to Downloads and returns a
        // content:// URI for FileOpener.
        const result = await PdfGenerator.fromData({
          data: html,
          documentSize: "A4",
          orientation: "portrait",
          type: "share",
          fileName: filename,
        });

        const nativeUri = (result as any)?.uri as string | undefined;
        if (!nativeUri) {
          throw new Error("Attendance PDF was generated but no native file URI was returned");
        }

        await FileOpener.open({
          filePath: nativeUri,
          contentType: "application/pdf",
          openWithDefault: true,
        });
        return;
      }

      ${nativeBlock}`;

if (!source.includes(nativeBlock)) {
  throw new Error("Could not locate the native base64 PDF block; refusing to build.");
}

source = source.replace(nativeBlock, safeNativeBlock);
fs.writeFileSync(paymentsPath, source);
console.log("Attendance PDF now uses native Downloads output to avoid the Android base64 memory crash; Payment PDF keeps its existing flow.");
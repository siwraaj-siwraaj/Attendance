import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

if (source.includes('const isAttendancePdf = title === "Attendance Sheet";')) {
  console.log("Attendance PDF save flow already present; leaving PaymentsPage.tsx unchanged.");
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
        // Attendance PDF saving must finish at the Android Downloads save step.
        // Do not open the generated file here: a missing/default PDF viewer can
        // reject the open operation and incorrectly turn a successful save into
        // the generic "Unable to create the PDF" error.
        const result = await PdfGenerator.fromData({
          data: html,
          documentSize: "A4",
          orientation: "portrait",
          type: "base64",
          fileName: filename,
        });

        if (result.type !== "base64" || !result.base64) {
          throw new Error("Attendance PDF generator did not return PDF data");
        }

        // @capgo/capacitor-file-sharer officially supports Android Downloads
        // and returns only after the file has been saved. This is the complete
        // save operation; no FileOpener handoff is required for Save PDF.
        await FileSharer.save({
          filename,
          contentType: "application/pdf",
          base64Data: result.base64,
          android: {
            saveDirectory: "downloads",
            relativePath: "Download",
          },
        });
        return;
      }

      ${nativeBlock}`;

if (!source.includes(nativeBlock)) {
  throw new Error("Could not locate the native base64 PDF block; refusing to build.");
}

source = source.replace(nativeBlock, safeNativeBlock);
fs.writeFileSync(paymentsPath, source);
console.log("Attendance PDF save now generates base64 and saves directly to Android Downloads without opening the file.");
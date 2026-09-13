import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

const before = source;
source = source.replace(
  /const nativeAttendancePdf = title\.includes\("Attendance Sheet"\);[\s\S]*?if \(nativeAttendancePdf\) \{[\s\S]*?\n\}/,
  `const isAttendancePdf = title === "Attendance Sheet";
      if (isAttendancePdf) {
        // Attendance reports can be much larger than payment reports. Do not
        // materialize the generated PDF as base64 in the WebView/JS bridge:
        // that duplicates the PDF in memory and can terminate Android's
        // WebView process. The native plugin writes the PDF directly to the
        // public Downloads collection and returns a content:// URI.
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

      const result = await PdfGenerator.fromData({
  data: html,
  documentSize: "A4",
  orientation: "portrait",
  type: "base64",
  fileName: filename,
});`,
);

if (source === before && source.includes("nativeAttendancePdf")) {
  throw new Error("Could not replace the Attendance-specific PDF flow; refusing to build.");
}

fs.writeFileSync(paymentsPath, source);
console.log("Attendance PDF uses native file output to avoid the Android base64 memory crash; Payment PDF keeps its existing flow.");
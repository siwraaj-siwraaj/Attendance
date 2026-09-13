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
        // Attendance reports can be much larger than payment reports. Prefer
        // the patched native Downloads path so the PDF is never copied through
        // the WebView as base64 during the normal Android flow.
        try {
          const nativeResult = await PdfGenerator.fromData({
            data: html,
            documentSize: "A4",
            orientation: "portrait",
            type: "share",
            fileName: filename,
          });

          const nativeUri = (nativeResult as any)?.uri as string | undefined;
          if (nativeUri) {
            await FileOpener.open({
              filePath: nativeUri,
              contentType: "application/pdf",
              openWithDefault: true,
            });
            return;
          }

          console.warn("Native Attendance PDF did not return a file URI; using the save fallback.");
        } catch (nativeError) {
          console.warn("Native Attendance PDF save failed; using the save fallback:", nativeError);
        }

        // Fallback for devices where the patched native MediaStore path is not
        // available. FileSharer writes directly to Android Downloads and avoids
        // requiring a user-selected document provider.
        const fallbackResult = await PdfGenerator.fromData({
          data: html,
          documentSize: "A4",
          orientation: "portrait",
          type: "base64",
          fileName: filename,
        });

        if (fallbackResult.type !== "base64" || !fallbackResult.base64) {
          throw new Error("Attendance PDF fallback did not return PDF data");
        }

        const saved = await FileSharer.save({
          filename,
          contentType: "application/pdf",
          base64Data: fallbackResult.base64,
          android: {
            saveDirectory: "downloads",
            relativePath: "Download",
          },
        });

        const savedUri = (saved as any)?.uri as string | undefined;
        if (savedUri) {
          await FileOpener.open({
            filePath: savedUri,
            contentType: "application/pdf",
            openWithDefault: true,
          });
        }
        return;
      }

      ${nativeBlock}`;

if (!source.includes(nativeBlock)) {
  throw new Error("Could not locate the native base64 PDF block; refusing to build.");
}

source = source.replace(nativeBlock, safeNativeBlock);
fs.writeFileSync(paymentsPath, source);
console.log("Attendance PDF now uses native Downloads output first, with a FileSharer fallback when native output is unavailable.");
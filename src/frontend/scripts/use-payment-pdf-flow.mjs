import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

if (!source.includes('import { registerPlugin } from "@capacitor/core";')) {
  const importMarker = 'import { FileOpener } from "@capacitor-community/file-opener";';
  if (!source.includes(importMarker)) {
    throw new Error("Could not locate PaymentsPage native imports; refusing to build.");
  }
  source = source.replace(
    importMarker,
    `${importMarker}\nimport { registerPlugin } from "@capacitor/core";\n\nconst AttendancePdf = registerPlugin<{\n  save(options: { html: string; filename: string }): Promise<{ uri: string; filename: string }>;\n}>("AttendancePdf");`,
  );
}

const nativeBlock = `const result = await PdfGenerator.fromData({
  data: html,
  documentSize: "A4",
  orientation: "portrait",
  type: "base64",
  fileName: filename,
});`;

const attendanceStart = source.indexOf('const isAttendancePdf = title === "Attendance Sheet";');
if (attendanceStart !== -1) {
  const nativeStart = source.indexOf("\n      const result = await PdfGenerator.fromData({", attendanceStart);
  if (nativeStart !== -1) {
    const replacement = `const isAttendancePdf = title === "Attendance Sheet";
      if (isAttendancePdf) {
        const nativeResult = await AttendancePdf.save({
          html,
          filename,
        });
        if (!nativeResult?.uri) {
          throw new Error("Android did not return the saved Attendance PDF location");
        }
        return;
      }`;
    source = source.slice(0, attendanceStart) + replacement + source.slice(nativeStart);
  }
}

if (!source.includes('const isAttendancePdf = title === "Attendance Sheet";')) {
  if (!source.includes(nativeBlock)) {
    throw new Error("Could not locate the native PDF block; refusing to build.");
  }

  const safeNativeBlock = `const isAttendancePdf = title === "Attendance Sheet";
      if (isAttendancePdf) {
        const nativeResult = await AttendancePdf.save({
          html,
          filename,
        });
        if (!nativeResult?.uri) {
          throw new Error("Android did not return the saved Attendance PDF location");
        }
        return;
      }

      ${nativeBlock}`;

  source = source.replace(nativeBlock, safeNativeBlock);
}

fs.writeFileSync(paymentsPath, source);
console.log("Attendance PDF uses the dedicated native Android plugin; third-party PDF save/share is bypassed.");

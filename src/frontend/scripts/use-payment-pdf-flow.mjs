import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const paymentsPath = path.join(frontendRoot, "src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

const nativeBlock = `const result = await PdfGenerator.fromData({
  data: html,
  documentSize: "A4",
  orientation: "portrait",
  type: "base64",
  fileName: filename,
});`;

if (source.includes('const isAttendancePdf = title === "Attendance Sheet";')) {
  const oldStart = source.indexOf('const isAttendancePdf = title === "Attendance Sheet";');
  const oldEnd = source.indexOf(`\n\n      ${nativeBlock}`.replace(/\\n/g, "\n"), oldStart);
  if (oldStart !== -1 && oldEnd !== -1) {
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
    source = source.slice(0, oldStart) + replacement + source.slice(oldEnd);
  }
}

if (!source.includes('import { registerPlugin } from "@capacitor/core";')) {
  source = source.replace(
    'import { FileOpener } from "@capacitor-community/file-opener";\n',
    'import { FileOpener } from "@capacitor-community/file-opener";\nimport { registerPlugin } from "@capacitor/core";\n\nconst AttendancePdf = registerPlugin<{\n  save(options: { html: string; filename: string }): Promise<{ uri: string; filename: string }>;\n}>("AttendancePdf");\n',
  );
}

const marker = 'const isNative =\n  typeof window !== "undefined" &&';
if (!source.includes('const AttendancePdf = registerPlugin')) {
  throw new Error("Could not install AttendancePdf plugin registration; refusing to build.");
}
if (!source.includes(marker)) {
  throw new Error("Could not locate native PDF block; refusing to build.");
}

if (!source.includes('const isAttendancePdf = title === "Attendance Sheet";')) {
  if (!source.includes(nativeBlock)) {
    throw new Error("Could not locate the native base64 PDF block; refusing to build.");
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
console.log("Attendance PDF now uses the dedicated native Android plugin; third-party PDF save/share is bypassed.");

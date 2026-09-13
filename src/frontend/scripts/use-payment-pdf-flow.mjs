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
  `const result = await PdfGenerator.fromData({
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
console.log("Attendance PDF now uses the exact same PdfGenerator/FileSharer/FileOpener flow as Payment PDF.");

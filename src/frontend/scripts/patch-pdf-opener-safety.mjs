import { readFileSync, writeFileSync } from "node:fs";

const path = "src/pages/PaymentsPage.tsx";
let source = readFileSync(path, "utf8");

const oldBlock = `      await FileOpener.open({
  filePath: saved.uri!,
  contentType: "application/pdf",
  openWithDefault: true,
});`;

const newBlock = `      // The PDF has already been saved by the shared PdfGenerator -> FileSharer
      // pipeline. Do not invoke a native opener here: older Android WebViews can
      // terminate the app while resolving external PDF activities/content URIs.
      console.info("PDF saved successfully; leaving it in Downloads without auto-opening.");`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
}

// Keep Attendance on the exact same PdfGenerator -> FileSharer pipeline, but
// avoid cloning the already-built report DOM into another HTML tree before the
// native renderer receives it. The attendance table can be much wider than the
// payment table, so landscape also reduces Android WebView layout pressure.
const oldHtml = '${report.outerHTML}';
const newHtml = '${bodyHTML}';
if (source.includes(oldHtml)) {
  source = source.replace(oldHtml, newHtml);
}

const oldOrientation = `  orientation: "portrait",\n  type: "base64",`;
const newOrientation = `  orientation: title === "Attendance Sheet" ? "landscape" : "portrait",\n  type: "base64",`;
if (source.includes(oldOrientation)) {
  source = source.replace(oldOrientation, newOrientation);
}

writeFileSync(path, source);
console.log("PDF Android safety/memory patch applied.");

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

if (!source.includes(oldBlock)) {
  console.log("PDF opener isolation patch: already applied or source changed; nothing to do.");
  process.exit(0);
}

source = source.replace(oldBlock, newBlock);
writeFileSync(path, source);
console.log("PDF opener isolation patch applied.");

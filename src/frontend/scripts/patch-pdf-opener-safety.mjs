import { readFileSync, writeFileSync } from "node:fs";

const path = "src/pages/PaymentsPage.tsx";
let source = readFileSync(path, "utf8");

const oldBlock = `      await FileOpener.open({\n  filePath: saved.uri!,\n  contentType: "application/pdf",\n  openWithDefault: true,\n});`;

const newBlock = `      if (saved?.uri) {\n        try {\n          await FileOpener.open({\n            filePath: saved.uri,\n            contentType: "application/pdf",\n            openWithDefault: true,\n          });\n        } catch (openError) {\n          console.error("PDF saved but could not be opened:", openError);\n        }\n      } else {\n        console.info("PDF saved without an openable URI");\n      }`;

if (!source.includes(oldBlock)) {
  console.log("PDF opener safety patch: already applied or source changed; nothing to do.");
  process.exit(0);
}

source = source.replace(oldBlock, newBlock);
writeFileSync(path, source);
console.log("PDF opener safety patch applied.");

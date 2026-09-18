import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const paymentsPath = path.resolve(here, "../src/pages/PaymentsPage.tsx");

let source = fs.readFileSync(paymentsPath, "utf8");

const openerBlock = `      await FileOpener.open({
  filePath: saved.uri!,
  contentType: "application/pdf",
  openWithDefault: true,
});
`;

if (!source.includes(openerBlock)) {
  console.log("PDF opener block already absent; leaving source unchanged.");
  process.exit(0);
}

source = source.replace(
  openerBlock,
  `      console.info("PDF saved to Downloads:", saved.uri);
`,
);

source = source.replace(
  'import { FileOpener } from "@capacitor-community/file-opener";\\n',
  "",
);

fs.writeFileSync(paymentsPath, source);
console.log("Disabled native PDF auto-opener; PDF remains saved in Downloads.");

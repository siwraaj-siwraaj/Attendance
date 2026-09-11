import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const layoutPath = path.join(frontendRoot, "src/components/Layout.tsx");

let source = fs.readFileSync(layoutPath, "utf8");

function removeJsxAttribute(input, attributeName) {
  let output = input;
  let searchFrom = 0;

  while (true) {
    const marker = `${attributeName}={`;
    const start = output.indexOf(marker, searchFrom);
    if (start === -1) break;

    let i = start + marker.length;
    let depth = 1;
    let quote = null;
    let template = false;

    for (; i < output.length; i += 1) {
      const ch = output[i];
      const prev = output[i - 1];

      if (quote) {
        if (ch === quote && prev !== "\\") quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === "`") {
        template = !template;
        continue;
      }
      if (template) continue;
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          break;
        }
      }
    }

    output = `${output.slice(0, start)}${output.slice(i)}`;
    searchFrom = start;
  }

  return output;
}

for (const attribute of ["onTouchStart", "onTouchMove", "onTouchEnd"]) {
  source = removeJsxAttribute(source, attribute);
}

source = source
  .replace(/\n  const touchStartX = useRef<number \| null>\(null\);/, "")
  .replace(/\n  const touchStartY = useRef<number \| null>\(null\);/, "")
  .replace(/\n  const swipeBlocked = useRef\(false\);/, "")
  .replace(/\n  const swipeIntent = useRef\(false\);/, "")
  .replace(/\n  const swipeTabs = allowedTabs;/, "")
  .replace(/\n  const swipeContentRef = useRef<HTMLDivElement \| null>\(null\);/, "")
  .replace(/\n  const mainRef = useRef<HTMLElement \| null>\(null\);/, "")
  // The source JSX keeps these refs inline on their opening tags, so remove the
  // exact attributes without touching unrelated refs such as csvInputRef.
  .replace(/\sref=\{mainRef\}/g, "")
  .replace(/\sref=\{swipeContentRef\}/g, "")
  .replace(/, allowedTabs } = useAuth\(\);/, " } = useAuth();")
  .replace(/ style=\{\{ width: "100%", willChange: "transform" \}\}/g, "");

fs.writeFileSync(layoutPath, source);
console.log("Horizontal swipe-to-switch-tabs gesture has been disabled.");

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const paymentsPath = path.resolve(here, "../src/pages/PaymentsPage.tsx");
let source = fs.readFileSync(paymentsPath, "utf8");

// Render the contract picker at document.body level. This removes it from any
// transformed/overflow-hidden ancestor that can shift or clip the menu.
if (!source.includes('from "react-dom"')) {
  source = source.replace(
    'import { useEffect, useMemo, useRef, useState } from "react";\n',
    'import { useEffect, useMemo, useRef, useState } from "react";\nimport { createPortal } from "react-dom";\n',
  );
}

// The picker is portaled, so outside-click detection must also treat the
// portaled panel itself as an inside click.
source = source.replace(
  'dropdownRef.current &&\n        !dropdownRef.current.contains(e.target as Node)',
  'dropdownRef.current &&\n        !dropdownRef.current.contains(e.target as Node) &&\n        !(e.target as Element)?.closest?.(\'[data-ocid="payments.contract_select_dropdown"]\')',
);

// Position the portaled panel from the actual trigger rectangle on every open
// and on viewport changes. This guarantees that it stays inside the phone.
const effectMarker = '  const selectedContracts = useMemo(\n';
if (!source.includes('payments-contract-dropdown-positioner')) {
  const positioner = `  // Position the portaled contract picker against the Payments arrow.\n  useEffect(() => {\n    if (!contractDropdownOpen) return;\n    const positionDropdown = () => {\n      const trigger = document.querySelector(\'[data-ocid="payments.contract_select_trigger"]\') as HTMLElement | null;\n      const dropdown = document.querySelector(\'[data-ocid="payments.contract_select_dropdown"]\') as HTMLElement | null;\n      if (!trigger || !dropdown) return;\n      const r = trigger.getBoundingClientRect();\n      const margin = 12;\n      const width = Math.min(320, window.innerWidth - margin * 2);\n      const left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));\n      dropdown.style.position = "fixed";\n      dropdown.style.left = \\`\\${left}px\\`;\n      dropdown.style.top = \\`\\${Math.min(r.bottom + 8, window.innerHeight - 120)}px\\`;\n      dropdown.style.width = \\`\\${width}px\\`;\n      dropdown.style.maxWidth = \\`calc(100vw - \\${margin * 2}px)\\`;\n      dropdown.style.zIndex = "10000";\n    };\n    const raf = requestAnimationFrame(positionDropdown);\n    window.addEventListener("resize", positionDropdown);\n    window.addEventListener("scroll", positionDropdown, true);\n    return () => {\n      cancelAnimationFrame(raf);\n      window.removeEventListener("resize", positionDropdown);\n      window.removeEventListener("scroll", positionDropdown, true);\n    };\n  }, [contractDropdownOpen]);\n\n`;
  source = source.replace(effectMarker, positioner + effectMarker);
}

// Portal only the contract dropdown block, not the trigger wrapper.
const startToken = '          {contractDropdownOpen && (\n            <div';
const start = source.indexOf(startToken);
if (start === -1) throw new Error("Contract dropdown block not found");
source = source.replace(startToken, '          {contractDropdownOpen && createPortal(\n            <div');

const closeToken = '            </div>\n          )}\n        </div>\n      </div>';
const closeIndex = source.indexOf(closeToken, start);
if (closeIndex === -1) throw new Error("Contract dropdown closing block not found");
source = source.replace(closeToken, '            </div>,\n            document.body,\n          )}\n        </div>\n      </div>');

fs.writeFileSync(paymentsPath, source);
console.log("Payments contract dropdown portaled and dynamically positioned within the viewport.");

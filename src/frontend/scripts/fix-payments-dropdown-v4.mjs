import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const paymentsPath = path.resolve(here, "../src/pages/PaymentsPage.tsx");
let source = fs.readFileSync(paymentsPath, "utf8");

if (!source.includes('from "react-dom"')) {
  source = source.replace(
    'import { useEffect, useMemo, useRef, useState } from "react";\n',
    'import { useEffect, useMemo, useRef, useState } from "react";\nimport { createPortal } from "react-dom";\n',
  );
}

// Keep outside-click handling correct after the picker is moved to document.body.
source = source.replace(
  'dropdownRef.current &&\n        !dropdownRef.current.contains(e.target as Node)',
  'dropdownRef.current &&\n        !dropdownRef.current.contains(e.target as Node) &&\n        !(e.target as Element)?.closest?.(\'[data-ocid="payments.contract_select_dropdown"]\')',
);

// Insert a safe, body-level positioner without nested template literals.
if (!source.includes('payments-contract-dropdown-positioner')) {
  const positioner = [
    '  // payments-contract-dropdown-positioner',
    '  useEffect(() => {',
    '    if (!contractDropdownOpen) return;',
    '    const positionDropdown = () => {',
    '      const trigger = document.querySelector(\'[data-ocid="payments.contract_select_trigger"]\') as HTMLElement | null;',
    '      const dropdown = document.querySelector(\'[data-ocid="payments.contract_select_dropdown"]\') as HTMLElement | null;',
    '      if (!trigger || !dropdown) return;',
    '      const r = trigger.getBoundingClientRect();',
    '      const margin = 12;',
    '      const width = Math.min(320, Math.max(240, window.innerWidth - margin * 2));',
    '      const left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));',
    '      const maxTop = Math.max(margin, window.innerHeight - 140);',
    '      const top = Math.min(r.bottom + 8, maxTop);',
    '      dropdown.style.position = "fixed";',
    '      dropdown.style.left = left + "px";',
    '      dropdown.style.top = top + "px";',
    '      dropdown.style.width = width + "px";',
    '      dropdown.style.maxWidth = "calc(100vw - " + margin * 2 + "px)";',
    '      dropdown.style.zIndex = "10000";',
    '    };',
    '    const raf = requestAnimationFrame(positionDropdown);',
    '    window.addEventListener("resize", positionDropdown);',
    '    window.addEventListener("scroll", positionDropdown, true);',
    '    return () => {',
    '      cancelAnimationFrame(raf);',
    '      window.removeEventListener("resize", positionDropdown);',
    '      window.removeEventListener("scroll", positionDropdown, true);',
    '    };',
    '  }, [contractDropdownOpen]);',
    '',
  ].join("\n");
  const effectMarker = '  const selectedContracts = useMemo(\n';
  if (!source.includes(effectMarker)) throw new Error("Payments effect insertion marker not found");
  source = source.replace(effectMarker, positioner + effectMarker);
}

// Portal only the dropdown panel to document.body so no Payments ancestor can clip it.
const startToken = '          {contractDropdownOpen && (\n            <div';
const start = source.indexOf(startToken);
if (start === -1) throw new Error("Contract dropdown block not found");
source = source.replace(startToken, '          {contractDropdownOpen && createPortal(\n            <div');

const closeToken = '            </div>\n          )}\n        </div>\n      </div>';
const closeIndex = source.indexOf(closeToken, start);
if (closeIndex === -1) throw new Error("Contract dropdown closing block not found");
source = source.replace(closeToken, '            </div>,\n            document.body,\n          )}\n        </div>\n      </div>');

fs.writeFileSync(paymentsPath, source);
console.log("Payments contract dropdown portaled and safely positioned inside the viewport.");

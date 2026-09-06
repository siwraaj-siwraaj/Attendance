import { c as createLucideIcon, r as reactExports, u as useAuth, a as useContracts, g as useLabours, q as useAdvances, t as useAddAdvance, v as useUpdateAdvance, w as useDeleteAdvance, j as jsxRuntimeExports } from "./index-B9IM4GPI.js";
import { L as LoadingSpinner } from "./LoadingSpinner-lMPiyUbD.js";
import { C as ChevronDown } from "./chevron-down-8Hpens4w.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
const ChevronRight = createLucideIcon("chevron-right", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
const Plus = createLucideIcon("plus", __iconNode);
function AdvancesPage() {
  const { isAdmin } = useAuth();
  const { data: contracts = [] } = useContracts();
  const { data: labours = [] } = useLabours();
  const { data: advances = [], isLoading } = useAdvances();
  const addAdvance = useAddAdvance();
  const updateAdvance = useUpdateAdvance();
  const deleteAdvance = useDeleteAdvance();
  const [filterContractId, setFilterContractId] = reactExports.useState("all");
  const [showForm, setShowForm] = reactExports.useState(false);
  const [editingAdvance, setEditingAdvance] = reactExports.useState(null);
  const [confirmDelete, setConfirmDelete] = reactExports.useState(null);
  const [showCleared, setShowCleared] = reactExports.useState(false);
  const [expandedLabourId, setExpandedLabourId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    contractId: "",
    labourId: "",
    amount: "",
    note: ""
  });
  const [error, setError] = reactExports.useState("");
  const amountRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => {
        var _a;
        return (_a = amountRef.current) == null ? void 0 : _a.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [showForm]);
  const isContractSettled = reactExports.useCallback(
    (contractId) => {
      const c = contracts.find((c2) => c2.id === contractId);
      return (c == null ? void 0 : c.settled) ?? false;
    },
    [contracts]
  );
  const formContracts = reactExports.useMemo(() => {
    const active = contracts.filter(
      (c) => !c.settled && c.settled !== 1n && c.settled !== BigInt(1)
    );
    if (editingAdvance) {
      const attached = contracts.find(
        (c) => c.id === editingAdvance.contractId
      );
      if (attached && !active.some((c) => c.id === attached.id)) {
        return [...active, attached];
      }
    }
    return active;
  }, [contracts, editingAdvance]);
  const filtered = reactExports.useMemo(
    () => filterContractId === "all" ? advances : advances.filter(
      (a) => a.contractId.toString() === filterContractId
    ),
    [advances, filterContractId]
  );
  const activeAdvances = reactExports.useMemo(
    () => filtered.filter((a) => !isContractSettled(a.contractId)),
    [filtered, isContractSettled]
  );
  const clearedAdvances = reactExports.useMemo(
    () => filtered.filter((a) => isContractSettled(a.contractId)),
    [filtered, isContractSettled]
  );
  const getLabourName = (id) => {
    var _a;
    return ((_a = labours.find((l) => l.id === id)) == null ? void 0 : _a.name) || "Unknown";
  };
  const getContractName = (id) => {
    var _a;
    return ((_a = contracts.find((c) => c.id === id)) == null ? void 0 : _a.name) || "Unknown";
  };
  const openAdd = reactExports.useCallback(() => {
    setEditingAdvance(null);
    setForm({
      contractId: "",
      labourId: "",
      amount: "",
      note: ""
    });
    setError("");
    setShowForm(true);
  }, []);
  const openEdit = reactExports.useCallback((a) => {
    setEditingAdvance(a);
    setForm({
      contractId: a.contractId.toString(),
      labourId: a.labourId.toString(),
      amount: a.amount.toString(),
      note: a.note
    });
    setError("");
    setShowForm(true);
  }, []);
  const handleSave = reactExports.useCallback(() => {
    if (!form.amount || Number.parseFloat(form.amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setShowForm(false);
    if (editingAdvance) {
      updateAdvance.mutate({
        id: editingAdvance.id,
        amount: Number.parseFloat(form.amount),
        note: form.note
      });
    } else {
      addAdvance.mutate({
        contractId: BigInt(form.contractId),
        labourId: BigInt(form.labourId),
        amount: Number.parseFloat(form.amount),
        note: form.note
      });
    }
  }, [form, editingAdvance, updateAdvance, addAdvance]);
  const handleDelete = reactExports.useCallback(
    (id) => {
      deleteAdvance.mutate(id, {
        onSuccess: () => setConfirmDelete(null),
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Failed to delete";
          console.error("Delete advance error:", msg);
        }
      });
    },
    [deleteAdvance]
  );
  const fmt = (n) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const formatDateTime = (ts) => {
    try {
      const d = new Date(Number(ts) / 1e6);
      return d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return "";
    }
  };
  function groupByLabour(advList) {
    const map = /* @__PURE__ */ new Map();
    for (const a of advList) {
      const key = a.labourId.toString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return map;
  }
  function renderAdvancesSection(advList, _title, emptyText) {
    if (!isLoading && advList.length === 0) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-card rounded-2xl p-6 text-center text-gray-400", children: emptyText });
    }
    if (advList.length === 0) return null;
    const grouped = groupByLabour(advList);
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl overflow-hidden border border-white/10", children: Array.from(grouped.entries()).map(([labourId, items], idx, arr) => {
      const labourName = getLabourName(BigInt(labourId));
      const total = items.reduce((s, a) => s + a.amount, 0);
      const isExpanded = expandedLabourId === labourId;
      const isLast = idx === arr.length - 1;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: !isLast ? "border-b border-white/10" : "",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setExpandedLabourId(isExpanded ? null : labourId),
                className: "w-full flex items-center justify-between px-3 py-2.5 text-left min-h-0",
                "data-ocid": "advances.labour_card.button",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0 flex-1", children: [
                    isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 text-orange-400 shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 text-gray-400 shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-medium text-sm truncate", children: labourName })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#f97316] font-bold text-sm shrink-0 ml-2", children: fmt(total) })
                ]
              }
            ),
            isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 space-y-2", children: items.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-start justify-between bg-white/5 rounded-lg p-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1 flex-wrap", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-400 font-bold text-sm", children: fmt(a.amount) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full", children: getContractName(a.contractId) })
                    ] }),
                    a.note && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-300 text-sm", children: a.note }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500 text-xs mt-1", children: formatDateTime(a.createdAt) })
                  ] }),
                  isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 ml-2 shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => openEdit(a),
                        className: "text-orange-400 text-sm hover:text-orange-300",
                        "data-ocid": "advances.edit_button",
                        children: "Edit"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setConfirmDelete(a.id),
                        className: "text-red-400 text-sm hover:text-red-300",
                        "data-ocid": "advances.delete_button",
                        children: "Delete"
                      }
                    )
                  ] })
                ]
              },
              a.id.toString()
            )) })
          ]
        },
        labourId
      );
    }) });
  }
  const totalOutstanding = reactExports.useMemo(
    () => advances.filter((a) => !isContractSettled(a.contractId)).reduce((sum, a) => sum + a.amount, 0),
    [advances, isContractSettled]
  );
  if (isLoading)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center pt-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { size: "lg" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-[#0a0f1e] text-white font-['Figtree',sans-serif]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-4 pt-4 pb-3 bg-[#0a0f1e] sticky top-0 z-10 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "glass-card rounded-2xl p-4 border border-orange-500/40 relative overflow-hidden",
          "data-ocid": "advances.total_outstanding_card",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm font-medium mb-1", children: "Total Outstanding" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-[#f97316] tracking-tight", children: fmt(totalOutstanding) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs mt-1", children: "Across all active contracts" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-base font-semibold text-white flex-1 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-[#f97316]" }),
          "Advances"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: filterContractId,
            onChange: (e) => setFilterContractId(e.target.value),
            className: "select-dark text-sm",
            "data-ocid": "advances.contract_filter",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Contracts" }),
              contracts.filter(
                (c) => !c.settled && c.settled !== 1n && c.settled !== BigInt(1)
              ).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.id.toString(), children: c.name }, c.id.toString()))
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 pb-24 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2", children: "Active Advances" }),
        renderAdvancesSection(
          activeAdvances,
          "Active Advances",
          "No active advances recorded."
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setShowCleared((s) => !s),
            className: "flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2 hover:text-white transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: showCleared ? "▼" : "▶" }),
              "Cleared Advances (",
              clearedAdvances.length,
              ")"
            ]
          }
        ),
        showCleared && renderAdvancesSection(
          clearedAdvances,
          "Cleared Advances",
          "No cleared advances recorded."
        )
      ] })
    ] }),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4",
        onClick: (e) => {
          if (e.target === e.currentTarget) setShowForm(false);
        },
        onKeyDown: (e) => {
          if (e.key === "Escape") setShowForm(false);
        },
        role: "presentation",
        tabIndex: -1,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-dialog rounded-2xl p-6 w-full max-w-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white mb-4", children: editingAdvance ? "Edit Advance" : "Add Advance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "adv-contract",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Contract"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  id: "adv-contract",
                  value: form.contractId,
                  onChange: (e) => setForm((p) => ({ ...p, contractId: e.target.value })),
                  className: "w-full bg-[#0a0f1e] border border-orange-500/30 rounded-lg px-3 py-2 text-white outline-none",
                  children: formContracts.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.id.toString(), children: c.name }, c.id.toString()))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "adv-labour",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Labour"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  id: "adv-labour",
                  value: form.labourId,
                  onChange: (e) => setForm((p) => ({ ...p, labourId: e.target.value })),
                  className: "w-full bg-[#0a0f1e] border border-orange-500/30 rounded-lg px-3 py-2 text-white outline-none",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: "Choose labour…" }),
                    labours.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l.id.toString(), children: l.name }, l.id.toString()))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "adv-amount",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Amount (₹)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: amountRef,
                  id: "adv-amount",
                  type: "number",
                  value: form.amount,
                  onChange: (e) => setForm((p) => ({ ...p, amount: e.target.value })),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none",
                  placeholder: "0"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "adv-note",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Note (optional)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "adv-note",
                  type: "text",
                  value: form.note,
                  onChange: (e) => setForm((p) => ({ ...p, note: e.target.value })),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none",
                  placeholder: "Reason or note"
                }
              )
            ] })
          ] }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm mt-2", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowForm(false),
                className: "px-4 text-gray-400 hover:text-white",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleSave,
                className: "btn-orange flex-1 py-2.5 rounded-xl font-semibold",
                children: "Save"
              }
            )
          ] })
        ] })
      }
    ),
    confirmDelete !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-dialog rounded-2xl p-6 max-w-sm w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-white font-bold text-lg mb-2", children: "Delete Advance?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm mb-4", children: "This cannot be undone." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => handleDelete(confirmDelete),
            className: "flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700",
            "data-ocid": "advances.confirm_delete_button",
            children: "Delete"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setConfirmDelete(null),
            className: "px-4 text-gray-400 hover:text-white",
            "data-ocid": "advances.cancel_delete_button",
            children: "Cancel"
          }
        )
      ] })
    ] }) }),
    isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: openAdd,
        className: "fixed z-40 bottom-20 right-4 w-14 h-14 rounded-full btn-orange glow-orange flex items-center justify-center shadow-lg",
        "aria-label": "Add Advance",
        "data-ocid": "advances.add_button",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-6 h-6 text-white" })
      }
    )
  ] });
}
const AdvancesPage_default = reactExports.memo(AdvancesPage);
export {
  AdvancesPage_default as default
};

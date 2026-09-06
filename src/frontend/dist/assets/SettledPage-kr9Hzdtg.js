import { u as useAuth, r as reactExports, a as useContracts, g as useLabours, k as useAllAttendance, q as useAdvances, A as useMarkContractSettled, B as useDeleteContract, j as jsxRuntimeExports, s as sortWorkColumns } from "./index-B9IM4GPI.js";
import { L as LoadingSpinner } from "./LoadingSpinner-lMPiyUbD.js";
function useAdminGuard() {
  const { canEdit, isAdmin } = useAuth();
  const guardAction = reactExports.useCallback(
    (action) => {
      if (canEdit) action();
    },
    [canEdit]
  );
  return {
    canEdit,
    isAdmin,
    guardAction
  };
}
function fmt(n) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
function fmtDate(ts) {
  if (!ts) return "—";
  const ms = Number(ts) / 1e6;
  if (!ms || Number.isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
function SettledPage() {
  useAuth();
  const { data: contracts = [], isLoading } = useContracts();
  const { data: labours = [] } = useLabours();
  const { data: allAttendance = [] } = useAllAttendance();
  const { data: advances = [] } = useAdvances();
  const markSettled = useMarkContractSettled();
  const deleteContract = useDeleteContract();
  const { guardAction } = useAdminGuard();
  const [processing, setProcessing] = reactExports.useState(null);
  const [expandedId, setExpandedId] = reactExports.useState(null);
  const [confirmDelete, setConfirmDelete] = reactExports.useState(null);
  const [settlePanelOpen, setSettlePanelOpen] = reactExports.useState(true);
  const [checkedIds, setCheckedIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const unsettledContracts = reactExports.useMemo(
    () => contracts.filter((c) => !c.settled),
    [contracts]
  );
  const settledContracts = reactExports.useMemo(
    () => contracts.filter((c) => c.settled),
    [contracts]
  );
  const toggleCheck = reactExports.useCallback((id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const handleSettleSelected = reactExports.useCallback(() => {
    guardAction(() => {
      const ids = Array.from(checkedIds);
      if (ids.length === 0) return;
      for (const idStr of ids) {
        const id = BigInt(idStr);
        setProcessing(id);
        markSettled.mutate(
          { id, settled: true },
          {
            onSettled: () => setProcessing(null),
            onError: () => setProcessing(null)
          }
        );
      }
      setCheckedIds(/* @__PURE__ */ new Set());
    });
  }, [guardAction, checkedIds, markSettled]);
  const handleToggleSettled = reactExports.useCallback(
    (id, currentSettled) => {
      guardAction(() => {
        setProcessing(id);
        markSettled.mutate(
          { id, settled: !currentSettled },
          {
            onSettled: () => setProcessing(null),
            onError: () => setProcessing(null)
          }
        );
      });
    },
    [guardAction, markSettled]
  );
  const handleDelete = reactExports.useCallback(
    (id) => {
      guardAction(() => {
        setProcessing(id);
        deleteContract.mutate(id, {
          onSuccess: () => setConfirmDelete(null),
          onSettled: () => setProcessing(null),
          onError: () => setProcessing(null)
        });
      });
    },
    [guardAction, deleteContract]
  );
  if (isLoading)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center pt-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { size: "lg" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full overflow-hidden bg-[#0a0f1e] text-white font-['Figtree',sans-serif]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 sticky top-0 z-10 bg-[#0a0f1e]", children: unsettledContracts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white/5 border border-white/10 p-4 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setSettlePanelOpen((v) => !v),
          className: "w-full flex items-center justify-between",
          "data-ocid": "settled.settle_panel_toggle",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-orange-400 uppercase tracking-wider", children: "SETTLE CONTRACTS" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/60", children: settlePanelOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "18 15 12 9 6 15" })
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "6 9 12 15 18 9" })
              }
            ) })
          ]
        }
      ),
      settlePanelOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
        unsettledContracts.map((c) => {
          const idStr = c.id.toString();
          const isChecked = checkedIds.has(idStr);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center gap-3",
              "data-ocid": `settled.checkbox.${idStr}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    id: `settle-check-${idStr}`,
                    onClick: () => toggleCheck(idStr),
                    className: `w-5 h-5 rounded border-2 border-orange-500 flex items-center justify-center transition-colors ${isChecked ? "bg-orange-500" : "bg-transparent"}`,
                    children: isChecked && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "svg",
                      {
                        width: "12",
                        height: "12",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "white",
                        strokeWidth: "3",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        "aria-hidden": "true",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" })
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: `settle-check-${idStr}`,
                    className: "text-white text-sm cursor-pointer",
                    children: c.name
                  }
                )
              ]
            },
            idStr
          );
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleSettleSelected,
            disabled: checkedIds.size === 0 || processing !== null,
            className: "w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl mt-3 disabled:opacity-40 disabled:cursor-not-allowed",
            "data-ocid": "settled.settle_selected_button",
            children: processing !== null ? "Settling..." : `Select contracts to settle (${checkedIds.size})`
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 pb-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white", children: "Settled Contracts" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5", children: settledContracts.length })
      ] }),
      contracts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "glass-card rounded-2xl p-8 text-center text-gray-400",
          "data-ocid": "settled.empty_state",
          children: "No contracts found."
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: settledContracts.map((c) => {
        const isExpanded = expandedId === c.id;
        const contractAttendance = allAttendance.filter(
          (r) => r.contractId === c.id
        );
        const presentCount = contractAttendance.filter(
          (r) => r.value.__kind__ === "present" || r.value.__kind__ === "partial"
        ).length;
        const contractAdvances = advances.filter(
          (a) => a.contractId === c.id
        );
        const totalAdvances = contractAdvances.reduce(
          (sum, a) => sum + a.amount,
          0
        );
        const labourSummaries = labours.map((l) => {
          const labourRecs = contractAttendance.filter(
            (r) => r.labourId === l.id
          );
          const totalDays = labourRecs.reduce((sum, r) => {
            if (r.value.__kind__ === "present") return sum + 1;
            if (r.value.__kind__ === "partial")
              return sum + r.value.partial;
            return sum;
          }, 0);
          return { labour: l, totalDays };
        }).filter((s) => s.totalDays > 0);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-2xl bg-white/5 border border-white/10 border-l-4 border-l-orange-500 p-4 mb-3",
            "data-ocid": `settled.item.${c.id.toString()}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setExpandedId(isExpanded ? null : c.id),
                  className: "w-full text-left flex items-start justify-between",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-white mb-1", children: c.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-white/50", children: [
                        "Created: ",
                        fmtDate(c.createdAt)
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-white/50", children: [
                        "— Settled:",
                        " ",
                        fmtDate(c.settledAt || c.updatedAt || c.createdAt)
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0 ml-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-orange-400 mb-1", children: fmt(c.contractAmount) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-white/40", children: isExpanded ? "Tap to collapse" : "Tap to view details" })
                    ] })
                  ]
                }
              ),
              isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/10 pt-4 mt-4 space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2", children: "Contract Details" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-[#0f1525]/50 p-3 rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Contract Amount" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-semibold text-sm", children: fmt(c.contractAmount) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-[#0f1525]/50 p-3 rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Multiplier" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white font-semibold text-sm", children: [
                        c.multiplier,
                        "×"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-[#0f1525]/50 p-3 rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Bed Amount" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-cyan-400 font-semibold text-sm", children: fmt(c.bedAmount) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-[#0f1525]/50 p-3 rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Paper Amount" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-cyan-400 font-semibold text-sm", children: fmt(c.paperAmount) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-[#0f1525]/50 p-3 rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Mesh Amount" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-cyan-400 font-semibold text-sm", children: fmt(c.meshAmount || 0) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-[#0f1525]/50 p-3 rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Machine Expenses" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 font-semibold text-sm", children: fmt(c.machineExpenses) })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2", children: "Timeline" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-lg p-2.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Created" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white text-sm", children: fmtDate(c.createdAt) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-lg p-2.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Status" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-green-400", children: "Settled" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-[#0f1525]/50 p-3 rounded-xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs", children: "Settlement Date" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-green-400 text-sm font-semibold", children: fmtDate(c.settledAt || c.updatedAt || c.createdAt) })
                ] }),
                c.workColumns.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2", children: [
                    "Work Columns (",
                    c.workColumns.length,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: sortWorkColumns(c.workColumns).map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "text-xs bg-white/10 text-gray-300 border border-white/10 px-2.5 py-1 rounded-full",
                      children: col.name
                    },
                    col.id
                  )) })
                ] }),
                labourSummaries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2", children: [
                    "Attendance Summary (",
                    presentCount,
                    " records)"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5 max-h-48 overflow-y-auto", children: labourSummaries.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "flex items-center justify-between glass-card rounded-lg px-3 py-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-sm", children: s.labour.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-cyan-400 text-sm font-semibold", children: [
                          s.totalDays,
                          " days"
                        ] })
                      ]
                    },
                    s.labour.id.toString()
                  )) })
                ] }),
                contractAdvances.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2", children: [
                    "Advances (",
                    contractAdvances.length,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-lg p-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400 text-sm", children: "Total Advances" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-400 font-semibold", children: fmt(totalAdvances) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-1 max-h-32 overflow-y-auto", children: contractAdvances.map((a) => {
                      const labour = labours.find(
                        (l) => l.id === a.labourId
                      );
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex justify-between text-xs text-gray-400",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                              (labour == null ? void 0 : labour.name) ?? "Unknown",
                              a.note ? ` — ${a.note}` : ""
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmt(a.amount) })
                          ]
                        },
                        a.id.toString()
                      );
                    }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleToggleSettled(c.id, c.settled),
                      disabled: processing === c.id,
                      className: "flex-1 py-2 rounded-xl text-sm font-semibold transition-colors bg-white/10 text-white hover:bg-white/20 disabled:opacity-50",
                      "data-ocid": `settled.toggle_button.${c.id.toString()}`,
                      children: processing === c.id ? "..." : "Unsettle"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setConfirmDelete(c.id),
                      className: "px-4 py-2 rounded-xl text-sm font-semibold bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-900/60",
                      "data-ocid": `settled.delete_button.${c.id.toString()}`,
                      children: "Delete"
                    }
                  )
                ] })
              ] })
            ]
          },
          c.id.toString()
        );
      }) })
    ] }),
    confirmDelete !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-dialog rounded-2xl p-6 max-w-sm w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-white font-bold text-lg mb-2", children: "Delete Contract?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm mb-4", children: "This action cannot be undone. All attendance and advances data for this contract will be lost." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => handleDelete(confirmDelete),
            disabled: processing === confirmDelete,
            className: "flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50",
            "data-ocid": "settled.confirm_button",
            children: processing === confirmDelete ? "Deleting..." : "Yes, Delete"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setConfirmDelete(null),
            className: "px-4 text-gray-400 hover:text-white",
            "data-ocid": "settled.cancel_button",
            children: "Cancel"
          }
        )
      ] })
    ] }) })
  ] });
}
const SettledPage_default = reactExports.memo(SettledPage);
export {
  SettledPage_default as default
};

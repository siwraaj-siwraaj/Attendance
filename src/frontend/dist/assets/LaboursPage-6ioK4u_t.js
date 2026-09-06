import { c as createLucideIcon, r as reactExports, u as useAuth, g as useLabours, x as useAddLabour, y as useUpdateLabour, z as ue, j as jsxRuntimeExports, S as SkeletonCardList, U as Users } from "./index-B9IM4GPI.js";
import { L as LayoutGrid, a as List } from "./list-C9qDqOry.js";
import { U as UserX } from "./user-x-yMJgctmL.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m16 11 2 2 4-4", key: "9rsbq5" }],
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
];
const UserCheck = createLucideIcon("user-check", __iconNode);
function LaboursPage() {
  const { isAdmin } = useAuth();
  const { data: labours = [], isLoading } = useLabours();
  const addLabour = useAddLabour();
  const updateLabour = useUpdateLabour();
  const [showForm, setShowForm] = reactExports.useState(false);
  const [editingLabour, setEditingLabour] = reactExports.useState(null);
  const [name, setName] = reactExports.useState("");
  const [employeeId, setEmployeeId] = reactExports.useState("");
  const [joinDate, setJoinDate] = reactExports.useState("");
  const [isActiveForm, setIsActiveForm] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [viewMode, setViewMode] = reactExports.useState("list");
  const labourNameRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => {
        var _a;
        return (_a = labourNameRef.current) == null ? void 0 : _a.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [showForm]);
  const openAdd = reactExports.useCallback(() => {
    setEditingLabour(null);
    setName("");
    setEmployeeId("");
    setJoinDate("");
    setIsActiveForm(true);
    setError("");
    setShowForm(true);
  }, []);
  const openEdit = reactExports.useCallback((l) => {
    setEditingLabour(l);
    setName(l.name);
    setEmployeeId(l.employeeId ?? "");
    setJoinDate(l.joinDate ?? "");
    setIsActiveForm(l.isActive !== false);
    setError("");
    setShowForm(true);
  }, []);
  const handleSave = reactExports.useCallback(() => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setShowForm(false);
    setError("");
    const onError = (err) => {
      const msg = err instanceof Error ? err.message : "Failed to save";
      console.error("Save labour error:", msg);
      ue.error(msg);
    };
    if (editingLabour) {
      updateLabour.mutate(
        {
          id: editingLabour.id,
          name: name.trim(),
          employeeId: employeeId.trim(),
          joinDate: joinDate.trim(),
          isActive: isActiveForm
        },
        { onError }
      );
    } else {
      addLabour.mutate(
        {
          name: name.trim(),
          employeeId: employeeId.trim(),
          joinDate: joinDate.trim()
        },
        { onError }
      );
    }
  }, [
    name,
    employeeId,
    joinDate,
    isActiveForm,
    editingLabour,
    updateLabour,
    addLabour
  ]);
  reactExports.useCallback(
    (l) => {
      updateLabour.mutate(
        {
          id: l.id,
          name: l.name,
          employeeId: l.employeeId ?? "",
          joinDate: l.joinDate ?? "",
          isActive: !l.isActive
        },
        {
          onError: (err) => {
            const msg = err instanceof Error ? err.message : "Failed to update";
            console.error("Toggle active error:", err);
            ue.error(msg);
          }
        }
      );
    },
    [updateLabour]
  );
  const activeLabours = reactExports.useMemo(
    () => labours.filter((l) => l.isActive !== false),
    [labours]
  );
  const inactiveLabours = reactExports.useMemo(
    () => labours.filter((l) => l.isActive === false),
    [labours]
  );
  const filteredActive = reactExports.useMemo(
    () => activeLabours.filter((l) => {
      if (!searchQuery.trim()) return true;
      return l.name.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [activeLabours, searchQuery]
  );
  const filteredInactive = reactExports.useMemo(
    () => inactiveLabours.filter((l) => {
      if (!searchQuery.trim()) return true;
      return l.name.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [inactiveLabours, searchQuery]
  );
  function renderLabourCard(l, idx) {
    if (viewMode === "card") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `glass-card rounded-xl p-4 flex flex-col gap-2 border border-orange-500/15 hover:border-orange-500/40 transition-colors ${l.isActive === false ? "opacity-60" : ""}`,
          "data-ocid": `labour.item.${idx + 1}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-semibold text-base leading-tight", children: l.name }),
            l.employeeId && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
              "ID: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-300", children: l.employeeId })
            ] }),
            l.joinDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
              "Joined: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-300", children: l.joinDate })
            ] }),
            isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-end mt-1 pt-2 border-t border-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => openEdit(l),
                className: "text-orange-400 hover:text-orange-300 text-xs",
                "data-ocid": "labours.edit_button",
                children: "Edit"
              }
            ) })
          ]
        },
        l.id.toString()
      );
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: `w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer ${l.isActive === false ? "opacity-60" : ""}`,
        onClick: () => isAdmin ? openEdit(l) : void 0,
        "aria-label": `Labour: ${l.name}`,
        "data-ocid": `labour.item.${idx + 1}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 min-w-0 text-sm font-medium text-white truncate text-left", children: l.name }),
          l.joinDate ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/40 text-xs shrink-0", children: l.joinDate }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              className: "w-4 h-4 text-white/20 shrink-0",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Open" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M9 5l7 7-7 7"
                  }
                )
              ]
            }
          )
        ]
      },
      l.id.toString()
    );
  }
  if (isLoading)
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex flex-col h-full px-4 pt-4",
        "data-ocid": "labours.loading_state",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCardList, { count: 4 })
      }
    );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-[#0a0f1e] text-white font-['Figtree',sans-serif]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 space-y-3 px-4 pt-4 pb-3 bg-[#0a0f1e] sticky top-0 z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-base font-semibold text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4 text-[#f97316]" }),
          "Labours"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Search" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "Search labours...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full rounded-full bg-[#1a2035] border border-white/15 px-4 py-2 pl-10 text-white/80 placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm",
              "data-ocid": "labours.search_input"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setViewMode(viewMode === "list" ? "card" : "list"),
            className: "p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0",
            "aria-label": viewMode === "list" ? "Switch to card view" : "Switch to list view",
            "data-ocid": "labours.view_toggle",
            children: viewMode === "list" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "w-4 h-4 text-white/60" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "w-4 h-4 text-white/60" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex-1 overflow-y-auto px-4 pb-24",
        style: {
          height: "calc(100vh - 200px)",
          maxHeight: "calc(100vh - 200px)"
        },
        children: labours.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-2xl p-8 text-center text-gray-400 mt-2", children: [
          "No labours yet. ",
          isAdmin && 'Tap "+" to add a labour.'
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-green-400 flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "w-4 h-4 text-green-400" }),
              "Active Labours (",
              activeLabours.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl overflow-hidden border border-white/10", children: filteredActive.map(
              (l, idx) => renderLabourCard(l, idx)
            ) })
          ] }),
          inactiveLabours.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { className: "w-4 h-4 text-gray-500" }),
              "Inactive Labours (",
              inactiveLabours.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl overflow-hidden border border-white/10", children: filteredInactive.map(
              (l, idx) => renderLabourCard(l, idx + activeLabours.length)
            ) })
          ] })
        ] })
      }
    ),
    isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: openAdd,
        className: "fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30 bg-gradient-to-br from-orange-500 to-orange-600 text-white",
        "aria-label": "Add Labour",
        "data-ocid": "labours.add_button",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
            strokeWidth: 2.5,
            stroke: "currentColor",
            className: "w-6 h-6",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Add Labour" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 4.5v15m7.5-7.5h-15"
                }
              )
            ]
          }
        )
      }
    ),
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white mb-4", children: editingLabour ? "Edit Labour" : "Add Labour" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "label",
                {
                  htmlFor: "labour-name",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: [
                    "Name ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-400", children: "*" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: labourNameRef,
                  id: "labour-name",
                  type: "text",
                  value: name,
                  onChange: (e) => setName(e.target.value),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none",
                  placeholder: "Labour name"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "labour-empid",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Employee ID"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "labour-empid",
                  type: "text",
                  value: employeeId,
                  onChange: (e) => setEmployeeId(e.target.value),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none",
                  placeholder: "Employee ID"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "labour-joindate",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Join Date"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "labour-joindate",
                  type: "date",
                  value: joinDate,
                  onChange: (e) => setJoinDate(e.target.value),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5 border border-white/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-white", children: "Status" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: isActiveForm ? "Active — appears in new contracts" : "Inactive — hidden from new contracts" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setIsActiveForm((v) => !v),
                  className: `relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${isActiveForm ? "bg-green-500" : "bg-gray-600"}`,
                  "aria-label": isActiveForm ? "Mark inactive" : "Mark active",
                  "data-ocid": "labour.status_toggle",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isActiveForm ? "translate-x-6" : "translate-x-0"}`
                    }
                  )
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
                onClick: handleSave,
                disabled: addLabour.isPending || updateLabour.isPending,
                className: "btn-orange flex-1 py-2.5 rounded-xl font-semibold disabled:opacity-50",
                "data-ocid": "labours.save_button",
                children: addLabour.isPending || updateLabour.isPending ? "Saving..." : "Save"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowForm(false),
                className: "px-4 text-gray-400 hover:text-white",
                children: "Cancel"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
const LaboursPage_default = reactExports.memo(LaboursPage);
export {
  LaboursPage_default as default
};

import { u as useAuth, a as useContracts, g as useLabours, h as useGetActiveLabours, k as useAllAttendance, r as reactExports, s as sortWorkColumns, f as useSetAttendance, e as useAddWorkColumn, l as useUpdateWorkColumn, m as useRemoveWorkColumn, j as jsxRuntimeExports, n as SkeletonTable, P as PARTIAL_VALUES, i as getAttendanceDisplay, o as getAttendanceLabel, p as getBadgeClass } from "./index-B9IM4GPI.js";
function formatCurrency(n) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
function getSelectBgClass(value) {
  if (value.__kind__ === "present")
    return "bg-emerald-500 border-emerald-400 text-white";
  if (value.__kind__ === "absent")
    return "bg-rose-600 border-rose-500 text-white";
  return "bg-amber-500 border-amber-400 text-white";
}
function calculateLabourSalary(contract, allRecords, labourId) {
  const workTypes = ["bed", "paper", "mesh"];
  let total = 0;
  for (const workType of workTypes) {
    const workTypeColumns = contract.workColumns.filter(
      (c) => c.workType === workType
    );
    if (workTypeColumns.length === 0) continue;
    const workTypeAmount = workType === "bed" ? contract.bedAmount : workType === "paper" ? contract.paperAmount : workType === "mesh" ? contract.meshAmount : 0;
    if (workTypeAmount === 0) continue;
    const totalAttendanceSum = allRecords.filter((r) => workTypeColumns.some((c) => c.id === r.columnId)).reduce((sum, r) => sum + getAttendanceDisplay(r.value), 0);
    if (totalAttendanceSum === 0) continue;
    const labourAttendance = allRecords.filter(
      (r) => r.labourId === labourId && workTypeColumns.some((c) => c.id === r.columnId)
    ).reduce((sum, r) => sum + getAttendanceDisplay(r.value), 0);
    total += labourAttendance / totalAttendanceSum * workTypeAmount;
  }
  return total;
}
function getRecordValue(records, labourId, columnId) {
  const rec = records.find(
    (r) => r.labourId === labourId && r.columnId === columnId
  );
  return (rec == null ? void 0 : rec.value) ?? { __kind__: "absent", absent: null };
}
function columnHasAttendance(records, columnId) {
  return records.some(
    (r) => r.columnId === columnId && r.value.__kind__ !== "absent"
  );
}
function AttendanceTable({
  contract,
  workColumns,
  labours,
  attendance,
  canEdit,
  onChange
}) {
  const [page, setPage] = reactExports.useState(1);
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(labours.length / ITEMS_PER_PAGE);
  const paginatedLabours = labours.slice(
    (page - 1) * ITEMS_PER_PAGE,
    (page - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );
  const columnTotals = workColumns.map(
    (col) => attendance.filter((r) => r.columnId === col.id).reduce((sum, r) => sum + getAttendanceDisplay(r.value), 0)
  );
  const netSalaryTotals = labours.reduce(
    (sum, l) => sum + calculateLabourSalary(contract, attendance, l.id),
    0
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-card rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "swipeable-table-wrapper", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-max text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-white/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "sticky left-0 z-10 bg-[#0f1525] px-3 py-3 text-left text-xs font-semibold text-gray-400 whitespace-nowrap", children: "S.No" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "sticky left-[48px] z-10 bg-[#0f1525] px-3 py-3 text-left text-xs font-semibold text-gray-400 whitespace-nowrap", children: "Labour" }),
      workColumns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "th",
        {
          className: "px-3 py-3 text-center text-xs font-semibold text-gray-400 whitespace-nowrap",
          children: col.name
        },
        col.id
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3 text-right text-xs font-semibold text-gray-400 whitespace-nowrap", children: "Net Salary" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
      paginatedLabours.map((labour, idx) => {
        const netSalary = calculateLabourSalary(
          contract,
          attendance,
          labour.id
        );
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "tr",
          {
            className: "border-b border-white/5 hover:bg-white/[0.02] transition-colors",
            "data-ocid": `attendance.item.${idx + 1}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "sticky left-0 z-10 bg-[#0a0f1e]/90 px-3 py-2.5 text-gray-400 whitespace-nowrap", children: (page - 1) * ITEMS_PER_PAGE + idx + 1 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "sticky left-[48px] z-10 bg-[#0a0f1e]/90 px-3 py-2.5 text-white font-medium whitespace-nowrap", children: labour.name }),
              workColumns.map((col) => {
                const value = getRecordValue(attendance, labour.id, col.id);
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "td",
                  {
                    className: "px-2 py-2 text-center whitespace-nowrap",
                    children: canEdit ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "select",
                      {
                        value: JSON.stringify(value),
                        onChange: (e) => {
                          const parsed = JSON.parse(
                            e.target.value
                          );
                          onChange(labour.id, col.id, parsed);
                        },
                        className: `w-20 px-1.5 py-1 rounded-md border text-xs text-white focus:outline-none focus:border-[#f97316] ${getSelectBgClass(value)}`,
                        "data-ocid": `attendance.select.${idx + 1}.${col.id}`,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "option",
                            {
                              value: JSON.stringify({
                                __kind__: "present",
                                present: null
                              }),
                              className: "bg-[#0a0f1e]",
                              children: "Present"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "option",
                            {
                              value: JSON.stringify({
                                __kind__: "absent",
                                absent: null
                              }),
                              className: "bg-[#0a0f1e]",
                              children: "Absent"
                            }
                          ),
                          PARTIAL_VALUES.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "option",
                            {
                              value: JSON.stringify({
                                __kind__: "partial",
                                partial: v
                              }),
                              className: "bg-[#0a0f1e]",
                              children: v
                            },
                            v
                          ))
                        ]
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: `inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-medium ${getBadgeClass(value)}`,
                        children: getAttendanceLabel(value)
                      }
                    )
                  },
                  col.id
                );
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2.5 text-right text-white font-medium whitespace-nowrap", children: formatCurrency(netSalary) })
            ]
          },
          String(labour.id)
        );
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-white/20 bg-white/[0.03] font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "sticky left-0 z-10 bg-[#0f1525] px-3 py-3 text-gray-400 whitespace-nowrap", children: "Total" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "sticky left-[48px] z-10 bg-[#0f1525] px-3 py-3 text-gray-400 whitespace-nowrap", children: "—" }),
        columnTotals.map((total, colIndex) => {
          var _a;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "td",
            {
              className: "px-3 py-3 text-center text-[#f97316] whitespace-nowrap",
              children: total.toFixed(2)
            },
            ((_a = workColumns[colIndex]) == null ? void 0 : _a.id) ?? colIndex
          );
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-right text-[#f97316] whitespace-nowrap", children: formatCurrency(netSalaryTotals) })
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: workColumns.length + 3, className: "px-3 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setPage((p) => Math.max(1, p - 1)),
            disabled: page === 1,
            className: "px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/10 transition-colors",
            "data-ocid": "attendance.pagination_prev",
            children: "← Prev"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-gray-400", children: [
          "Page ",
          page,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
            disabled: page === totalPages,
            className: "px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/10 transition-colors",
            "data-ocid": "attendance.pagination_next",
            children: "Next →"
          }
        )
      ] }) }) })
    ] })
  ] }) }) });
}
function AttendancePage({
  selectedContractId,
  onContractChange,
  openColumnPickerFor,
  onColumnPickerOpened
}) {
  var _a;
  const { canEdit, isAdmin } = useAuth();
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const { data: allLabours = [], isLoading: laboursLoading } = useLabours();
  const { data: activeLabours = [] } = useGetActiveLabours();
  const { data: allAttendance = [], isLoading: attendanceLoading } = useAllAttendance();
  const [selectedContractIdState, setSelectedContractIdState] = reactExports.useState(selectedContractId ?? null);
  const [showQuickMark, setShowQuickMark] = reactExports.useState(false);
  const [quickMarkIndex, setQuickMarkIndex] = reactExports.useState(0);
  const [quickMarkColumnId, setQuickMarkColumnId] = reactExports.useState(
    null
  );
  const [showCompletion, setShowCompletion] = reactExports.useState(false);
  const [showContractSwitcher, setShowContractSwitcher] = reactExports.useState(false);
  const [contractSwitcherQuery, setContractSwitcherQuery] = reactExports.useState("");
  const [localAttendanceOverrides, setLocalAttendanceOverrides] = reactExports.useState({});
  const resetQuickMarkState = reactExports.useCallback(() => {
    setLocalAttendanceOverrides({});
    setQuickMarkColumnId(null);
    setQuickMarkIndex(0);
    setShowCompletion(false);
    setShowContractSwitcher(false);
    setContractSwitcherQuery("");
  }, []);
  const handleContractSelect = reactExports.useCallback(
    (id) => {
      setSelectedContractIdState(id);
      onContractChange == null ? void 0 : onContractChange(id);
      resetQuickMarkState();
    },
    [onContractChange, resetQuickMarkState]
  );
  const prevSelectedContractIdRef = reactExports.useRef(null);
  if (selectedContractId !== null && selectedContractId !== void 0 && selectedContractId !== prevSelectedContractIdRef.current) {
    prevSelectedContractIdRef.current = selectedContractId;
  }
  const prevOpenColumnPickerForRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (openColumnPickerFor !== null && openColumnPickerFor !== void 0 && openColumnPickerFor !== prevOpenColumnPickerForRef.current) {
      prevOpenColumnPickerForRef.current = openColumnPickerFor;
      prevSelectedContractIdRef.current = openColumnPickerFor;
      resetQuickMarkState();
      setSelectedContractIdState(openColumnPickerFor);
      onContractChange == null ? void 0 : onContractChange(openColumnPickerFor);
      setShowAddColumn(true);
      onColumnPickerOpened == null ? void 0 : onColumnPickerOpened();
    }
  }, [
    openColumnPickerFor,
    onContractChange,
    onColumnPickerOpened,
    resetQuickMarkState
  ]);
  reactExports.useEffect(() => {
    if (openColumnPickerFor) return;
    if (selectedContractId !== null && selectedContractId !== void 0 && selectedContractId !== selectedContractIdState) {
      prevSelectedContractIdRef.current = selectedContractId;
      resetQuickMarkState();
      setSelectedContractIdState(selectedContractId);
    }
  }, [
    selectedContractId,
    selectedContractIdState,
    openColumnPickerFor,
    resetQuickMarkState
  ]);
  const effectiveContractId = selectedContractIdState;
  const contract = reactExports.useMemo(
    () => contracts.find((c) => c.id === effectiveContractId),
    [contracts, effectiveContractId]
  );
  const sortedWorkColumns = reactExports.useMemo(
    () => contract ? sortWorkColumns(contract.workColumns) : [],
    [contract]
  );
  const contractAttendance = reactExports.useMemo(
    () => allAttendance.filter((r) => r.contractId === effectiveContractId),
    [allAttendance, effectiveContractId]
  );
  const labours = reactExports.useMemo(() => {
    if (!contract) return [];
    const labourIdsWithAttendance = new Set(
      contractAttendance.map((r) => String(r.labourId))
    );
    if (contract.settled) {
      return allLabours.filter(
        (l) => labourIdsWithAttendance.has(String(l.id))
      );
    }
    const activeIds = new Set(activeLabours.map((l) => String(l.id)));
    return allLabours.filter(
      (l) => activeIds.has(String(l.id)) || labourIdsWithAttendance.has(String(l.id))
    );
  }, [contract, contractAttendance, allLabours, activeLabours]);
  const setAttendance = useSetAttendance();
  const addWorkColumn = useAddWorkColumn();
  const updateWorkColumn = useUpdateWorkColumn();
  const removeWorkColumn = useRemoveWorkColumn();
  const [completionCount, setCompletionCount] = reactExports.useState(0);
  const [showAddColumn, setShowAddColumn] = reactExports.useState(false);
  const [newColumnName, setNewColumnName] = reactExports.useState("");
  const [newColumnWorkType, setNewColumnWorkType] = reactExports.useState("bed");
  const [editingColumnId, setEditingColumnId] = reactExports.useState(null);
  const [editingColumnName, setEditingColumnName] = reactExports.useState("");
  const [instantAddLoading, setInstantAddLoading] = reactExports.useState(
    null
  );
  const mergedAttendance = reactExports.useMemo(() => {
    const base = [...contractAttendance];
    for (const [key, value] of Object.entries(localAttendanceOverrides)) {
      const [labourIdStr, columnId] = key.split("|");
      const labourId = BigInt(labourIdStr);
      const idx = base.findIndex(
        (r) => r.labourId === labourId && r.columnId === columnId
      );
      if (idx >= 0) {
        base[idx] = { ...base[idx], value };
      } else if (effectiveContractId) {
        base.push({
          contractId: effectiveContractId,
          labourId,
          columnId,
          value
        });
      }
    }
    return base;
  }, [contractAttendance, localAttendanceOverrides, effectiveContractId]);
  const pendingAttendanceRef = reactExports.useRef([]);
  const flushTimeoutRef = reactExports.useRef(null);
  const flushPendingAttendance = reactExports.useCallback(() => {
    if (!effectiveContractId) return;
    const batch = pendingAttendanceRef.current.splice(0);
    if (batch.length === 0) return;
    for (const record of batch) {
      setAttendance.mutate(
        { contractId: effectiveContractId, ...record },
        {
          onSuccess: () => {
          },
          onError: (_err) => {
          }
        }
      );
    }
  }, [effectiveContractId, setAttendance]);
  const handleAttendanceChange = reactExports.useCallback(
    (labourId, columnId, value) => {
      if (!effectiveContractId) return;
      const overrideKey = `${String(labourId)}|${columnId}`;
      setLocalAttendanceOverrides((prev) => ({
        ...prev,
        [overrideKey]: value
      }));
      pendingAttendanceRef.current.push({ labourId, columnId, value });
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = setTimeout(() => {
        flushPendingAttendance();
      }, 300);
    },
    [effectiveContractId, flushPendingAttendance]
  );
  const handleQuickMark = reactExports.useCallback(
    (value) => {
      if (!contract || labours.length === 0 || !quickMarkColumnId) return;
      const labour = labours[quickMarkIndex];
      if (!labour) return;
      const overrideKey = `${String(labour.id)}|${quickMarkColumnId}`;
      const newOverrides = {
        ...localAttendanceOverrides,
        [overrideKey]: value
      };
      setLocalAttendanceOverrides(newOverrides);
      pendingAttendanceRef.current.push({
        labourId: labour.id,
        columnId: quickMarkColumnId,
        value
      });
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = setTimeout(() => {
        flushPendingAttendance();
      }, 300);
      if (quickMarkIndex < labours.length - 1) {
        setQuickMarkIndex((i) => i + 1);
      } else {
        const allOverrides = newOverrides;
        const presentCount = labours.filter((l) => {
          const key = `${String(l.id)}|${quickMarkColumnId}`;
          const overrideVal = allOverrides[key];
          if (overrideVal) {
            if (overrideVal.__kind__ === "present") return true;
            if (overrideVal.__kind__ === "partial" && overrideVal.partial > 0)
              return true;
            return false;
          }
          const rec = contractAttendance.find(
            (r) => r.labourId === l.id && r.columnId === quickMarkColumnId
          );
          if (!rec) return false;
          if (rec.value.__kind__ === "present") return true;
          if (rec.value.__kind__ === "partial" && rec.value.partial > 0)
            return true;
          return false;
        }).length;
        setCompletionCount(presentCount);
        setShowCompletion(true);
      }
    },
    [
      contract,
      labours,
      quickMarkIndex,
      flushPendingAttendance,
      quickMarkColumnId,
      contractAttendance,
      localAttendanceOverrides
    ]
  );
  const handleMarkAllPresent = reactExports.useCallback(() => {
    if (!contract || !quickMarkColumnId) return;
    const newOverrides = { ...localAttendanceOverrides };
    for (const labour of labours) {
      const key = `${String(labour.id)}|${quickMarkColumnId}`;
      newOverrides[key] = { __kind__: "present", present: null };
      pendingAttendanceRef.current.push({
        labourId: labour.id,
        columnId: quickMarkColumnId,
        value: { __kind__: "present", present: null }
      });
    }
    setLocalAttendanceOverrides(newOverrides);
    if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    flushTimeoutRef.current = setTimeout(() => {
      flushPendingAttendance();
    }, 300);
    const presentCount = labours.length;
    setCompletionCount(presentCount);
    setShowCompletion(true);
  }, [
    contract,
    quickMarkColumnId,
    labours,
    localAttendanceOverrides,
    flushPendingAttendance
  ]);
  const handleAddColumn = reactExports.useCallback(() => {
    if (!contract) return;
    addWorkColumn.mutate(
      {
        contractId: contract.id,
        name: newColumnName.trim(),
        workType: newColumnWorkType
      },
      {
        onSuccess: () => {
          setNewColumnName("");
        }
      }
    );
  }, [contract, newColumnName, newColumnWorkType, addWorkColumn]);
  const currentLabourStatuses = reactExports.useMemo(() => {
    if (!contract || !labours[quickMarkIndex]) return [];
    const labour = labours[quickMarkIndex];
    return sortedWorkColumns.map((col) => {
      const key = `${String(labour.id)}|${col.id}`;
      const overrideVal = localAttendanceOverrides[key];
      const val = overrideVal ?? getRecordValue(contractAttendance, labour.id, col.id);
      return { col, val };
    });
  }, [
    contract,
    sortedWorkColumns,
    labours,
    quickMarkIndex,
    localAttendanceOverrides,
    contractAttendance
  ]);
  const liveColumnPresentCount = reactExports.useMemo(() => {
    if (!quickMarkColumnId) return 0;
    return labours.filter((l) => {
      const key = `${String(l.id)}|${quickMarkColumnId}`;
      const overrideVal = localAttendanceOverrides[key];
      const val = overrideVal ?? getRecordValue(contractAttendance, l.id, quickMarkColumnId);
      if (val.__kind__ === "present") return true;
      if (val.__kind__ === "partial" && val.partial > 0) return true;
      return false;
    }).length;
  }, [
    labours,
    quickMarkColumnId,
    localAttendanceOverrides,
    contractAttendance
  ]);
  const switchableContracts = reactExports.useMemo(() => {
    const q = contractSwitcherQuery.trim().toLowerCase();
    return contracts.filter((c) => !c.settled).filter((c) => c.id !== effectiveContractId).filter((c) => q ? c.name.toLowerCase().includes(q) : true);
  }, [contracts, effectiveContractId, contractSwitcherQuery]);
  const handleSwitchContract = reactExports.useCallback(
    (id) => {
      handleContractSelect(id);
    },
    [handleContractSelect]
  );
  const isLoading = contractsLoading || laboursLoading || attendanceLoading;
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", "data-ocid": "attendance.loading_state", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonTable, { rows: 6, cols: 5 }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col h-full overflow-hidden",
      "data-ocid": "attendance.page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "shrink-0 sticky top-0 z-10 border-b border-white/10",
            style: { background: "#0a0f1e" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "relative overflow-hidden",
                  style: {
                    background: "linear-gradient(135deg, #0a0f1e 0%, #1a0f00 50%, #0a1a10 100%)",
                    minHeight: "80px"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "absolute inset-0",
                        style: {
                          background: "linear-gradient(135deg, rgba(10,15,30,0.85) 0%, rgba(249,115,22,0.15) 60%, rgba(10,15,30,0.9) 100%)"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 px-4 pt-3 pb-2 flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          style: {
                            background: "linear-gradient(135deg, #f97316, #ea580c)",
                            boxShadow: "0 4px 16px rgba(249,115,22,0.5)"
                          },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "svg",
                            {
                              width: "22",
                              height: "22",
                              viewBox: "0 0 24 24",
                              fill: "none",
                              stroke: "white",
                              strokeWidth: "2",
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              "aria-hidden": "true",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "8", y: "2", width: "8", height: "4", rx: "1", ry: "1" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "12", x2: "15", y2: "12" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "16", x2: "13", y2: "16" })
                              ]
                            }
                          )
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-black text-white leading-tight tracking-tight", children: "Attendance" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-white/50", children: "Track daily attendance" })
                      ] })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 px-4 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "select",
                      {
                        id: "contract-select",
                        value: effectiveContractId !== null ? String(effectiveContractId) : "",
                        onChange: (e) => {
                          const val = e.target.value;
                          handleContractSelect(val ? BigInt(val) : null);
                        },
                        className: "w-full px-3 py-2 rounded-xl text-white text-sm focus:outline-none transition-all",
                        style: {
                          background: "rgba(5,10,20,0.85)",
                          border: "1px solid rgba(249,115,22,0.4)"
                        },
                        "data-ocid": "attendance.contract_select",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", className: "bg-[#0a0f1e]", children: "-- Choose a contract --" }),
                          contracts.filter((c) => !c.settled).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "option",
                            {
                              value: String(c.id),
                              className: "bg-[#0a0f1e]",
                              children: c.name
                            },
                            String(c.id)
                          ))
                        ]
                      }
                    ) })
                  ]
                }
              ),
              contract && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2 grid grid-cols-3 gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "rounded-xl p-2.5 text-center",
                    style: {
                      background: "rgba(20,184,166,0.12)",
                      border: "1px solid rgba(20,184,166,0.3)"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-0.5", children: "Mesh Pool" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black text-teal-300", children: [
                        "₹",
                        (contract.meshAmount ?? 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 0
                        })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "rounded-xl p-2.5 text-center",
                    style: {
                      background: "rgba(249,115,22,0.12)",
                      border: "1px solid rgba(249,115,22,0.3)"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-0.5", children: "Bed Pool" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black text-orange-300", children: [
                        "₹",
                        (contract.bedAmount ?? 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 0
                        })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "rounded-xl p-2.5 text-center",
                    style: {
                      background: "rgba(168,85,247,0.12)",
                      border: "1px solid rgba(168,85,247,0.3)"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-0.5", children: "Paper Pool" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black text-purple-300", children: [
                        "₹",
                        (contract.paperAmount ?? 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 0
                        })
                      ] })
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 pb-24 space-y-4 pt-4", children: [
          !isLoading && !contract && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "glass-card rounded-xl p-8 text-center text-gray-400",
              "data-ocid": "attendance.empty_state",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Select a contract to view attendance" })
            }
          ),
          contract && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            contract && (canEdit || isAdmin) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowAddColumn((v) => !v),
                    className: "flex-1 py-2 rounded-lg border border-orange-500/50 bg-white/5 text-orange-400 text-xs font-semibold hover:bg-orange-500/10 transition-colors",
                    "data-ocid": "attendance.add_column_button",
                    children: "⚙ Manage Columns"
                  }
                ),
                canEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setQuickMarkIndex(0);
                      setQuickMarkColumnId(null);
                      setShowCompletion(false);
                      setLocalAttendanceOverrides({});
                      setShowQuickMark(true);
                    },
                    className: "flex-1 py-2 rounded-lg btn-orange text-xs font-semibold",
                    "aria-label": "Quick Mark Attendance",
                    "data-ocid": "attendance.quick_mark_header_button",
                    children: "⚡ Quick Mark"
                  }
                )
              ] }),
              isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: showAddColumn ? "glass-card rounded-xl p-3 space-y-2" : "hidden",
                  children: showAddColumn && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 font-medium uppercase tracking-wider", children: "Existing Columns" }),
                      sortedWorkColumns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-white/[0.03]",
                          children: [
                            editingColumnId === col.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "text",
                                value: editingColumnName,
                                onChange: (e) => setEditingColumnName(e.target.value),
                                onBlur: () => {
                                  if (editingColumnName.trim()) {
                                    updateWorkColumn.mutate({
                                      contractId: contract.id,
                                      columnId: col.id,
                                      name: editingColumnName.trim()
                                    });
                                  }
                                  setEditingColumnId(null);
                                },
                                onKeyDown: (e) => {
                                  if (e.key === "Enter") {
                                    if (editingColumnName.trim()) {
                                      updateWorkColumn.mutate({
                                        contractId: contract.id,
                                        columnId: col.id,
                                        name: editingColumnName.trim()
                                      });
                                    }
                                    setEditingColumnId(null);
                                  }
                                },
                                className: "flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#f97316]"
                              }
                            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-white/80", children: col.name }),
                            isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => {
                                    setEditingColumnId(col.id);
                                    setEditingColumnName(col.name);
                                  },
                                  className: "text-xs p-1 rounded text-orange-400 hover:bg-orange-500/10 transition-colors",
                                  "aria-label": "Rename column",
                                  children: "✏️"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => {
                                    if (window.confirm("Delete column?"))
                                      removeWorkColumn.mutate({
                                        contractId: contract.id,
                                        columnId: col.id
                                      });
                                  },
                                  className: "text-xs p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors",
                                  "aria-label": "Delete column",
                                  children: "🗑️"
                                }
                              )
                            ] })
                          ]
                        },
                        col.id
                      ))
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/10 pt-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 font-medium uppercase tracking-wider mb-2", children: "Add New Column" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Column name (e.g. Bed 2, Paper 1)",
                          value: newColumnName,
                          onChange: (e) => setNewColumnName(e.target.value),
                          className: "w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#f97316]",
                          "data-ocid": "attendance.add_column_input"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          value: newColumnWorkType,
                          onChange: (e) => setNewColumnWorkType(e.target.value),
                          className: "w-full mt-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#f97316]",
                          "data-ocid": "attendance.add_column_worktype",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "bed", className: "bg-[#0a0f1e]", children: "Bed" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "paper", className: "bg-[#0a0f1e]", children: "Paper" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mesh", className: "bg-[#0a0f1e]", children: "Mesh" })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: handleAddColumn,
                          className: "flex-1 py-2.5 rounded-lg btn-orange text-sm font-semibold",
                          "data-ocid": "attendance.add_column_save",
                          children: "Save"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setShowAddColumn(false);
                            setNewColumnName("");
                          },
                          className: "flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors",
                          "data-ocid": "attendance.add_column_cancel",
                          children: "Cancel"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/10 pt-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 font-medium uppercase tracking-wider mb-2", children: "Quick Add" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              if (!contract) return;
                              setInstantAddLoading("bed");
                              addWorkColumn.mutate(
                                {
                                  contractId: contract.id,
                                  name: "",
                                  workType: "bed"
                                },
                                {
                                  onSettled: () => setInstantAddLoading(null),
                                  onError: () => setInstantAddLoading(null)
                                }
                              );
                            },
                            disabled: instantAddLoading === "bed",
                            className: "py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 text-xs font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            "data-ocid": "attendance.instant_add_bed_button",
                            children: instantAddLoading === "bed" ? "…" : "+ Bed"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              if (!contract) return;
                              setInstantAddLoading("paper");
                              addWorkColumn.mutate(
                                {
                                  contractId: contract.id,
                                  name: "",
                                  workType: "paper"
                                },
                                {
                                  onSettled: () => setInstantAddLoading(null),
                                  onError: () => setInstantAddLoading(null)
                                }
                              );
                            },
                            disabled: instantAddLoading === "paper",
                            className: "py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            "data-ocid": "attendance.instant_add_paper_button",
                            children: instantAddLoading === "paper" ? "…" : "+ Paper"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              if (!contract) return;
                              setInstantAddLoading("mesh");
                              addWorkColumn.mutate(
                                {
                                  contractId: contract.id,
                                  name: "",
                                  workType: "mesh"
                                },
                                {
                                  onSettled: () => setInstantAddLoading(null),
                                  onError: () => setInstantAddLoading(null)
                                }
                              );
                            },
                            disabled: instantAddLoading === "mesh",
                            className: "py-2 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            "data-ocid": "attendance.instant_add_mesh_button",
                            children: instantAddLoading === "mesh" ? "…" : "+ Mesh"
                          }
                        )
                      ] })
                    ] })
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AttendanceTable,
              {
                contract,
                workColumns: sortedWorkColumns,
                labours,
                attendance: mergedAttendance,
                canEdit,
                onChange: handleAttendanceChange
              }
            )
          ] })
        ] }),
        showQuickMark && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4",
            "data-ocid": "attendance.quick_mark.dialog",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "w-full max-w-sm mx-auto max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-white/10",
                style: { background: "rgba(5,10,20,0.97)" },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 p-4 border-b border-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-orange-400 leading-tight truncate", children: (contract == null ? void 0 : contract.name) ?? "" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/50 mt-0.5", children: "Mark Attendance" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setShowQuickMark(false);
                          setQuickMarkColumnId(null);
                          setShowCompletion(false);
                        },
                        className: "ml-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors",
                        "aria-label": "Close quick mark",
                        "data-ocid": "attendance.quick_mark.close",
                        children: "✕"
                      }
                    )
                  ] }) }),
                  quickMarkColumnId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-4 py-2 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-green-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold text-green-400", children: liveColumnPresentCount }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-green-400 font-medium", children: "Present" })
                  ] }),
                  !showCompletion && quickMarkColumnId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-4 pb-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-orange-400 tracking-wider uppercase mb-1", children: "Column" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "select",
                      {
                        value: quickMarkColumnId,
                        onChange: (e) => {
                          setQuickMarkColumnId(e.target.value);
                          setQuickMarkIndex(0);
                        },
                        className: "w-full bg-[#0d1220] border border-orange-500 text-white rounded-lg p-2 text-sm focus:outline-none",
                        "data-ocid": "attendance.quick_mark.column_select",
                        children: sortedWorkColumns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "option",
                          {
                            value: col.id,
                            className: "bg-[#0a0f1e]",
                            children: col.name
                          },
                          col.id
                        ))
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto min-h-0 px-4 pb-2", children: [
                    showCompletion && contract && !showContractSwitcher && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-3 py-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-green-400" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-bold text-green-400", children: completionCount })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-300 font-medium", children: "Total Present" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setShowCompletion(false);
                            setQuickMarkColumnId(null);
                            setQuickMarkIndex(0);
                          },
                          className: "w-full py-2.5 rounded-xl btn-orange text-sm font-semibold",
                          "data-ocid": "attendance.quick_mark.mark_another_button",
                          children: "Mark Another Column"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setContractSwitcherQuery("");
                            setShowContractSwitcher(true);
                          },
                          className: "w-full py-2.5 rounded-xl bg-white/5 border border-orange-500/40 text-orange-300 text-sm font-semibold hover:bg-orange-500/10 hover:border-orange-500/60 transition-colors",
                          "data-ocid": "attendance.quick_mark.different_contract_button",
                          children: "Mark Attendance for Different Contract"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setShowCompletion(false);
                            setShowQuickMark(false);
                            setQuickMarkColumnId(null);
                          },
                          className: "w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors",
                          "data-ocid": "attendance.quick_mark.done_button",
                          children: "Done"
                        }
                      )
                    ] }),
                    showContractSwitcher && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "space-y-3 py-2",
                        "data-ocid": "attendance.quick_mark.contract_switcher",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-orange-400 tracking-wider uppercase", children: "Switch Contract" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-white/40 mt-0.5", children: "Pick a contract to continue marking" })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                type: "button",
                                onClick: () => {
                                  setShowContractSwitcher(false);
                                  setContractSwitcherQuery("");
                                },
                                className: "shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors",
                                "aria-label": "Cancel contract switch",
                                "data-ocid": "attendance.quick_mark.contract_switcher.cancel",
                                children: "✕"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "svg",
                              {
                                className: "absolute left-3 top-1/2 -translate-y-1/2 text-white/40",
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                "aria-hidden": "true",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m21 21-4.3-4.3" })
                                ]
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "input",
                              {
                                type: "text",
                                value: contractSwitcherQuery,
                                onChange: (e) => setContractSwitcherQuery(e.target.value),
                                placeholder: "Search contracts...",
                                className: "w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 focus:bg-white/10 transition-colors",
                                "data-ocid": "attendance.quick_mark.contract_switcher.search_input"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 max-h-[40vh] overflow-y-auto pr-1", children: [
                            switchableContracts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                className: "rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center",
                                "data-ocid": "attendance.quick_mark.contract_switcher.empty_state",
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/50", children: contracts.filter((c) => !c.settled).length <= 1 ? "No other active contracts available" : "No contracts match your search" })
                              }
                            ),
                            switchableContracts.map((c, idx) => {
                              const totalPool = (c.bedAmount ?? 0) + (c.paperAmount ?? 0) + (c.meshAmount ?? 0);
                              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => handleSwitchContract(c.id),
                                  className: "w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:border-orange-500/50 hover:bg-orange-500/[0.08] transition-all p-3 group",
                                  "data-ocid": `attendance.quick_mark.contract_switcher.item.${idx + 1}`,
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white truncate group-hover:text-orange-300 transition-colors", children: c.name }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1 flex-wrap", children: [
                                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] font-medium text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-md px-1.5 py-0.5", children: [
                                          c.workColumns.length,
                                          " cols"
                                        ] }),
                                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-md px-1.5 py-0.5", children: [
                                          formatCurrency(totalPool),
                                          " pool"
                                        ] })
                                      ] })
                                    ] }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-orange-500 group-hover:border-orange-400 group-hover:text-white transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                      "svg",
                                      {
                                        width: "14",
                                        height: "14",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        "aria-hidden": "true",
                                        children: [
                                          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 12h14" }),
                                          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m12 5 7 7-7 7" })
                                        ]
                                      }
                                    ) })
                                  ] })
                                },
                                String(c.id)
                              );
                            })
                          ] })
                        ]
                      }
                    ),
                    !showCompletion && !quickMarkColumnId && contract && !showContractSwitcher && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 py-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-orange-400 tracking-wider uppercase", children: "Select Column" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: sortedWorkColumns.map((col) => {
                        const hasAttendance = columnHasAttendance(
                          mergedAttendance,
                          col.id
                        );
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              setQuickMarkColumnId(col.id);
                              setQuickMarkIndex(0);
                            },
                            className: `py-3 rounded-xl border text-sm font-semibold transition-colors ${hasAttendance ? "bg-green-500/15 border-green-500/50 text-green-400 hover:bg-green-500/25" : "bg-white/5 border-white/15 text-white hover:bg-orange-500/10 hover:border-orange-500/30"}`,
                            "data-ocid": `attendance.quick_mark.column.${col.id}`,
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: col.name }),
                              hasAttendance && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] mt-0.5 opacity-80", children: "✓ Marked" })
                            ]
                          },
                          col.id
                        );
                      }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/10 pt-3 mt-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 font-medium uppercase tracking-wider mb-2", children: "Create New" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                if (!contract) return;
                                setInstantAddLoading("bed");
                                addWorkColumn.mutate(
                                  {
                                    contractId: contract.id,
                                    name: "",
                                    workType: "bed"
                                  },
                                  {
                                    onSettled: () => setInstantAddLoading(null),
                                    onError: () => setInstantAddLoading(null)
                                  }
                                );
                              },
                              disabled: instantAddLoading === "bed",
                              className: "py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 text-xs font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                              "data-ocid": "attendance.instant_add_bed_button",
                              children: instantAddLoading === "bed" ? "…" : "+ Bed"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                if (!contract) return;
                                setInstantAddLoading("paper");
                                addWorkColumn.mutate(
                                  {
                                    contractId: contract.id,
                                    name: "",
                                    workType: "paper"
                                  },
                                  {
                                    onSettled: () => setInstantAddLoading(null),
                                    onError: () => setInstantAddLoading(null)
                                  }
                                );
                              },
                              disabled: instantAddLoading === "paper",
                              className: "py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                              "data-ocid": "attendance.instant_add_paper_button",
                              children: instantAddLoading === "paper" ? "…" : "+ Paper"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                if (!contract) return;
                                setInstantAddLoading("mesh");
                                addWorkColumn.mutate(
                                  {
                                    contractId: contract.id,
                                    name: "",
                                    workType: "mesh"
                                  },
                                  {
                                    onSettled: () => setInstantAddLoading(null),
                                    onError: () => setInstantAddLoading(null)
                                  }
                                );
                              },
                              disabled: instantAddLoading === "mesh",
                              className: "py-2 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                              "data-ocid": "attendance.instant_add_mesh_button",
                              children: instantAddLoading === "mesh" ? "…" : "+ Mesh"
                            }
                          )
                        ] })
                      ] })
                    ] }),
                    !showCompletion && quickMarkColumnId && labours.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 py-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-white/50", children: [
                          "Labour ",
                          quickMarkIndex + 1,
                          " of ",
                          labours.length
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-4xl font-black text-white text-center py-3", children: (_a = labours[quickMarkIndex]) == null ? void 0 : _a.name })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: handleMarkAllPresent,
                          className: "rounded-full bg-green-600/20 text-green-400 border border-green-500 px-6 py-2 mx-auto block text-sm font-semibold hover:bg-green-600/30 transition-colors",
                          "data-ocid": "attendance.quick_mark.mark_all_present",
                          children: "✓ Mark All Present"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 justify-center py-2", children: currentLabourStatuses.map(({ col, val }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: "flex flex-col items-center gap-0.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-white/40 uppercase tracking-wider", children: col.name }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${val.__kind__ === "present" ? "bg-green-500 text-white" : val.__kind__ === "partial" ? "bg-orange-500 text-white" : "bg-white/10 text-white/50"}`,
                                children: val.__kind__ === "present" ? "P" : val.__kind__ === "partial" ? String(val.partial) : "A"
                              }
                            )
                          ]
                        },
                        col.id
                      )) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-orange-400/70 text-center uppercase tracking-wider my-2", children: "Mark as — auto-advances on selection" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 my-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleQuickMark({ __kind__: "absent", absent: null }),
                            className: "h-16 rounded-xl bg-rose-700 border border-rose-500 text-white font-bold text-lg w-full hover:bg-rose-600 transition-colors active:scale-95",
                            "data-ocid": "attendance.quick_mark.absent",
                            children: "✕ Absent"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleQuickMark({ __kind__: "present", present: null }),
                            className: "h-16 rounded-xl bg-emerald-500 border border-emerald-400 text-white font-bold text-lg w-full hover:bg-emerald-400 transition-colors active:scale-95",
                            "data-ocid": "attendance.quick_mark.present",
                            children: "✓ Present"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          value: "",
                          onChange: (e) => {
                            const v = Number.parseFloat(e.target.value);
                            if (!Number.isNaN(v)) {
                              handleQuickMark({ __kind__: "partial", partial: v });
                            }
                          },
                          className: "w-full bg-[#0d1220] border border-white/20 text-white/70 rounded-lg p-2 text-sm focus:outline-none",
                          "data-ocid": "attendance.quick_mark.partial_select",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", className: "bg-[#0a0f1e]", children: "Other values..." }),
                            PARTIAL_VALUES.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: v, className: "bg-[#0a0f1e]", children: v }, v))
                          ]
                        }
                      )
                    ] })
                  ] }),
                  !showCompletion && quickMarkColumnId && labours.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 p-4 pt-2 border-t border-white/10 grid grid-cols-2 gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setQuickMarkIndex((i) => Math.max(0, i - 1)),
                        disabled: quickMarkIndex === 0,
                        className: "bg-white/10 text-white rounded-xl py-3 font-semibold disabled:opacity-30 hover:bg-white/20 transition-colors",
                        "data-ocid": "attendance.quick_mark.prev",
                        children: "← Prev"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setQuickMarkIndex(
                          (i) => Math.min(labours.length - 1, i + 1)
                        ),
                        disabled: quickMarkIndex === labours.length - 1,
                        className: "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 font-semibold disabled:opacity-30 hover:from-orange-400 hover:to-orange-500 transition-colors",
                        "data-ocid": "attendance.quick_mark.next",
                        children: "Next →"
                      }
                    )
                  ] })
                ]
              }
            )
          }
        )
      ]
    }
  );
}
export {
  AttendanceTable,
  AttendancePage as default
};

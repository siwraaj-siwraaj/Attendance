import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SkeletonLoader, { SkeletonTable } from "../components/SkeletonLoader";
import { useAuth } from "../hooks/useAuth";
import {
  useAddWorkColumn,
  useAllAttendance,
  useContracts,
  useGetActiveLabours,
  useLabours,
  useRemoveWorkColumn,
  useSetAttendance,
  useUpdateWorkColumn,
} from "../hooks/useBackend";
import {
  PARTIAL_VALUES,
  getAttendanceDisplay,
  getAttendanceLabel,
  getBadgeClass,
  sortWorkColumns,
} from "../types";
import type {
  AttendanceRecord,
  AttendanceValue,
  Contract,
  Labour,
  WorkColumn,
} from "../types";

interface AttendancePageProps {
  selectedContractId?: bigint | null;
  onContractChange?: (id: bigint | null) => void;
  // When set to a non-null contract id, the page should select that contract
  // and auto-open the Manage Columns panel. The page acknowledges by calling
  // onColumnPickerOpened so the parent can clear the signal.
  openColumnPickerFor?: bigint | null;
  onColumnPickerOpened?: () => void;
}

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function getSelectBgClass(value: AttendanceValue): string {
  if (value.__kind__ === "present")
    return "bg-emerald-500 border-emerald-400 text-white";
  if (value.__kind__ === "absent")
    return "bg-rose-600 border-rose-500 text-white";
  return "bg-amber-500 border-amber-400 text-white";
}

function calculateLabourSalary(
  contract: Contract,
  allRecords: AttendanceRecord[],
  labourId: bigint,
): number {
  const workTypes = ["bed", "paper", "mesh"];
  let total = 0;
  for (const workType of workTypes) {
    const workTypeColumns = contract.workColumns.filter(
      (c) => c.workType === workType,
    );
    if (workTypeColumns.length === 0) continue;
    const workTypeAmount =
      workType === "bed"
        ? contract.bedAmount
        : workType === "paper"
          ? contract.paperAmount
          : workType === "mesh"
            ? contract.meshAmount
            : 0;
    if (workTypeAmount === 0) continue;
    const totalAttendanceSum = allRecords
      .filter((r) => workTypeColumns.some((c) => c.id === r.columnId))
      .reduce((sum, r) => sum + getAttendanceDisplay(r.value), 0);
    if (totalAttendanceSum === 0) continue;
    const labourAttendance = allRecords
      .filter(
        (r) =>
          r.labourId === labourId &&
          workTypeColumns.some((c) => c.id === r.columnId),
      )
      .reduce((sum, r) => sum + getAttendanceDisplay(r.value), 0);
    total += (labourAttendance / totalAttendanceSum) * workTypeAmount;
  }
  return total;
}

function getRecordValue(
  records: AttendanceRecord[],
  labourId: bigint,
  columnId: string,
): AttendanceValue {
  const rec = records.find(
    (r) => r.labourId === labourId && r.columnId === columnId,
  );
  return rec?.value ?? { __kind__: "absent", absent: null };
}

function columnHasAttendance(
  records: AttendanceRecord[],
  columnId: string,
): boolean {
  return records.some(
    (r) => r.columnId === columnId && r.value.__kind__ !== "absent",
  );
}

/**
 * Reusable attendance marking table. Renders one row per labour with a
 * per-work-column present/absent/partial dropdown (when canEdit) or a read-only
 * badge (otherwise), plus a totals row and pagination. Used by the standalone
 * AttendancePage and by the combined contract + attendance flow.
 */
export function AttendanceTable({
  contract,
  workColumns,
  labours,
  attendance,
  canEdit,
  onChange,
}: {
  contract: Contract;
  workColumns: WorkColumn[];
  labours: Labour[];
  attendance: AttendanceRecord[];
  canEdit: boolean;
  onChange: (
    labourId: bigint,
    columnId: string,
    value: AttendanceValue,
  ) => void;
}) {
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(labours.length / ITEMS_PER_PAGE);
  const paginatedLabours = labours.slice(
    (page - 1) * ITEMS_PER_PAGE,
    (page - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  const columnTotals = workColumns.map((col) =>
    attendance
      .filter((r) => r.columnId === col.id)
      .reduce((sum, r) => sum + getAttendanceDisplay(r.value), 0),
  );

  const netSalaryTotals = labours.reduce(
    (sum, l) => sum + calculateLabourSalary(contract, attendance, l.id),
    0,
  );

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="swipeable-table-wrapper">
        <table className="min-w-max text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="sticky left-0 z-10 bg-[#0f1525] px-3 py-3 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">
                S.No
              </th>
              <th className="sticky left-[48px] z-10 bg-[#0f1525] px-3 py-3 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">
                Labour
              </th>
              {workColumns.map((col) => (
                <th
                  key={col.id}
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-400 whitespace-nowrap"
                >
                  {col.name}
                </th>
              ))}
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 whitespace-nowrap">
                Net Salary
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedLabours.map((labour, idx) => {
              const netSalary = calculateLabourSalary(
                contract,
                attendance,
                labour.id,
              );
              return (
                <tr
                  key={String(labour.id)}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  data-ocid={`attendance.item.${idx + 1}`}
                >
                  <td className="sticky left-0 z-10 bg-[#0a0f1e]/90 px-3 py-2.5 text-gray-400 whitespace-nowrap">
                    {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>
                  <td className="sticky left-[48px] z-10 bg-[#0a0f1e]/90 px-3 py-2.5 text-white font-medium whitespace-nowrap">
                    {labour.name}
                  </td>
                  {workColumns.map((col) => {
                    const value = getRecordValue(attendance, labour.id, col.id);
                    return (
                      <td
                        key={col.id}
                        className="px-2 py-2 text-center whitespace-nowrap"
                      >
                        {canEdit ? (
                          <select
                            value={value.__kind__ === "partial" ? `partial:${value.partial}` : value.__kind__}
                            onChange={(e) => {
                              const selected = e.target.value;
                              const parsed: AttendanceValue =
                                selected === "present"
                                  ? { __kind__: "present", present: null }
                                  : selected === "absent"
                                    ? { __kind__: "absent", absent: null }
                                    : {
                                        __kind__: "partial",
                                        partial: Number(selected.replace("partial:", "")),
                                      };
                              onChange(labour.id, col.id, parsed);
                            }}
                            className={`w-20 px-1.5 py-1 rounded-md border text-xs text-white focus:outline-none focus:border-[#f97316] ${getSelectBgClass(value)}`}
                            data-ocid={`attendance.select.${idx + 1}.${col.id}`}
                          >
                            <option
                              value="present"
                              className="bg-[#0a0f1e]"
                            >
                              Present
                            </option>
                            <option
                              value="absent"
                              className="bg-[#0a0f1e]"
                            >
                              Absent
                            </option>
                            {PARTIAL_VALUES.map((v) => (
                              <option
                                key={v}
                                value={`partial:${v}`}
                                className="bg-[#0a0f1e]"
                              >
                                {v}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-medium ${getBadgeClass(value)}`}
                          >
                            {getAttendanceLabel(value)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-right text-white font-medium whitespace-nowrap">
                    {formatCurrency(netSalary)}
                  </td>
                </tr>
              );
            })}
            {/* Totals Row */}
            <tr className="border-t border-white/20 bg-white/[0.03] font-semibold">
              <td className="sticky left-0 z-10 bg-[#0f1525] px-3 py-3 text-gray-400 whitespace-nowrap">
                Total
              </td>
              <td className="sticky left-[48px] z-10 bg-[#0f1525] px-3 py-3 text-gray-400 whitespace-nowrap">
                —
              </td>
              {columnTotals.map((total, colIndex) => (
                <td
                  key={workColumns[colIndex]?.id ?? colIndex}
                  className="px-3 py-3 text-center text-[#f97316] whitespace-nowrap"
                >
                  {total.toFixed(2)}
                </td>
              ))}
              <td className="px-3 py-3 text-right text-[#f97316] whitespace-nowrap">
                {formatCurrency(netSalaryTotals)}
              </td>
            </tr>
            {/* Pagination */}
            {totalPages > 1 && (
              <tr className="border-t border-white/10">
                <td colSpan={workColumns.length + 3} className="px-3 py-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
                      data-ocid="attendance.pagination_prev"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
                      data-ocid="attendance.pagination_next"
                    >
                      Next →
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AttendancePage({
  selectedContractId,
  onContractChange,
  openColumnPickerFor,
  onColumnPickerOpened,
}: AttendancePageProps) {
  const { canEdit, isAdmin } = useAuth();

  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const { data: allLabours = [], isLoading: laboursLoading } = useLabours();
  const { data: activeLabours = [] } = useGetActiveLabours();
  const { data: allAttendance = [], isLoading: attendanceLoading } =
    useAllAttendance();

  const [selectedContractIdState, setSelectedContractIdState] = useState<
    bigint | null
  >(selectedContractId ?? null);

  // Quick Mark / column-picker state. Declared early so resetQuickMarkState
  // (defined just below) can close over the setters, and so the effects that
  // call resetQuickMarkState can reference it without "used before
  // declaration" errors.
  const [showQuickMark, setShowQuickMark] = useState(false);
  const [quickMarkIndex, setQuickMarkIndex] = useState(0);
  const [quickMarkColumnId, setQuickMarkColumnId] = useState<string | null>(
    null,
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [showContractSwitcher, setShowContractSwitcher] = useState(false);
  const [contractSwitcherQuery, setContractSwitcherQuery] = useState("");
  const [localAttendanceOverrides, setLocalAttendanceOverrides] = useState<
    Record<string, AttendanceValue>
  >({});

  // Reset all Quick Mark / column-picker state so it reflects the newly
  // selected contract. Invoked from every code path that changes the active
  // contract: banner <select>, parent prop sync, openColumnPickerFor signal,
  // and in-flow contract switcher.
  const resetQuickMarkState = useCallback(() => {
    setLocalAttendanceOverrides({});
    setQuickMarkColumnId(null);
    setQuickMarkIndex(0);
    setShowCompletion(false);
    setShowContractSwitcher(false);
    setContractSwitcherQuery("");
  }, []);

  // Notify parent when selection changes (for persistence across tab switches).
  // Also resets Quick Mark state so the picker never shows the previous
  // contract's column selection.
  const handleContractSelect = useCallback(
    (id: bigint | null) => {
      setSelectedContractIdState(id);
      onContractChange?.(id);
      resetQuickMarkState();
    },
    [onContractChange, resetQuickMarkState],
  );

  // Sync from parent when a new contract is passed (e.g. from View Attendance button)
  const prevSelectedContractIdRef = useRef<bigint | null>(null);
  if (
    selectedContractId !== null &&
    selectedContractId !== undefined &&
    selectedContractId !== prevSelectedContractIdRef.current
  ) {
    prevSelectedContractIdRef.current = selectedContractId;
    // Will be handled by the state init — actual sync happens via effect below
  }

  // Quick Mark signal: when the parent passes a non-null openColumnPickerFor,
  // select that contract, notify the parent, open the Manage Columns panel,
  // then clear the signal. This takes precedence over the regular sync below
  // because it carries an explicit user intent (post-save Quick Mark flow).
  const prevOpenColumnPickerForRef = useRef<bigint | null>(null);
  useEffect(() => {
    if (
      openColumnPickerFor !== null &&
      openColumnPickerFor !== undefined &&
      openColumnPickerFor !== prevOpenColumnPickerForRef.current
    ) {
      prevOpenColumnPickerForRef.current = openColumnPickerFor;
      prevSelectedContractIdRef.current = openColumnPickerFor;
      // Reset any stale Quick Mark state from a previous contract so the
      // picker that opens corresponds to the contract being requested.
      resetQuickMarkState();
      setSelectedContractIdState(openColumnPickerFor);
      onContractChange?.(openColumnPickerFor);
      setShowAddColumn(true);
      onColumnPickerOpened?.();
    }
  }, [
    openColumnPickerFor,
    onContractChange,
    onColumnPickerOpened,
    resetQuickMarkState,
  ]);

  // Regular sync from parent-selected contract (e.g. View Attendance button).
  // Skipped while a Quick Mark signal is in flight so the picker effect wins.
  // Resets Quick Mark state so the picker never reflects the previous
  // contract after the parent pushes a new selection.
  useEffect(() => {
    if (openColumnPickerFor) return;
    if (
      selectedContractId !== null &&
      selectedContractId !== undefined &&
      selectedContractId !== selectedContractIdState
    ) {
      prevSelectedContractIdRef.current = selectedContractId;
      resetQuickMarkState();
      setSelectedContractIdState(selectedContractId);
    }
  }, [
    selectedContractId,
    selectedContractIdState,
    openColumnPickerFor,
    resetQuickMarkState,
  ]);

  const effectiveContractId = selectedContractIdState;

  const contract = useMemo(
    () => contracts.find((c) => c.id === effectiveContractId),
    [contracts, effectiveContractId],
  );

  // Render-time sort of work columns: bed first, paper second, mesh third.
  // Backend storage order is unchanged — this only affects display.
  const sortedWorkColumns: WorkColumn[] = useMemo(
    () => (contract ? sortWorkColumns(contract.workColumns) : []),
    [contract],
  );

  const contractAttendance = useMemo(
    () => allAttendance.filter((r) => r.contractId === effectiveContractId),
    [allAttendance, effectiveContractId],
  );

  const labours = useMemo(() => {
    if (!contract) return [];
    const labourIdsWithAttendance = new Set(
      contractAttendance.map((r) => String(r.labourId)),
    );
    if (contract.settled) {
      return allLabours.filter((l) =>
        labourIdsWithAttendance.has(String(l.id)),
      );
    }
    // For upcoming/new contracts, only active labours are selectable rows.
    // Inactive labours that already have recorded attendance in this contract
    // stay visible so their previously recorded data remains intact.
    const activeIds = new Set(activeLabours.map((l) => String(l.id)));
    return allLabours.filter(
      (l) =>
        activeIds.has(String(l.id)) ||
        labourIdsWithAttendance.has(String(l.id)),
    );
  }, [contract, contractAttendance, allLabours, activeLabours]);

  // Reset all Quick Mark / column-picker state so it reflects the newly
  // selected contract. Mirrors the reset in handleSwitchContract and is
  // invoked from every code path that changes the active contract:
  //   - banner <select> (handleContractSelect)
  //   - parent prop sync (selectedContractId effect)
  //   - openColumnPickerFor signal effect
  //   - in-flow contract switcher (handleSwitchContract)
  // Without this, switching contracts mid-flow leaves the previous
  // contract's column picker / overrides / completion screen visible.
  // NOTE: resetQuickMarkState and handleContractSelect are defined above
  // (alongside the Quick Mark state they close over) so the effects that
  // reference them don't hit "used before declaration" errors.

  const setAttendance = useSetAttendance();
  const addWorkColumn = useAddWorkColumn();
  const updateWorkColumn = useUpdateWorkColumn();
  const removeWorkColumn = useRemoveWorkColumn();

  const [completionCount, setCompletionCount] = useState(0);

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnWorkType, setNewColumnWorkType] = useState("bed");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");
  // Tracks which instant-add button (+Bed/+Paper/+Mesh) is in flight so we
  // can show a per-button disabled/loading state while the mutation runs.
  const [instantAddLoading, setInstantAddLoading] = useState<string | null>(
    null,
  );

  // Merge backend attendance with local overrides for display
  const mergedAttendance = useMemo(() => {
    const base = [...contractAttendance];
    for (const [key, value] of Object.entries(localAttendanceOverrides)) {
      const [labourIdStr, columnId] = key.split("|");
      const labourId = BigInt(labourIdStr);
      const idx = base.findIndex(
        (r) => r.labourId === labourId && r.columnId === columnId,
      );
      if (idx >= 0) {
        base[idx] = { ...base[idx], value };
      } else if (effectiveContractId) {
        base.push({
          contractId: effectiveContractId,
          labourId,
          columnId,
          value,
        });
      }
    }
    return base;
  }, [contractAttendance, localAttendanceOverrides, effectiveContractId]);

  const pendingAttendanceRef = useRef<
    { labourId: bigint; columnId: string; value: AttendanceValue }[]
  >([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingAttendance = useCallback(() => {
    if (!effectiveContractId) return;
    const batch = pendingAttendanceRef.current.splice(0);
    if (batch.length === 0) return;
    for (const record of batch) {
      setAttendance.mutate(
        { contractId: effectiveContractId, ...record },
        {
          onSuccess: () => {},
          onError: (_err) => {},
        },
      );
    }
  }, [effectiveContractId, setAttendance]);

  const handleAttendanceChange = useCallback(
    (labourId: bigint, columnId: string, value: AttendanceValue) => {
      if (!effectiveContractId) return;
      // Reflect the change immediately in local overrides so the dropdown
      // updates without waiting for the optimistic cache patch or the
      // debounced batch-save round-trip.
      const overrideKey = `${String(labourId)}|${columnId}`;
      setLocalAttendanceOverrides((prev) => ({
        ...prev,
        [overrideKey]: value,
      }));
      pendingAttendanceRef.current.push({ labourId, columnId, value });
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = setTimeout(() => {
        flushPendingAttendance();
      }, 300);
    },
    [effectiveContractId, flushPendingAttendance],
  );

  const handleQuickMark = useCallback(
    (value: AttendanceValue) => {
      if (!contract || labours.length === 0 || !quickMarkColumnId) return;
      const labour = labours[quickMarkIndex];
      if (!labour) return;

      // Update local overrides immediately (preserves other values)
      const overrideKey = `${String(labour.id)}|${quickMarkColumnId}`;
      const newOverrides = {
        ...localAttendanceOverrides,
        [overrideKey]: value,
      };
      setLocalAttendanceOverrides(newOverrides);

      // Queue for batch save
      pendingAttendanceRef.current.push({
        labourId: labour.id,
        columnId: quickMarkColumnId,
        value,
      });
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = setTimeout(() => {
        flushPendingAttendance();
      }, 300);

      if (quickMarkIndex < labours.length - 1) {
        setQuickMarkIndex((i) => i + 1);
      } else {
        // Compute present count from merged attendance + new override
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
            (r) => r.labourId === l.id && r.columnId === quickMarkColumnId,
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
      localAttendanceOverrides,
    ],
  );

  const handleMarkAllPresent = useCallback(() => {
    if (!contract || !quickMarkColumnId) return;
    const newOverrides = { ...localAttendanceOverrides };
    for (const labour of labours) {
      const key = `${String(labour.id)}|${quickMarkColumnId}`;
      newOverrides[key] = { __kind__: "present", present: null };
      pendingAttendanceRef.current.push({
        labourId: labour.id,
        columnId: quickMarkColumnId,
        value: { __kind__: "present", present: null },
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
    flushPendingAttendance,
  ]);

  const handleAddColumn = useCallback(() => {
    if (!contract) return;

    const baseName =
      newColumnWorkType === "bed"
        ? "Bed"
        : newColumnWorkType === "paper"
          ? "Paper"
          : newColumnWorkType === "mesh"
            ? "Mesh"
            : newColumnWorkType;

    const sameTypeCount = contract.workColumns.filter(
      (column) => column.workType === newColumnWorkType,
    ).length;

    const columnName =
      newColumnName.trim() ||
      (sameTypeCount === 0
        ? baseName
        : `${baseName} ${sameTypeCount + 1}`);

    addWorkColumn.mutate(
      {
        contractId: contract.id,
        name: columnName,
        workType: newColumnWorkType,
      },
      {
        onSuccess: () => {
          setNewColumnName("");
          // Keep the Manage Columns panel open so the user can add more
          // columns. The panel is only dismissed via the explicit
          // Cancel/Close button.
        },
      },
    );
  }, [contract, newColumnName, newColumnWorkType, addWorkColumn]);

  // Current labour's per-column status for quick mark dialog
  const currentLabourStatuses = useMemo(() => {
    if (!contract || !labours[quickMarkIndex]) return [];
    const labour = labours[quickMarkIndex];
    return sortedWorkColumns.map((col) => {
      const key = `${String(labour.id)}|${col.id}`;
      const overrideVal = localAttendanceOverrides[key];
      const val =
        overrideVal ?? getRecordValue(contractAttendance, labour.id, col.id);
      return { col, val };
    });
  }, [
    contract,
    sortedWorkColumns,
    labours,
    quickMarkIndex,
    localAttendanceOverrides,
    contractAttendance,
  ]);

  // Present count for selected column (live)
  const liveColumnPresentCount = useMemo(() => {
    if (!quickMarkColumnId) return 0;
    return labours.filter((l) => {
      const key = `${String(l.id)}|${quickMarkColumnId}`;
      const overrideVal = localAttendanceOverrides[key];
      const val =
        overrideVal ??
        getRecordValue(contractAttendance, l.id, quickMarkColumnId);
      if (val.__kind__ === "present") return true;
      if (val.__kind__ === "partial" && val.partial > 0) return true;
      return false;
    }).length;
  }, [
    labours,
    quickMarkColumnId,
    localAttendanceOverrides,
    contractAttendance,
  ]);

  // Contracts available for the in-flow switcher (non-settled, excludes the
  // currently active contract so the list always represents a real switch).
  const switchableContracts = useMemo(() => {
    const q = contractSwitcherQuery.trim().toLowerCase();
    return contracts
      .filter((c) => !c.settled)
      .filter((c) => c.id !== effectiveContractId)
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true));
  }, [contracts, effectiveContractId, contractSwitcherQuery]);

  // Selecting a contract inside the Quick Mark flow: set it as the active
  // attendance contract (reusing the same path as the banner selector) and
  // advance the flow to the column-selection step for the newly chosen
  // contract — without leaving the Quick Mark dialog.
  const handleSwitchContract = useCallback(
    (id: bigint) => {
      // handleContractSelect already resets Quick Mark state via
      // resetQuickMarkState, so the picker reflects the new contract.
      handleContractSelect(id);
    },
    [handleContractSelect],
  );

  const isLoading = contractsLoading || laboursLoading || attendanceLoading;

  if (isLoading) {
    return (
      <div className="space-y-4" data-ocid="attendance.loading_state">
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      data-ocid="attendance.page"
    >
      {/* Frozen Header Banner */}
      <div
        className="shrink-0 sticky top-0 z-10 border-b border-white/10"
        style={{ background: "#0a0f1e" }}
      >
        {/* Banner from uploaded design */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0a0f1e 0%, #1a0f00 50%, #0a1a10 100%)",
            minHeight: "80px",
          }}
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(10,15,30,0.85) 0%, rgba(249,115,22,0.15) 60%, rgba(10,15,30,0.9) 100%)",
            }}
          />
          <div className="relative z-10 px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.5)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-white leading-tight tracking-tight">
                  Attendance
                </h1>
                <p className="text-xs text-white/50">Track daily attendance</p>
              </div>
            </div>
          </div>

          {/* Contract selector inside banner */}
          <div className="relative z-10 px-4 pb-3">
            <select
              id="contract-select"
              value={
                effectiveContractId !== null ? String(effectiveContractId) : ""
              }
              onChange={(e) => {
                const val = e.target.value;
                handleContractSelect(val ? BigInt(val) : null);
              }}
              className="w-full px-3 py-2 rounded-xl text-white text-sm focus:outline-none transition-all"
              style={{
                background: "rgba(5,10,20,0.85)",
                border: "1px solid rgba(249,115,22,0.4)",
              }}
              data-ocid="attendance.contract_select"
            >
              <option value="" className="bg-[#0a0f1e]">
                -- Choose a contract --
              </option>
              {contracts
                .filter((c) => !c.settled)
                .map((c) => (
                  <option
                    key={String(c.id)}
                    value={String(c.id)}
                    className="bg-[#0a0f1e]"
                  >
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Pool amount cards — only when a contract is selected */}
        {contract && (
          <div className="px-4 py-2 grid grid-cols-3 gap-2">
            <div
              className="rounded-xl p-2.5 text-center"
              style={{
                background: "rgba(20,184,166,0.12)",
                border: "1px solid rgba(20,184,166,0.3)",
              }}
            >
              <p className="text-[9px] font-bold text-teal-400 uppercase tracking-widest mb-0.5">
                Mesh Pool
              </p>
              <p className="text-sm font-black text-teal-300">
                ₹
                {(contract.meshAmount ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div
              className="rounded-xl p-2.5 text-center"
              style={{
                background: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.3)",
              }}
            >
              <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">
                Bed Pool
              </p>
              <p className="text-sm font-black text-orange-300">
                ₹
                {(contract.bedAmount ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div
              className="rounded-xl p-2.5 text-center"
              style={{
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.3)",
              }}
            >
              <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-0.5">
                Paper Pool
              </p>
              <p className="text-sm font-black text-purple-300">
                ₹
                {(contract.paperAmount ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4 pt-4">
        {!isLoading && !contract && (
          <div
            className="glass-card rounded-xl p-8 text-center text-gray-400"
            data-ocid="attendance.empty_state"
          >
            <p className="text-sm">Select a contract to view attendance</p>
          </div>
        )}

        {contract && (
          <>
            {/* Manage Columns + Quick Mark row. Quick Mark (marking
                attendance) is allowed for Admin and Attendance-only roles
                (canEdit). Manage Columns (add/rename/delete work columns —
                contract editing) is allowed only for Admin (isAdmin). */}
            {contract && (canEdit || isAdmin) && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowAddColumn((v) => !v)}
                      className="flex-1 py-2 rounded-lg border border-orange-500/50 bg-white/5 text-orange-400 text-xs font-semibold hover:bg-orange-500/10 transition-colors"
                      data-ocid="attendance.add_column_button"
                    >
                      ⚙ Manage Columns
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickMarkIndex(0);
                        setQuickMarkColumnId(null);
                        setShowCompletion(false);
                        setLocalAttendanceOverrides({});
                        setShowQuickMark(true);
                      }}
                      className="flex-1 py-2 rounded-lg btn-orange text-xs font-semibold"
                      aria-label="Quick Mark Attendance"
                      data-ocid="attendance.quick_mark_header_button"
                    >
                      ⚡ Quick Mark
                    </button>
                  )}
                </div>
                {isAdmin && (
                  <div
                    className={
                      showAddColumn
                        ? "glass-card rounded-xl p-3 space-y-2"
                        : "hidden"
                    }
                  >
                    {showAddColumn && (
                      <div className="space-y-3">
                        {/* Existing columns with rename/delete */}
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            Existing Columns
                          </p>
                          {sortedWorkColumns.map((col) => (
                            <div
                              key={col.id}
                              className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-white/[0.03]"
                            >
                              {editingColumnId === col.id ? (
                                <input
                                  type="text"
                                  value={editingColumnName}
                                  onChange={(e) =>
                                    setEditingColumnName(e.target.value)
                                  }
                                  onBlur={() => {
                                    if (editingColumnName.trim()) {
                                      updateWorkColumn.mutate({
                                        contractId: contract.id,
                                        columnId: col.id,
                                        name: editingColumnName.trim(),
                                      });
                                    }
                                    setEditingColumnId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (editingColumnName.trim()) {
                                        updateWorkColumn.mutate({
                                          contractId: contract.id,
                                          columnId: col.id,
                                          name: editingColumnName.trim(),
                                        });
                                      }
                                      setEditingColumnId(null);
                                    }
                                  }}
                                  className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#f97316]"
                                />
                              ) : (
                                <span className="text-sm text-white/80">
                                  {col.name}
                                </span>
                              )}
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingColumnId(col.id);
                                      setEditingColumnName(col.name);
                                    }}
                                    className="text-xs p-1 rounded text-orange-400 hover:bg-orange-500/10 transition-colors"
                                    aria-label="Rename column"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm("Delete column?"))
                                        removeWorkColumn.mutate({
                                          contractId: contract.id,
                                          columnId: col.id,
                                        });
                                    }}
                                    className="text-xs p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                                    aria-label="Delete column"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            Add New Column
                          </p>
                          <input
                            type="text"
                            placeholder="Column name (e.g. Bed 2, Paper 1)"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#f97316]"
                            data-ocid="attendance.add_column_input"
                          />
                          <select
                            value={newColumnWorkType}
                            onChange={(e) =>
                              setNewColumnWorkType(e.target.value)
                            }
                            className="w-full mt-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#f97316]"
                            data-ocid="attendance.add_column_worktype"
                          >
                            <option value="bed" className="bg-[#0a0f1e]">
                              Bed
                            </option>
                            <option value="paper" className="bg-[#0a0f1e]">
                              Paper
                            </option>
                            <option value="mesh" className="bg-[#0a0f1e]">
                              Mesh
                            </option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddColumn}
                            className="flex-1 py-2.5 rounded-lg btn-orange text-sm font-semibold"
                            data-ocid="attendance.add_column_save"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddColumn(false);
                              setNewColumnName("");
                            }}
                            className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
                            data-ocid="attendance.add_column_cancel"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Instant-add buttons — create a Bed/Paper/Mesh column
                          in one tap. The backend auto-generates the column
                          name (e.g. "Bed 1"). Each button shows its own
                          loading state via instantAddLoading. */}
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                            Quick Add
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!contract) return;
                                setInstantAddLoading("bed");
                                addWorkColumn.mutate(
                                  {
                                    contractId: contract.id,
                                    name: (() => {
                                      const count = contract.workColumns.filter(
                                        (column) => column.workType === "bed",
                                      ).length;
                                      return count === 0 ? "Bed" : `Bed ${count + 1}`;
                                    })(),
                                    workType: "bed",
                                  },
                                  {
                                    onSettled: () => setInstantAddLoading(null),
                                    onError: () => setInstantAddLoading(null),
                                  },
                                );
                              }}
                              disabled={instantAddLoading === "bed"}
                              className="py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 text-xs font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              data-ocid="attendance.instant_add_bed_button"
                            >
                              {instantAddLoading === "bed" ? "…" : "+ Bed"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!contract) return;
                                setInstantAddLoading("paper");
                                addWorkColumn.mutate(
                                  {
                                    contractId: contract.id,
                                    name: (() => {
                                      const count = contract.workColumns.filter(
                                        (column) => column.workType === "paper",
                                      ).length;
                                      return count === 0 ? "Paper" : `Paper ${count + 1}`;
                                    })(),
                                    workType: "paper",
                                  },
                                  {
                                    onSettled: () => setInstantAddLoading(null),
                                    onError: () => setInstantAddLoading(null),
                                  },
                                );
                              }}
                              disabled={instantAddLoading === "paper"}
                              className="py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              data-ocid="attendance.instant_add_paper_button"
                            >
                              {instantAddLoading === "paper" ? "…" : "+ Paper"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!contract) return;
                                setInstantAddLoading("mesh");
                                addWorkColumn.mutate(
                                  {
                                    contractId: contract.id,
                                    name: (() => {
                                      const count = contract.workColumns.filter(
                                        (column) => column.workType === "mesh",
                                      ).length;
                                      return count === 0 ? "Mesh" : `Mesh ${count + 1}`;
                                    })(),
                                    workType: "mesh",
                                  },
                                  {
                                    onSettled: () => setInstantAddLoading(null),
                                    onError: () => setInstantAddLoading(null),
                                  },
                                );
                              }}
                              disabled={instantAddLoading === "mesh"}
                              className="py-2 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              data-ocid="attendance.instant_add_mesh_button"
                            >
                              {instantAddLoading === "mesh" ? "…" : "+ Mesh"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Attendance Table */}
            <AttendanceTable
              contract={contract}
              workColumns={sortedWorkColumns}
              labours={labours}
              attendance={mergedAttendance}
              canEdit={canEdit}
              onChange={handleAttendanceChange}
            />
          </>
        )}
      </div>
      {/* end scrollable content */}

      {/* Quick Mark Dialog */}
      {showQuickMark && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          data-ocid="attendance.quick_mark.dialog"
        >
          <div
            className="w-full max-w-sm mx-auto max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-white/10"
            style={{ background: "rgba(5,10,20,0.97)" }}
          >
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-orange-400 leading-tight truncate">
                    {contract?.name ?? ""}
                  </h2>
                  <p className="text-sm text-white/50 mt-0.5">
                    Mark Attendance
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickMark(false);
                    setQuickMarkColumnId(null);
                    setShowCompletion(false);
                  }}
                  className="ml-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                  aria-label="Close quick mark"
                  data-ocid="attendance.quick_mark.close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Presence Count */}
            {quickMarkColumnId && (
              <div className="shrink-0 px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-2xl font-bold text-green-400">
                  {liveColumnPresentCount}
                </span>
                <span className="text-sm text-green-400 font-medium">
                  Present
                </span>
              </div>
            )}

            {/* Column Selector */}
            {!showCompletion && quickMarkColumnId && (
              <div className="shrink-0 px-4 pb-2">
                <p className="text-xs font-bold text-orange-400 tracking-wider uppercase mb-1">
                  Column
                </p>
                <select
                  value={quickMarkColumnId}
                  onChange={(e) => {
                    setQuickMarkColumnId(e.target.value);
                    setQuickMarkIndex(0);
                  }}
                  className="w-full bg-[#0d1220] border border-orange-500 text-white rounded-lg p-2 text-sm focus:outline-none"
                  data-ocid="attendance.quick_mark.column_select"
                >
                  {sortedWorkColumns.map((col) => (
                    <option
                      key={col.id}
                      value={col.id}
                      className="bg-[#0a0f1e]"
                    >
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-2">
              {/* Completion Screen */}
              {showCompletion && contract && !showContractSwitcher && (
                <div className="text-center space-y-3 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-4xl font-bold text-green-400">
                      {completionCount}
                    </span>
                  </div>
                  <p className="text-lg text-gray-300 font-medium">
                    Total Present
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompletion(false);
                      setQuickMarkColumnId(null);
                      setQuickMarkIndex(0);
                    }}
                    className="w-full py-2.5 rounded-xl btn-orange text-sm font-semibold"
                    data-ocid="attendance.quick_mark.mark_another_button"
                  >
                    Mark Another Column
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Open the in-flow contract selector instead of closing
                      // the dialog. The user picks a different non-settled
                      // contract and immediately continues marking attendance
                      // for it — without leaving the Quick Mark flow.
                      setContractSwitcherQuery("");
                      setShowContractSwitcher(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-orange-500/40 text-orange-300 text-sm font-semibold hover:bg-orange-500/10 hover:border-orange-500/60 transition-colors"
                    data-ocid="attendance.quick_mark.different_contract_button"
                  >
                    Mark Attendance for Different Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompletion(false);
                      setShowQuickMark(false);
                      setQuickMarkColumnId(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                    data-ocid="attendance.quick_mark.done_button"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* In-flow Contract Switcher — replaces the old "drop back to
                  banner dropdown" behavior. Polished card list, filters out
                  settled contracts and the currently active contract. */}
              {showContractSwitcher && (
                <div
                  className="space-y-3 py-2"
                  data-ocid="attendance.quick_mark.contract_switcher"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-orange-400 tracking-wider uppercase">
                        Switch Contract
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        Pick a contract to continue marking
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContractSwitcher(false);
                        setContractSwitcherQuery("");
                      }}
                      className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                      aria-label="Cancel contract switch"
                      data-ocid="attendance.quick_mark.contract_switcher.cancel"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      value={contractSwitcherQuery}
                      onChange={(e) => setContractSwitcherQuery(e.target.value)}
                      placeholder="Search contracts..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 focus:bg-white/10 transition-colors"
                      data-ocid="attendance.quick_mark.contract_switcher.search_input"
                    />
                  </div>

                  {/* Contract list */}
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {switchableContracts.length === 0 && (
                      <div
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
                        data-ocid="attendance.quick_mark.contract_switcher.empty_state"
                      >
                        <p className="text-sm text-white/50">
                          {contracts.filter((c) => !c.settled).length <= 1
                            ? "No other active contracts available"
                            : "No contracts match your search"}
                        </p>
                      </div>
                    )}
                    {switchableContracts.map((c, idx) => {
                      const totalPool =
                        (c.bedAmount ?? 0) +
                        (c.paperAmount ?? 0) +
                        (c.meshAmount ?? 0);
                      return (
                        <button
                          key={String(c.id)}
                          type="button"
                          onClick={() => handleSwitchContract(c.id)}
                          className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:border-orange-500/50 hover:bg-orange-500/[0.08] transition-all p-3 group"
                          data-ocid={`attendance.quick_mark.contract_switcher.item.${idx + 1}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                                {c.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-md px-1.5 py-0.5">
                                  {c.workColumns.length} cols
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-md px-1.5 py-0.5">
                                  {formatCurrency(totalPool)} pool
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-orange-500 group-hover:border-orange-400 group-hover:text-white transition-all">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Column Selection Step */}
              {!showCompletion &&
                !quickMarkColumnId &&
                contract &&
                !showContractSwitcher && (
                  <div className="space-y-2 py-2">
                    <p className="text-xs font-bold text-orange-400 tracking-wider uppercase">
                      Select Column
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {sortedWorkColumns.map((col) => {
                        const hasAttendance = columnHasAttendance(
                          mergedAttendance,
                          col.id,
                        );
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => {
                              setQuickMarkColumnId(col.id);
                              setQuickMarkIndex(0);
                            }}
                            className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
                              hasAttendance
                                ? "bg-green-500/15 border-green-500/50 text-green-400 hover:bg-green-500/25"
                                : "bg-white/5 border-white/15 text-white hover:bg-orange-500/10 hover:border-orange-500/30"
                            }`}
                            data-ocid={`attendance.quick_mark.column.${col.id}`}
                          >
                            <div>{col.name}</div>
                            {hasAttendance && (
                              <div className="text-[10px] mt-0.5 opacity-80">
                                ✓ Marked
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Instant-create buttons — create a new Bed/Paper/Mesh
                        column directly from the SELECT COLUMN dialog without
                        leaving it. Reuses the same handlers, loading-state
                        keys, data-ocid attributes, and color styling as the
                        Quick Add section in the Manage Columns panel. After a
                        successful add, the new column appears in the card grid
                        above via the contracts query refetch. */}
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                        Create New
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!contract) return;
                            setInstantAddLoading("bed");
                            addWorkColumn.mutate(
                              {
                                contractId: contract.id,
                                name: "",
                                workType: "bed",
                              },
                              {
                                onSettled: () => setInstantAddLoading(null),
                                onError: () => setInstantAddLoading(null),
                              },
                            );
                          }}
                          disabled={instantAddLoading === "bed"}
                          className="py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 text-xs font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          data-ocid="attendance.instant_add_bed_button"
                        >
                          {instantAddLoading === "bed" ? "…" : "+ Bed"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!contract) return;
                            setInstantAddLoading("paper");
                            addWorkColumn.mutate(
                              {
                                contractId: contract.id,
                                name: "",
                                workType: "paper",
                              },
                              {
                                onSettled: () => setInstantAddLoading(null),
                                onError: () => setInstantAddLoading(null),
                              },
                            );
                          }}
                          disabled={instantAddLoading === "paper"}
                          className="py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          data-ocid="attendance.instant_add_paper_button"
                        >
                          {instantAddLoading === "paper" ? "…" : "+ Paper"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!contract) return;
                            setInstantAddLoading("mesh");
                            addWorkColumn.mutate(
                              {
                                contractId: contract.id,
                                name: "",
                                workType: "mesh",
                              },
                              {
                                onSettled: () => setInstantAddLoading(null),
                                onError: () => setInstantAddLoading(null),
                              },
                            );
                          }}
                          disabled={instantAddLoading === "mesh"}
                          className="py-2 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          data-ocid="attendance.instant_add_mesh_button"
                        >
                          {instantAddLoading === "mesh" ? "…" : "+ Mesh"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Labour Marking Step */}
              {!showCompletion && quickMarkColumnId && labours.length > 0 && (
                <div className="space-y-3 py-2">
                  {/* Labour counter */}
                  <div className="text-center">
                    <p className="text-sm text-white/50">
                      Labour {quickMarkIndex + 1} of {labours.length}
                    </p>
                    <h3 className="text-4xl font-black text-white text-center py-3">
                      {labours[quickMarkIndex]?.name}
                    </h3>
                  </div>

                  {/* Mark All Present */}
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="rounded-full bg-green-600/20 text-green-400 border border-green-500 px-6 py-2 mx-auto block text-sm font-semibold hover:bg-green-600/30 transition-colors"
                    data-ocid="attendance.quick_mark.mark_all_present"
                  >
                    ✓ Mark All Present
                  </button>

                  {/* Per-column status indicators */}
                  <div className="flex gap-3 justify-center py-2">
                    {currentLabourStatuses.map(({ col, val }) => (
                      <div
                        key={col.id}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <span className="text-xs text-white/40 uppercase tracking-wider">
                          {col.name}
                        </span>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            val.__kind__ === "present"
                              ? "bg-green-500 text-white"
                              : val.__kind__ === "partial"
                                ? "bg-orange-500 text-white"
                                : "bg-white/10 text-white/50"
                          }`}
                        >
                          {val.__kind__ === "present"
                            ? "P"
                            : val.__kind__ === "partial"
                              ? String(val.partial)
                              : "A"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mark As label */}
                  <p className="text-xs text-orange-400/70 text-center uppercase tracking-wider my-2">
                    Mark as — auto-advances on selection
                  </p>

                  {/* Two large mark buttons */}
                  <div className="grid grid-cols-2 gap-3 my-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickMark({ __kind__: "absent", absent: null })
                      }
                      className="h-16 rounded-xl bg-rose-700 border border-rose-500 text-white font-bold text-lg w-full hover:bg-rose-600 transition-colors active:scale-95"
                      data-ocid="attendance.quick_mark.absent"
                    >
                      ✕ Absent
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickMark({ __kind__: "present", present: null })
                      }
                      className="h-16 rounded-xl bg-emerald-500 border border-emerald-400 text-white font-bold text-lg w-full hover:bg-emerald-400 transition-colors active:scale-95"
                      data-ocid="attendance.quick_mark.present"
                    >
                      ✓ Present
                    </button>
                  </div>

                  {/* Partial values dropdown */}
                  <select
                    value=""
                    onChange={(e) => {
                      const v = Number.parseFloat(e.target.value);
                      if (!Number.isNaN(v)) {
                        handleQuickMark({ __kind__: "partial", partial: v });
                      }
                    }}
                    className="w-full bg-[#0d1220] border border-white/20 text-white/70 rounded-lg p-2 text-sm focus:outline-none"
                    data-ocid="attendance.quick_mark.partial_select"
                  >
                    <option value="" className="bg-[#0a0f1e]">
                      Other values...
                    </option>
                    {PARTIAL_VALUES.map((v) => (
                      <option key={v} value={v} className="bg-[#0a0f1e]">
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Footer — Prev / Next */}
            {!showCompletion && quickMarkColumnId && labours.length > 0 && (
              <div className="shrink-0 p-4 pt-2 border-t border-white/10 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQuickMarkIndex((i) => Math.max(0, i - 1))}
                  disabled={quickMarkIndex === 0}
                  className="bg-white/10 text-white rounded-xl py-3 font-semibold disabled:opacity-30 hover:bg-white/20 transition-colors"
                  data-ocid="attendance.quick_mark.prev"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuickMarkIndex((i) =>
                      Math.min(labours.length - 1, i + 1),
                    )
                  }
                  disabled={quickMarkIndex === labours.length - 1}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 font-semibold disabled:opacity-30 hover:from-orange-400 hover:to-orange-500 transition-colors"
                  data-ocid="attendance.quick_mark.next"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

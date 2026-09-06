import React, { memo, useCallback, useMemo, useState } from "react";

import { useAuth } from "../hooks/useAuth";

import {
  useAdvances,
  useAllAttendance,
  useContracts,
  useDeleteContract,
  useLabours,
  useMarkContractSettled,
} from "../hooks/useBackend";

import { Archive } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAdminGuard } from "../hooks/useAdminGuard";
import { sortWorkColumns } from "../types";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtDate(ts: bigint | number | undefined) {
  if (!ts) return "—";
  const ms = Number(ts) / 1_000_000;
  if (!ms || Number.isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  const [processing, setProcessing] = useState<bigint | null>(null);
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<bigint | null>(null);
  const [settlePanelOpen, setSettlePanelOpen] = useState(true);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const unsettledContracts = useMemo(
    () => contracts.filter((c: any) => !c.settled),
    [contracts],
  );
  const settledContracts = useMemo(
    () => contracts.filter((c: any) => c.settled),
    [contracts],
  );

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSettleSelected = useCallback(() => {
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
            onError: () => setProcessing(null),
          },
        );
      }
      setCheckedIds(new Set());
    });
  }, [guardAction, checkedIds, markSettled]);

  const handleToggleSettled = useCallback(
    (id: bigint, currentSettled: boolean) => {
      guardAction(() => {
        setProcessing(id);
        markSettled.mutate(
          { id, settled: !currentSettled },
          {
            onSettled: () => setProcessing(null),
            onError: () => setProcessing(null),
          },
        );
      });
    },
    [guardAction, markSettled],
  );

  const handleDelete = useCallback(
    (id: bigint) => {
      guardAction(() => {
        setProcessing(id);
        deleteContract.mutate(id, {
          onSuccess: () => setConfirmDelete(null),
          onSettled: () => setProcessing(null),
          onError: () => setProcessing(null),
        });
      });
    },
    [guardAction, deleteContract],
  );

  if (isLoading)
    return (
      <div className="flex justify-center pt-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0a0f1e] text-white font-['Figtree',sans-serif]">
      {/* SECTION 1 — SETTLE CONTRACTS collapsible panel */}
      <div className="shrink-0 sticky top-0 z-10 bg-[#0a0f1e]">
        {unsettledContracts.length > 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-4">
            {/* Header row */}
            <button
              type="button"
              onClick={() => setSettlePanelOpen((v) => !v)}
              className="w-full flex items-center justify-between"
              data-ocid="settled.settle_panel_toggle"
            >
              <span className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                SETTLE CONTRACTS
              </span>
              <span className="text-white/60">
                {settlePanelOpen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </span>
            </button>

            {/* Expanded list */}
            {settlePanelOpen && (
              <div className="mt-3 space-y-2">
                {unsettledContracts.map((c: any) => {
                  const idStr = c.id.toString();
                  const isChecked = checkedIds.has(idStr);
                  return (
                    <div
                      key={idStr}
                      className="flex items-center gap-3"
                      data-ocid={`settled.checkbox.${idStr}`}
                    >
                      <button
                        type="button"
                        id={`settle-check-${idStr}`}
                        onClick={() => toggleCheck(idStr)}
                        className={`w-5 h-5 rounded border-2 border-orange-500 flex items-center justify-center transition-colors ${
                          isChecked ? "bg-orange-500" : "bg-transparent"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <label
                        htmlFor={`settle-check-${idStr}`}
                        className="text-white text-sm cursor-pointer"
                      >
                        {c.name}
                      </label>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSettleSelected}
                  disabled={checkedIds.size === 0 || processing !== null}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl mt-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  data-ocid="settled.settle_selected_button"
                >
                  {processing !== null
                    ? "Settling..."
                    : `Select contracts to settle (${checkedIds.size})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2 — Settled Contracts list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Settled Contracts</h2>
          <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {settledContracts.length}
          </span>
        </div>

        {contracts.length === 0 ? (
          <div
            className="glass-card rounded-2xl p-8 text-center text-gray-400"
            data-ocid="settled.empty_state"
          >
            No contracts found.
          </div>
        ) : (
          <div className="space-y-3">
            {settledContracts.map((c: any) => {
              const isExpanded = expandedId === c.id;
              const contractAttendance = allAttendance.filter(
                (r: any) => r.contractId === c.id,
              );
              const presentCount = contractAttendance.filter(
                (r: any) =>
                  r.value.__kind__ === "present" ||
                  r.value.__kind__ === "partial",
              ).length;
              const contractAdvances = advances.filter(
                (a: any) => a.contractId === c.id,
              );
              const totalAdvances = contractAdvances.reduce(
                (sum: number, a: any) => sum + a.amount,
                0,
              );

              // Labour attendance summary for this contract
              const labourSummaries = labours
                .map((l: any) => {
                  const labourRecs = contractAttendance.filter(
                    (r: any) => r.labourId === l.id,
                  );
                  const totalDays = labourRecs.reduce((sum: number, r: any) => {
                    if (r.value.__kind__ === "present") return sum + 1;
                    if (r.value.__kind__ === "partial")
                      return sum + r.value.partial;
                    return sum;
                  }, 0);
                  return { labour: l, totalDays };
                })
                .filter((s) => s.totalDays > 0);

              return (
                <div
                  key={c.id.toString()}
                  className="rounded-2xl bg-white/5 border border-white/10 border-l-4 border-l-orange-500 p-4 mb-3"
                  data-ocid={`settled.item.${c.id.toString()}`}
                >
                  {/* Card header — always visible */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="w-full text-left flex items-start justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-white mb-1">
                        {c.name}
                      </p>
                      <p className="text-xs text-white/50">
                        Created: {fmtDate(c.createdAt)}
                      </p>
                      <p className="text-xs text-white/50">
                        — Settled:{" "}
                        {fmtDate(c.settledAt || c.updatedAt || c.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xl font-bold text-orange-400 mb-1">
                        {fmt(c.contractAmount)}
                      </p>
                      <p className="text-xs text-white/40">
                        {isExpanded ? "Tap to collapse" : "Tap to view details"}
                      </p>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                      {/* Financial breakdown */}
                      <div>
                        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                          Contract Details
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="glass-card bg-[#0f1525]/50 p-3 rounded-xl">
                            <p className="text-gray-500 text-xs">
                              Contract Amount
                            </p>
                            <p className="text-white font-semibold text-sm">
                              {fmt(c.contractAmount)}
                            </p>
                          </div>
                          <div className="glass-card bg-[#0f1525]/50 p-3 rounded-xl">
                            <p className="text-gray-500 text-xs">Multiplier</p>
                            <p className="text-white font-semibold text-sm">
                              {c.multiplier}×
                            </p>
                          </div>
                          <div className="glass-card bg-[#0f1525]/50 p-3 rounded-xl">
                            <p className="text-gray-500 text-xs">Bed Amount</p>
                            <p className="text-cyan-400 font-semibold text-sm">
                              {fmt(c.bedAmount)}
                            </p>
                          </div>
                          <div className="glass-card bg-[#0f1525]/50 p-3 rounded-xl">
                            <p className="text-gray-500 text-xs">
                              Paper Amount
                            </p>
                            <p className="text-cyan-400 font-semibold text-sm">
                              {fmt(c.paperAmount)}
                            </p>
                          </div>
                          <div className="glass-card bg-[#0f1525]/50 p-3 rounded-xl">
                            <p className="text-gray-500 text-xs">Mesh Amount</p>
                            <p className="text-cyan-400 font-semibold text-sm">
                              {fmt(c.meshAmount || 0)}
                            </p>
                          </div>
                          <div className="glass-card bg-[#0f1525]/50 p-3 rounded-xl">
                            <p className="text-gray-500 text-xs">
                              Machine Expenses
                            </p>
                            <p className="text-red-400 font-semibold text-sm">
                              {fmt(c.machineExpenses)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div>
                        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                          Timeline
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="glass-card rounded-lg p-2.5">
                            <p className="text-gray-500 text-xs">Created</p>
                            <p className="text-white text-sm">
                              {fmtDate(c.createdAt)}
                            </p>
                          </div>
                          <div className="glass-card rounded-lg p-2.5">
                            <p className="text-gray-500 text-xs">Status</p>
                            <p className="text-sm font-semibold text-green-400">
                              Settled
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Settlement Date */}
                      <div className="glass-card bg-[#0f1525]/50 p-3 rounded-xl">
                        <p className="text-gray-500 text-xs">Settlement Date</p>
                        <p className="text-green-400 text-sm font-semibold">
                          {fmtDate(c.settledAt || c.updatedAt || c.createdAt)}
                        </p>
                      </div>

                      {c.workColumns.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                            Work Columns ({c.workColumns.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sortWorkColumns(c.workColumns).map((col: any) => (
                              <span
                                key={col.id}
                                className="text-xs bg-white/10 text-gray-300 border border-white/10 px-2.5 py-1 rounded-full"
                              >
                                {col.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attendance summary */}
                      {labourSummaries.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                            Attendance Summary ({presentCount} records)
                          </p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {labourSummaries.map((s) => (
                              <div
                                key={s.labour.id.toString()}
                                className="flex items-center justify-between glass-card rounded-lg px-3 py-2"
                              >
                                <span className="text-white text-sm">
                                  {s.labour.name}
                                </span>
                                <span className="text-cyan-400 text-sm font-semibold">
                                  {s.totalDays} days
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advances summary */}
                      {contractAdvances.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                            Advances ({contractAdvances.length})
                          </p>
                          <div className="glass-card rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">
                                Total Advances
                              </span>
                              <span className="text-red-400 font-semibold">
                                {fmt(totalAdvances)}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                              {contractAdvances.map((a: any) => {
                                const labour = labours.find(
                                  (l: any) => l.id === a.labourId,
                                );
                                return (
                                  <div
                                    key={a.id.toString()}
                                    className="flex justify-between text-xs text-gray-400"
                                  >
                                    <span>
                                      {labour?.name ?? "Unknown"}
                                      {a.note ? ` — ${a.note}` : ""}
                                    </span>
                                    <span>{fmt(a.amount)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSettled(c.id, c.settled)}
                          disabled={processing === c.id}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                          data-ocid={`settled.toggle_button.${c.id.toString()}`}
                        >
                          {processing === c.id ? "..." : "Unsettle"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(c.id)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-900/60"
                          data-ocid={`settled.delete_button.${c.id.toString()}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-dialog rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-white font-bold text-lg mb-2">
              Delete Contract?
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              This action cannot be undone. All attendance and advances data for
              this contract will be lost.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                disabled={processing === confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                data-ocid="settled.confirm_button"
              >
                {processing === confirmDelete ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 text-gray-400 hover:text-white"
                data-ocid="settled.cancel_button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SettledPage);

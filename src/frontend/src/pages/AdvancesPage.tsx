import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../hooks/useAuth";

import {
  useAddAdvance,
  useAdvances,
  useContracts,
  useDeleteAdvance,
  useLabours,
  useUpdateAdvance,
} from "../hooks/useBackend";

import LoadingSpinner from "../components/LoadingSpinner";

function AdvancesPage() {
  const { isAdmin } = useAuth();
  const { data: contracts = [] } = useContracts();
  const { data: labours = [] } = useLabours();
  const { data: advances = [], isLoading } = useAdvances();
  const addAdvance = useAddAdvance();
  const updateAdvance = useUpdateAdvance();
  const deleteAdvance = useDeleteAdvance();

  const [filterContractId, setFilterContractId] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<bigint | null>(null);
  const [showCleared, setShowCleared] = useState(false);
  const [expandedLabourId, setExpandedLabourId] = useState<string | null>(null);
  const [form, setForm] = useState({
    contractId: "",
    labourId: "",
    amount: "",
    note: "",
  });
  const [error, setError] = useState("");

  const amountRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => amountRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  const isContractSettled = useCallback(
    (contractId: bigint) => {
      const c = contracts.find((c: any) => c.id === contractId);
      return c?.settled ?? false;
    },
    [contracts],
  );

  // Contracts selectable in the add/edit form. When editing an advance, always
  // include the contract actually attached to that advance (even if it has
  // since been settled) so the selector reliably shows the correct contract
  // instead of falling back to a previously selected one.
  const formContracts = useMemo(() => {
    const active = contracts.filter(
      (c: any) => !c.settled && c.settled !== 1n && c.settled !== BigInt(1),
    );
    if (editingAdvance) {
      const attached = contracts.find(
        (c: any) => c.id === editingAdvance.contractId,
      );
      if (attached && !active.some((c: any) => c.id === attached.id)) {
        return [...active, attached];
      }
    }
    return active;
  }, [contracts, editingAdvance]);

  const filtered = useMemo(
    () =>
      filterContractId === "all"
        ? advances
        : advances.filter(
            (a: any) => a.contractId.toString() === filterContractId,
          ),
    [advances, filterContractId],
  );

  const activeAdvances = useMemo(
    () => filtered.filter((a: any) => !isContractSettled(a.contractId)),
    [filtered, isContractSettled],
  );
  const clearedAdvances = useMemo(
    () => filtered.filter((a: any) => isContractSettled(a.contractId)),
    [filtered, isContractSettled],
  );

  const getLabourName = (id: bigint) =>
    labours.find((l: any) => l.id === id)?.name || "Unknown";
  const getContractName = (id: bigint) =>
    contracts.find((c: any) => c.id === id)?.name || "Unknown";

  const openAdd = useCallback(() => {
    setEditingAdvance(null);
    setForm({
      contractId: "",
      labourId: "",
      amount: "",
      note: "",
    });
    setError("");
    setShowForm(true);
  }, []);

  const openEdit = useCallback((a: any) => {
    setEditingAdvance(a);
    setForm({
      contractId: a.contractId.toString(),
      labourId: a.labourId.toString(),
      amount: a.amount.toString(),
      note: a.note,
    });
    setError("");
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.amount || Number.parseFloat(form.amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    // Close the dialog synchronously so the save feels instant. The mutation
    // hooks apply optimistic cache updates in onMutate, so the list already
    // reflects the change before the canister round-trip settles; on error the
    // hook rolls the cache back and we reopen the dialog so the user can retry.
    setShowForm(false);
    if (editingAdvance) {
      updateAdvance.mutate({
        id: editingAdvance.id,
        amount: Number.parseFloat(form.amount),
        note: form.note,
      });
    } else {
      addAdvance.mutate({
        contractId: BigInt(form.contractId),
        labourId: BigInt(form.labourId),
        amount: Number.parseFloat(form.amount),
        note: form.note,
      });
    }
  }, [form, editingAdvance, updateAdvance, addAdvance]);

  const handleDelete = useCallback(
    (id: bigint) => {
      deleteAdvance.mutate(id, {
        onSuccess: () => setConfirmDelete(null),
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Failed to delete";
          console.error("Delete advance error:", msg);
        },
      });
    },
    [deleteAdvance],
  );

  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const formatDateTime = (ts: bigint) => {
    try {
      const d = new Date(Number(ts) / 1_000_000);
      return d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "";
    }
  };

  function groupByLabour(advList: any[]) {
    const map = new Map<string, any[]>();
    for (const a of advList) {
      const key = a.labourId.toString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }

  function renderAdvancesSection(
    advList: any[],
    _title: string,
    emptyText: string,
  ) {
    if (!isLoading && advList.length === 0) {
      return (
        <div className="glass-card rounded-2xl p-6 text-center text-gray-400">
          {emptyText}
        </div>
      );
    }
    if (advList.length === 0) return null;
    const grouped = groupByLabour(advList);
    return (
      <div className="rounded-xl overflow-hidden border border-white/10">
        {Array.from(grouped.entries()).map(([labourId, items], idx, arr) => {
          const labourName = getLabourName(BigInt(labourId));
          const total = items.reduce((s, a) => s + a.amount, 0);
          const isExpanded = expandedLabourId === labourId;
          const isLast = idx === arr.length - 1;
          return (
            <div
              key={labourId}
              className={!isLast ? "border-b border-white/10" : ""}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedLabourId(isExpanded ? null : labourId)
                }
                className="w-full flex items-center justify-between px-3 py-2.5 text-left min-h-0"
                data-ocid="advances.labour_card.button"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className="text-white font-medium text-sm truncate">
                    {labourName}
                  </span>
                </div>
                <span className="text-[#f97316] font-bold text-sm shrink-0 ml-2">
                  {fmt(total)}
                </span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {items.map((a: any) => (
                    <div
                      key={a.id.toString()}
                      className="flex items-start justify-between bg-white/5 rounded-lg p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-orange-400 font-bold text-sm">
                            {fmt(a.amount)}
                          </span>
                          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                            {getContractName(a.contractId)}
                          </span>
                        </div>
                        {a.note && (
                          <div className="text-gray-300 text-sm">{a.note}</div>
                        )}
                        <div className="text-gray-500 text-xs mt-1">
                          {formatDateTime(a.createdAt)}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 ml-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="text-orange-400 text-sm hover:text-orange-300"
                            data-ocid="advances.edit_button"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(a.id)}
                            className="text-red-400 text-sm hover:text-red-300"
                            data-ocid="advances.delete_button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Total outstanding = sum of ALL non-cleared advances (ignores contract filter)
  const totalOutstanding = useMemo(
    () =>
      advances
        .filter((a: any) => !isContractSettled(a.contractId))
        .reduce((sum: number, a: any) => sum + a.amount, 0),
    [advances, isContractSettled],
  );

  if (isLoading)
    return (
      <div className="flex justify-center pt-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-white font-['Figtree',sans-serif]">
      {/* FROZEN top: Total Outstanding + contract filter */}
      <div className="shrink-0 px-4 pt-4 pb-3 bg-[#0a0f1e] sticky top-0 z-10 space-y-3">
        {/* Total Outstanding Summary Card */}
        <div
          className="glass-card rounded-2xl p-4 border border-orange-500/40 relative overflow-hidden"
          data-ocid="advances.total_outstanding_card"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
          <p className="text-gray-400 text-sm font-medium mb-1">
            Total Outstanding
          </p>
          <p className="text-2xl font-bold text-[#f97316] tracking-tight">
            {fmt(totalOutstanding)}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Across all active contracts
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-base font-semibold text-white flex-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
            Advances
          </h1>
          <select
            value={filterContractId}
            onChange={(e) => setFilterContractId(e.target.value)}
            className="select-dark text-sm"
            data-ocid="advances.contract_filter"
          >
            <option value="all">All Contracts</option>
            {contracts
              .filter(
                (c: any) =>
                  !c.settled && c.settled !== 1n && c.settled !== BigInt(1),
              )
              .map((c: any) => (
                <option key={c.id.toString()} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Scrollable advance list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {/* Active Advances */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Active Advances
          </h2>
          {renderAdvancesSection(
            activeAdvances,
            "Active Advances",
            "No active advances recorded.",
          )}
        </div>

        {/* Cleared Advances */}
        <div>
          <button
            type="button"
            onClick={() => setShowCleared((s) => !s)}
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2 hover:text-white transition-colors"
          >
            <span>{showCleared ? "▼" : "▶"}</span>
            Cleared Advances ({clearedAdvances.length})
          </button>
          {showCleared &&
            renderAdvancesSection(
              clearedAdvances,
              "Cleared Advances",
              "No cleared advances recorded.",
            )}
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowForm(false);
          }}
          role="presentation"
          tabIndex={-1}
        >
          <div className="glass-dialog rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingAdvance ? "Edit Advance" : "Add Advance"}
            </h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="adv-contract"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Contract
                </label>
                <select
                  id="adv-contract"
                  value={form.contractId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contractId: e.target.value }))
                  }
                  className="w-full bg-[#0a0f1e] border border-orange-500/30 rounded-lg px-3 py-2 text-white outline-none"
                >
                  {formContracts.map((c: any) => (
                    <option key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="adv-labour"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Labour
                </label>
                <select
                  id="adv-labour"
                  value={form.labourId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, labourId: e.target.value }))
                  }
                  className="w-full bg-[#0a0f1e] border border-orange-500/30 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="" disabled>
                    Choose labour…
                  </option>
                  {labours.map((l: any) => (
                    <option key={l.id.toString()} value={l.id.toString()}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="adv-amount"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Amount (₹)
                </label>
                <input
                  ref={amountRef}
                  id="adv-amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label
                  htmlFor="adv-note"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Note (optional)
                </label>
                <input
                  id="adv-note"
                  type="text"
                  value={form.note}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, note: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  placeholder="Reason or note"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-orange flex-1 py-2.5 rounded-xl font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-dialog rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-white font-bold text-lg mb-2">
              Delete Advance?
            </h2>
            <p className="text-gray-400 text-sm mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                data-ocid="advances.confirm_delete_button"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 text-gray-400 hover:text-white"
                data-ocid="advances.cancel_delete_button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {isAdmin && (
        <button
          type="button"
          onClick={openAdd}
          className="fixed z-40 bottom-20 right-4 w-14 h-14 rounded-full btn-orange glow-orange flex items-center justify-center shadow-lg"
          aria-label="Add Advance"
          data-ocid="advances.add_button"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}

export default memo(AdvancesPage);

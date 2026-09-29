import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleDollarSign,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
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
import ScrollHeaderTitle from "../components/ScrollHeaderTitle";

type Advance = any;
type Contract = any;
type Labour = any;

const NAVY = "#172536";
const TEXT = "#101828";
const MUTED = "#667085";
const BORDER = "#E4E7EC";
const ORANGE = "#F97316";

const money = (value: number) =>
  `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

const isContractSettled = (contract: Contract) =>
  contract?.settled === true || contract?.settled === 1n;

const dateLabel = (timestamp: bigint) => {
  try {
    return new Date(Number(timestamp) / 1e6).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

function AdvancesPage() {
  const { isAdmin } = useAuth();
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const { data: labours = [], isLoading: laboursLoading } = useLabours();
  const { data: advances = [], isLoading: advancesLoading } = useAdvances();

  const addAdvance = useAddAdvance();
  const updateAdvance = useUpdateAdvance();
  const deleteAdvance = useDeleteAdvance();

  const [query, setQuery] = useState("");
  const [filterContractId, setFilterContractId] = useState("all");
  const [expandedLabourId, setExpandedLabourId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<bigint | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    contractId: "",
    labourId: "",
    amount: "",
    note: "",
  });
  const amountRef = useRef<HTMLInputElement>(null);

  const activeContracts = useMemo(
    () => contracts.filter((contract: Contract) => !isContractSettled(contract)),
    [contracts],
  );

  const formContracts = useMemo(() => {
    if (!editingAdvance) return activeContracts;
    const attached = contracts.find(
      (contract: Contract) => contract.id === editingAdvance.contractId,
    );
    if (!attached || activeContracts.some((contract: Contract) => contract.id === attached.id)) {
      return activeContracts;
    }
    return [...activeContracts, attached];
  }, [activeContracts, contracts, editingAdvance]);

  const labourName = useCallback(
    (id: bigint) =>
      labours.find((labour: Labour) => labour.id === id)?.name || "Unknown labour",
    [labours],
  );

  const contractName = useCallback(
    (id: bigint) =>
      contracts.find((contract: Contract) => contract.id === id)?.name || "Unknown contract",
    [contracts],
  );

  const outstandingAdvances = useMemo(
    () =>
      advances.filter(
        (advance: Advance) => !isContractSettled(
          contracts.find((contract: Contract) => contract.id === advance.contractId),
        ),
      ),
    [advances, contracts],
  );

  const outstandingAmount = useMemo(
    () =>
      outstandingAdvances.reduce(
        (sum: number, advance: Advance) => sum + Number(advance.amount || 0),
        0,
      ),
    [outstandingAdvances],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return outstandingAdvances.filter((advance: Advance) => {
      const contractMatches =
        filterContractId === "all" ||
        advance.contractId.toString() === filterContractId;
      if (!contractMatches) return false;
      if (!search) return true;
      return (
        labourName(advance.labourId).toLowerCase().includes(search) ||
        contractName(advance.contractId).toLowerCase().includes(search) ||
        String(advance.note || "").toLowerCase().includes(search)
      );
    });
  }, [
    outstandingAdvances,
    filterContractId,
    query,
    labourName,
    contractName,
  ]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Advance[]>();
    for (const advance of filtered) {
      const key = advance.labourId.toString();
      const list = groups.get(key) || [];
      list.push(advance);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const labourCount = useMemo(
    () => new Set(outstandingAdvances.map((advance: Advance) => advance.labourId.toString())).size,
    [outstandingAdvances],
  );

  useEffect(() => {
    if (!showForm) return;
    const timer = window.setTimeout(() => amountRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [showForm]);

  const openAdd = useCallback(() => {
    setEditingAdvance(null);
    setForm({
      contractId: formContracts[0]?.id?.toString() || "",
      labourId: "",
      amount: "",
      note: "",
    });
    setError("");
    setShowForm(true);
  }, [formContracts]);

  const openEdit = useCallback((advance: Advance) => {
    setEditingAdvance(advance);
    setForm({
      contractId: advance.contractId.toString(),
      labourId: advance.labourId.toString(),
      amount: String(advance.amount),
      note: advance.note || "",
    });
    setError("");
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    if (addAdvance.isPending || updateAdvance.isPending) return;
    setShowForm(false);
    setError("");
  }, [addAdvance.isPending, updateAdvance.isPending]);

  const save = useCallback(() => {
    const amount = Number(form.amount);
    if (!form.contractId || !form.labourId) {
      setError("Select a contract and labour.");
      return;
    }
    if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const onError = (cause: unknown) => {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save the advance. Please try again.",
      );
    };

    if (editingAdvance) {
      updateAdvance.mutate(
        { id: editingAdvance.id, amount, note: form.note.trim() },
        {
          onSuccess: () => {
            setShowForm(false);
            setError("");
          },
          onError,
        },
      );
      return;
    }

    addAdvance.mutate(
      {
        contractId: BigInt(form.contractId),
        labourId: BigInt(form.labourId),
        amount,
        note: form.note.trim(),
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setError("");
        },
        onError,
      },
    );
  }, [form, editingAdvance, addAdvance, updateAdvance]);

  const remove = useCallback(
    (id: bigint) => {
      deleteAdvance.mutate(id, {
        onSuccess: () => setConfirmDelete(null),
      });
    },
    [deleteAdvance],
  );

  const loading = contractsLoading || laboursLoading || advancesLoading;

  if (loading) {
    return (
      <div className="flex min-h-full flex-col bg-[#F8FAFC] text-[#101828]">
        <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] bg-[#172536] px-4 py-4 text-white sm:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">
                  <Wallet size={14} /> Payroll
                </div>
                <ScrollHeaderTitle title="Advances" className="text-2xl" />
                <p className="mt-0.5 text-[11px] text-white/55">Manage money paid before settlement.</p>
              </div>
              {isAdmin && <div className="h-11 w-24 animate-pulse rounded-2xl bg-white/10" />}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-[58px] animate-pulse rounded-2xl bg-white/[0.06]" />
              ))}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pt-4 pb-20 sm:px-6">
          <div className="rounded-2xl border bg-white p-3 shadow-sm" style={{ borderColor: BORDER }}>
            <div className="h-11 animate-pulse rounded-xl bg-[#F2F4F7]" />
          </div>
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm font-black">Loading advances…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F8FAFC] text-[#182230]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] bg-[#172536] px-4 py-3.5 text-white sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">
                <Wallet size={14} /> Payroll
              </div>
              <ScrollHeaderTitle title="Advances" className="text-2xl" />
              <p className="mt-0.5 max-w-xl text-[11px] leading-4 text-white/55">
                Track money paid to your team before settlement.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={openAdd}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-3 text-[11px] font-extrabold shadow-lg shadow-orange-950/30 active:scale-95"
                data-ocid="advances.add_button"
              >
                <Plus size={16} />
                <span>Add advance</span>
              </button>
            )}
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
              <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.15em] text-white/40">Outstanding</p>
              <p className="mt-1 truncate text-lg font-black leading-none text-white">{money(outstandingAmount)}</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
              <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.15em] text-white/40">Records</p>
              <p className="mt-1 text-lg font-black leading-none text-white">{outstandingAdvances.length}</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
              <p className="truncate text-[8px] font-extrabold uppercase tracking-[0.15em] text-white/40">Labours</p>
              <p className="mt-1 text-lg font-black leading-none text-white">{labourCount}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-3 pb-4 sm:px-6">
        <section className="rounded-2xl border bg-white p-1.5 shadow-sm" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search labour, contract or note"
                className="h-10 w-full rounded-xl bg-[#F8FAFC] px-9 text-xs text-[#101828] outline-none placeholder:text-[#98A2B3]"
                data-ocid="advances.search_input"
              />
            </div>
            <select
              value={filterContractId}
              onChange={(event) => setFilterContractId(event.target.value)}
              className="h-10 max-w-[40%] rounded-xl border bg-white px-2 text-[10px] font-bold text-[#101828] outline-none"
              style={{ borderColor: BORDER }}
              data-ocid="advances.contract_filter"
            >
              <option value="all">All active</option>
              {activeContracts.map((contract: Contract) => (
                <option key={contract.id.toString()} value={contract.id.toString()}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="pt-4">
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <h2 className="text-base font-black" style={{ color: TEXT }}>Outstanding advances</h2>
              <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Grouped by labour · tap a person for details</p>
            </div>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-extrabold text-orange-700">
              {filtered.length}
            </span>
          </div>

          {!grouped.length ? (
            <div className="rounded-2xl border border-dashed bg-white px-5 py-12 text-center" style={{ borderColor: BORDER }}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <CircleDollarSign size={25} />
              </div>
              <p className="mt-4 text-sm font-black" style={{ color: TEXT }}>
                {outstandingAdvances.length ? "No matching advances" : "No outstanding advances"}
              </p>
              <p className="mt-1 text-xs" style={{ color: MUTED }}>
                {outstandingAdvances.length
                  ? "Try a different search or contract filter."
                  : "Recorded advances will appear here until their contract is settled."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: BORDER }}>
              {grouped.map(([labourId, list], index) => {
                const expanded = expandedLabourId === labourId;
                const total = list.reduce(
                  (sum, advance) => sum + Number(advance.amount || 0),
                  0,
                );
                const labour = labourName(BigInt(labourId));

                return (
                  <article
                    key={labourId}
                    className={index ? "border-t" : ""}
                    style={{ borderColor: BORDER }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedLabourId(expanded ? null : labourId)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
                      aria-expanded={expanded}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#172536] text-white">
                        <UserRound size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold" style={{ color: TEXT }}>
                          {labour}
                        </span>
                        <span className="mt-0.5 block text-[11px]" style={{ color: MUTED }}>
                          {list.length} advance{list.length === 1 ? "" : "s"} · {dateLabel(list[0]?.createdAt)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-base font-black text-orange-600">{money(total)}</span>
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider" style={{ color: MUTED }}>
                          Total
                        </span>
                      </span>
                      {expanded ? (
                        <ChevronDown size={17} className="shrink-0 text-[#98A2B3]" />
                      ) : (
                        <ChevronRight size={17} className="shrink-0 text-[#98A2B3]" />
                      )}
                    </button>

                    {expanded && (
                      <div className="space-y-2 border-t bg-[#F8FAFC] p-3" style={{ borderColor: BORDER }}>
                        {list.map((advance: Advance) => (
                          <div
                            key={advance.id.toString()}
                            className="rounded-xl border bg-white p-3"
                            style={{ borderColor: BORDER }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-lg font-black" style={{ color: TEXT }}>
                                  {money(advance.amount)}
                                </p>
                                <p className="mt-1 truncate text-xs font-semibold" style={{ color: MUTED }}>
                                  {contractName(advance.contractId)}
                                </p>
                                {advance.note && (
                                  <p className="mt-2 break-words text-sm text-[#475467]">{advance.note}</p>
                                )}
                                <p className="mt-2 text-[10px] text-[#98A2B3]">{dateLabel(advance.createdAt)}</p>
                              </div>

                              {isAdmin && (
                                <div className="flex shrink-0 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(advance)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-95"
                                    aria-label="Edit advance"
                                    data-ocid="advances.edit_button"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDelete(advance.id)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 active:scale-95"
                                    aria-label="Delete advance"
                                    data-ocid="advances.delete_button"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-[#101828]/60 sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: BORDER }}>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-500">
                  {editingAdvance ? "Update record" : "New record"}
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {editingAdvance ? "Edit advance" : "Add advance"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
                aria-label="Close form"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Contract</span>
                <select
                  value={form.contractId}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, contractId: event.target.value }))
                  }
                  className="h-12 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-orange-400"
                  style={{ borderColor: "#D0D5DD" }}
                >
                  <option value="">Choose contract…</option>
                  {formContracts.map((contract: Contract) => (
                    <option key={contract.id.toString()} value={contract.id.toString()}>
                      {contract.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Labour</span>
                <select
                  value={form.labourId}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, labourId: event.target.value }))
                  }
                  className="h-12 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-orange-400"
                  style={{ borderColor: "#D0D5DD" }}
                >
                  <option value="">Choose labour…</option>
                  {labours.map((labour: Labour) => (
                    <option key={labour.id.toString()} value={labour.id.toString()}>
                      {labour.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Amount (₹)</span>
                <input
                  ref={amountRef}
                  type="number"
                  min="1"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, amount: event.target.value }))
                  }
                  placeholder="Enter amount"
                  className="h-12 w-full rounded-xl border bg-white px-3 text-sm font-semibold outline-none focus:border-orange-400"
                  style={{ borderColor: "#D0D5DD" }}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </span>
                <input
                  value={form.note}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, note: event.target.value }))
                  }
                  placeholder="Add a note"
                  className="h-12 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-orange-400"
                  style={{ borderColor: "#D0D5DD" }}
                />
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 border-t px-5 py-4" style={{ borderColor: BORDER }}>
              <button
                type="button"
                onClick={closeForm}
                className="h-12 flex-1 rounded-xl border text-sm font-bold"
                style={{ borderColor: "#D0D5DD" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={addAdvance.isPending || updateAdvance.isPending}
                className="h-12 flex-1 rounded-xl bg-orange-500 text-sm font-extrabold text-white disabled:opacity-50"
                data-ocid="advances.save_button"
              >
                {addAdvance.isPending || updateAdvance.isPending
                  ? "Saving…"
                  : editingAdvance
                    ? "Save changes"
                    : "Add advance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#101828]/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={19} />
            </div>
            <h2 className="mt-4 text-lg font-black">Delete this advance?</h2>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>This action cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="h-11 flex-1 rounded-xl border text-sm font-bold"
                style={{ borderColor: "#D0D5DD" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => remove(confirmDelete)}
                disabled={deleteAdvance.isPending}
                className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-extrabold text-white disabled:opacity-50"
                data-ocid="advances.confirm_delete_button"
              >
                {deleteAdvance.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancesPage;

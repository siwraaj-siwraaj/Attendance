import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown, ChevronRight, CircleDollarSign, Pencil, Plus, Search,
  Trash2, UserRound, Wallet, X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  useAddAdvance, useAdvances, useContracts, useDeleteAdvance,
  useLabours, useUpdateAdvance,
} from "../hooks/useBackend";
import LoadingSpinner from "../components/LoadingSpinner";
import ScrollHeaderTitle from "../components/ScrollHeaderTitle";

const NAVY = "#101828";
const ORANGE = "#F97316";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

type Advance = any;
type Contract = any;
type Labour = any;

function AdvancesPage() {
  const { isAdmin } = useAuth();
  const [rubberBandY, setRubberBandY] = useState(0);
  const rubberStartY = useRef<number | null>(null);

  const handleRubberBandStart = useCallback((event: React.TouchEvent) => {
    rubberStartY.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleRubberBandMove = useCallback((event: React.TouchEvent) => {
    const startY = rubberStartY.current;
    const scrollContainer = document.querySelector(".app-scroll-container") as HTMLElement | null;
    if (startY === null || !scrollContainer || scrollContainer.scrollTop > 1) return;
    const delta = event.touches[0]?.clientY - startY;
    if (delta > 0) setRubberBandY(Math.min(delta * 0.22, 18));
  }, []);

  const handleRubberBandEnd = useCallback(() => {
    rubberStartY.current = null;
    setRubberBandY(0);
  }, []);
  const { data: contracts = [] } = useContracts();
  const { data: labours = [] } = useLabours();
  const { data: advances = [], isLoading } = useAdvances();
  const addAdvance = useAddAdvance();
  const updateAdvance = useUpdateAdvance();
  const deleteAdvance = useDeleteAdvance();

  const [filterContractId, setFilterContractId] = useState("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<bigint | null>(null);
  const [expandedLabourId, setExpandedLabourId] = useState<string | null>(null);
  const [form, setForm] = useState({ contractId: "", labourId: "", amount: "", note: "" });
  const [error, setError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showForm) return;
    const timer = setTimeout(() => amountRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [showForm]);

  const isSettled = useCallback(
    (id: bigint) => {
      const contract = contracts.find((item: Contract) => item.id === id);
      return contract?.settled === true || contract?.settled === 1n;
    },
    [contracts],
  );
  const formContracts = useMemo(() => {
    const activeContracts = contracts.filter((contract: Contract) => !contract.settled && contract.settled !== 1n);
    if (!editingAdvance) return activeContracts;
    const attached = contracts.find((contract: Contract) => contract.id === editingAdvance.contractId);
    return attached && !activeContracts.some((contract: Contract) => contract.id === attached.id)
      ? [...activeContracts, attached]
      : activeContracts;
  }, [contracts, editingAdvance]);

  const labourName = useCallback(
    (id: bigint) => labours.find((labour: Labour) => labour.id === id)?.name || "Unknown labour",
    [labours],
  );
  const contractName = useCallback(
    (id: bigint) => contracts.find((contract: Contract) => contract.id === id)?.name || "Unknown contract",
    [contracts],
  );
  const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const dateLabel = (timestamp: bigint) => {
    try {
      return new Date(Number(timestamp) / 1e6).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return advances.filter((advance: Advance) => {
      const matchesContract = filterContractId === "all" || advance.contractId.toString() === filterContractId;
      const matchesSearch = !search ||
        labourName(advance.labourId).toLowerCase().includes(search) ||
        contractName(advance.contractId).toLowerCase().includes(search) ||
        String(advance.note || "").toLowerCase().includes(search);
      return matchesContract && matchesSearch;
    });
  }, [advances, filterContractId, query, labourName, contractName]);

  const outstandingRows = filtered.filter((advance: Advance) => !isSettled(advance.contractId));
  const outstanding = advances
    .filter((advance: Advance) => !isSettled(advance.contractId))
    .reduce((sum: number, advance: Advance) => sum + Number(advance.amount || 0), 0);
  
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

  const save = useCallback(() => {
    if (!form.contractId || !form.labourId) {
      setError("Select a contract and labour.");
      return;
    }
    if (!form.amount.trim() || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const amount = Number(form.amount);
    const note = form.note.trim();
    const onError = (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Could not save the advance. Please try again.");
    };
    if (editingAdvance) {
      updateAdvance.mutate(
        { id: editingAdvance.id, amount, note },
        { onSuccess: () => setShowForm(false), onError },
      );
    } else {
      addAdvance.mutate(
        { contractId: BigInt(form.contractId), labourId: BigInt(form.labourId), amount, note },
        { onSuccess: () => setShowForm(false), onError },
      );
    }
  }, [form, editingAdvance, updateAdvance, addAdvance]);

  const remove = (id: bigint) => deleteAdvance.mutate(id, {
    onSuccess: () => setConfirmDelete(null),
  });

  const grouped = (items: Advance[]) => {
    const groups = new Map<string, Advance[]>();
    items.forEach((advance) => {
      const key = advance.labourId.toString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(advance);
    });
    return groups;
  };

  const Section = ({ items, empty }: { items: Advance[]; empty: string }) => {
    if (!items.length) {
      return (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-9 text-center" style={{ borderColor: BORDER }}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold" style={{ color: NAVY }}>{empty}</p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>Advances will appear here when they are recorded.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: BORDER }}>
        {Array.from(grouped(items).entries()).map(([id, list], index) => {
          const name = labourName(BigInt(id));
          const total = list.reduce((sum, advance) => sum + Number(advance.amount || 0), 0);
          const expanded = expandedLabourId === id;
          return (
            <article key={id} className={index ? "border-t" : ""} style={{ borderColor: "#EAECF0" }}>
              <button
                type="button"
                onClick={() => setExpandedLabourId(expanded ? null : id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors active:bg-slate-50"
                aria-expanded={expanded}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#172536] text-white">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold" style={{ color: NAVY }}>{name}</span>
                  <span className="mt-1 block text-xs" style={{ color: MUTED }}>
                    {list.length} advance{list.length === 1 ? "" : "s"} · {list.length ? dateLabel(list[0].createdAt) : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-base font-black" style={{ color: ORANGE }}>{money(total)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Total</span>
                </span>
                {expanded ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: MUTED }} /> : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: MUTED }} />}
              </button>
              {expanded && (
                <div className="space-y-2 border-t bg-[#F8FAFC] p-3 sm:p-4" style={{ borderColor: "#EAECF0" }}>
                  {list.map((advance) => (
                    <div key={advance.id.toString()} className="rounded-xl border bg-white p-3 sm:p-4" style={{ borderColor: BORDER }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-black" style={{ color: NAVY }}>{money(advance.amount)}</p>
                          <p className="mt-1 text-xs font-semibold" style={{ color: MUTED }}>{contractName(advance.contractId)}</p>
                          {advance.note && <p className="mt-2 break-words text-sm" style={{ color: "#475467" }}>{advance.note}</p>}
                          <p className="mt-2 text-[11px]" style={{ color: "#98A2B3" }}>{dateLabel(advance.createdAt)}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex shrink-0 gap-1.5">
                            <button type="button" onClick={() => openEdit(advance)} aria-label="Edit advance" className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Pencil className="h-4 w-4" /></button>
                            <button type="button" onClick={() => setConfirmDelete(advance.id)} aria-label="Delete advance" className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 className="h-4 w-4" /></button>
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
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#F8FAFC] pb-32 font-['Figtree',sans-serif] text-[#101828]">
        <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] border-b border-white/10 bg-[#172536] px-4 py-4 text-white shadow-sm sm:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">
                  <Wallet className="h-3.5 w-3.5" /> Payroll
                </div>
                <ScrollHeaderTitle title="Advances" className="text-2xl" />
                <p className="mt-0.5 max-w-xl text-[11px] leading-4 text-white/55">Track outstanding money paid to your team before settlement.</p>
              </div>
              {isAdmin && <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-white/10 sm:w-28" />}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/45">Outstanding</p>
                <div className="mt-1 h-6 w-24 animate-pulse rounded-lg bg-white/10" />
              </div>
              <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </header>
        <main className="px-4 pt-4 sm:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <section className="rounded-2xl border bg-white p-3 shadow-sm" style={{ borderColor: BORDER }}>
              <div className="h-11 animate-pulse rounded-xl bg-[#F2F4F7]" />
              <div className="mt-2 h-11 animate-pulse rounded-xl bg-[#F2F4F7]" />
            </section>
            <section className="mt-5 rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: BORDER }}>
              <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm font-black">Loading advances…</p>
                <p className="mt-1 text-xs" style={{ color: MUTED }}>Fetching outstanding advances.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-full bg-[#F8FAFC] pb-32 font-['Figtree',sans-serif] text-[#182230]"
      onTouchStart={handleRubberBandStart}
      onTouchMove={handleRubberBandMove}
      onTouchEnd={handleRubberBandEnd}
      onTouchCancel={handleRubberBandEnd}
      style={{
        transform: rubberBandY ? `translateY(${rubberBandY}px)` : undefined,
        transition: rubberBandY ? "none" : "transform 180ms cubic-bezier(.22,1,.36,1)",
      }}
    >
      <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] bg-[#172536] px-4 py-4 text-white shadow-sm sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300"><Wallet className="h-3.5 w-3.5" /> Payroll</p>
              <ScrollHeaderTitle title="Advances" className="text-2xl" />
              <p className="mt-0.5 max-w-xl text-[11px] leading-4 text-white/55">Track money paid before settlement and keep deductions visible.</p>
            </div>
            {isAdmin && <button type="button" onClick={openAdd} className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-orange-500 px-3.5 text-[11px] font-extrabold shadow-lg shadow-orange-950/20 active:scale-95" data-ocid="advances.add_button"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add advance</span><span className="sm:hidden">Add</span></button>}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2"><p className="truncate text-[8px] font-extrabold uppercase tracking-wider text-white/40">Outstanding</p><p className="mt-0.5 truncate text-sm font-black text-white">{money(outstanding)}</p></div>
            <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2"><p className="truncate text-[8px] font-extrabold uppercase tracking-wider text-white/40">Records</p><p className="mt-0.5 text-sm font-black text-white">{outstandingRows.length}</p></div>
            <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2"><p className="truncate text-[8px] font-extrabold uppercase tracking-wider text-white/40">Contracts</p><p className="mt-0.5 text-sm font-black text-white">{formContracts.length}</p></div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-2 rounded-2xl border bg-white p-1.5 shadow-sm" style={{ borderColor: BORDER }}>
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search labour, contract or note" className="h-10 w-full rounded-xl bg-[#F8FAFC] px-9 text-xs text-[#101828] outline-none placeholder:text-[#98A2B3]" data-ocid="advances.search_input" /></div>
          <select value={filterContractId} onChange={(event) => setFilterContractId(event.target.value)} className="h-10 max-w-[42%] rounded-xl border bg-white px-2 text-[10px] font-bold text-[#101828] outline-none" style={{ borderColor: BORDER }} data-ocid="advances.contract_filter"><option value="all">All active</option>{contracts.filter((contract: Contract) => !contract.settled && contract.settled !== 1n).map((contract: Contract) => <option key={contract.id.toString()} value={contract.id.toString()}>{contract.name}</option>)}</select>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6">
        <section>
          <div className="mb-3 flex items-center justify-between px-1"><div><h2 className="text-base font-black text-[#101828]">Outstanding advances</h2><p className="mt-0.5 text-xs" style={{ color: MUTED }}>Grouped by labour</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-700">{outstandingRows.length}</span></div>
          <Section items={outstandingRows} empty="No outstanding advances found" />
        </section>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-[#101828]/60 p-0 sm:items-center sm:p-4" onClick={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#EAECF0" }}>
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-500">{editingAdvance ? "Update record" : "New record"}</p><h2 className="mt-1 text-xl font-black">{editingAdvance ? "Edit advance" : "Add advance"}</h2></div>
              <button type="button" onClick={() => setShowForm(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100" aria-label="Close form"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <div><label htmlFor="adv-contract" className="mb-1.5 block text-xs font-bold text-slate-700">Contract</label><select id="adv-contract" value={form.contractId} onChange={(event) => setForm((previous) => ({ ...previous, contractId: event.target.value }))} className="h-12 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-orange-400" style={{ borderColor: "#D0D5DD" }}><option value="">Choose contract…</option>{formContracts.map((contract: Contract) => <option key={contract.id.toString()} value={contract.id.toString()}>{contract.name}</option>)}</select></div>
              <div><label htmlFor="adv-labour" className="mb-1.5 block text-xs font-bold text-slate-700">Labour</label><select id="adv-labour" value={form.labourId} onChange={(event) => setForm((previous) => ({ ...previous, labourId: event.target.value }))} className="h-12 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-orange-400" style={{ borderColor: "#D0D5DD" }}><option value="">Choose labour…</option>{labours.map((labour: Labour) => <option key={labour.id.toString()} value={labour.id.toString()}>{labour.name}</option>)}</select></div>
              <div><label htmlFor="adv-amount" className="mb-1.5 block text-xs font-bold text-slate-700">Amount (₹)</label><input ref={amountRef} id="adv-amount" type="number" min="1" inputMode="decimal" value={form.amount} onChange={(event) => setForm((previous) => ({ ...previous, amount: event.target.value }))} placeholder="Enter amount" className="h-12 w-full rounded-xl border bg-white px-3 text-sm font-semibold outline-none focus:border-orange-400" style={{ borderColor: "#D0D5DD" }} /></div>
              <div><label htmlFor="adv-note" className="mb-1.5 block text-xs font-bold text-slate-700">Note <span className="font-normal text-slate-400">(optional)</span></label><input id="adv-note" value={form.note} onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))} placeholder="Add a note" className="h-12 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-orange-400" style={{ borderColor: "#D0D5DD" }} /></div>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 border-t px-5 py-4" style={{ borderColor: "#EAECF0" }}><button type="button" onClick={() => setShowForm(false)} className="h-12 flex-1 rounded-xl border text-sm font-bold" style={{ borderColor: "#D0D5DD" }}>Cancel</button><button type="button" onClick={save} disabled={addAdvance.isPending || updateAdvance.isPending} className="h-12 flex-1 rounded-xl bg-orange-500 text-sm font-extrabold text-white disabled:opacity-50">{addAdvance.isPending || updateAdvance.isPending ? "Saving…" : editingAdvance ? "Save changes" : "Add advance"}</button></div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#101828]/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Trash2 className="h-5 w-5" /></div>
            <h2 className="mt-4 text-lg font-black">Delete this advance?</h2><p className="mt-1 text-sm" style={{ color: MUTED }}>This action cannot be undone.</p>
            <div className="mt-5 flex gap-3"><button type="button" onClick={() => setConfirmDelete(null)} className="h-11 flex-1 rounded-xl border text-sm font-bold" style={{ borderColor: "#D0D5DD" }}>Cancel</button><button type="button" onClick={() => remove(confirmDelete)} disabled={deleteAdvance.isPending} className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-extrabold text-white disabled:opacity-50" data-ocid="advances.confirm_delete_button">{deleteAdvance.isPending ? "Deleting…" : "Delete"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancesPage;

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Grid2X2,
  List,
  Pencil,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAddContract, useContracts, useUpdateContract } from "../hooks/useBackend";
import { SkeletonCardList } from "../components/SkeletonLoader";
import ScrollHeaderTitle from "../components/ScrollHeaderTitle";

interface ContractFormData {
  name: string;
  multiplier: string;
  contractAmount: string;
  machineExpenses: string;
  bedAmount: string;
  paperAmount: string;
  meshAmount: string;
}

const NAVY = "#101828";
const ORANGE = "#F97316";
const OFF_WHITE = "#F8FAFC";

function ContractsPage({ onViewAttendance }: { onViewAttendance?: (id: bigint) => void }) {
  const { canEdit, isAdmin, username, name } = useAuth();
  const { data: contracts = [], isLoading } = useContracts();
  const addContract = useAddContract();
  const updateContract = useUpdateContract();

  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [contractFilter, setContractFilter] = useState<"active" | "completed">("active");
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const [rubberBandY, setRubberBandY] = useState(0);
  const rubberStartY = useRef<number | null>(null);

  const rubberFrame = useRef<number | null>(null);

  const handleRubberBandStart = useCallback((event: React.TouchEvent) => {
    const scrollContainer = document.querySelector(".app-scroll-container") as HTMLElement | null;
    if (!scrollContainer || scrollContainer.scrollTop > 0) return;
    rubberStartY.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleRubberBandMove = useCallback((event: React.TouchEvent) => {
    const startY = rubberStartY.current;
    const scrollContainer = document.querySelector(".app-scroll-container") as HTMLElement | null;
    if (startY === null || !scrollContainer || scrollContainer.scrollTop > 0) return;

    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined) return;
    const delta = currentY - startY;

    if (delta <= 0) return;
    const eased = Math.min(34, Math.pow(delta, 0.78) * 0.9);

    if (rubberFrame.current !== null) cancelAnimationFrame(rubberFrame.current);
    rubberFrame.current = requestAnimationFrame(() => setRubberBandY(eased));
  }, []);

  const handleRubberBandEnd = useCallback(() => {
    rubberStartY.current = null;
    if (rubberFrame.current !== null) cancelAnimationFrame(rubberFrame.current);
    rubberFrame.current = null;
    setRubberBandY(0);
  }, []);

  const getBedBase = () => Number(localStorage.getItem("rossie_bed_base") || "11000") || 11000;
  const getPaperBase = () => Number(localStorage.getItem("rossie_paper_base") || "7000") || 7000;

  const [form, setForm] = useState<ContractFormData>({
    name: "",
    multiplier: "1",
    contractAmount: "0",
    machineExpenses: "0",
    bedAmount: getBedBase().toString(),
    paperAmount: getPaperBase().toString(),
    meshAmount: "0",
  });

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showSearch) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || searchAreaRef.current?.contains(target) || searchToggleRef.current?.contains(target)) return;
      setShowSearch(false);
    };
    document.addEventListener("pointerdown", handleOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer, true);
  }, [showSearch]);

  useEffect(() => {
    if (!showForm) return;
    const t = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [showForm]);


  const updateMultiplier = (val: string) => {
    const multiplier = Number.parseFloat(val) || 1;
    const bed = getBedBase() * multiplier;
    const paper = getPaperBase() * multiplier;
    const total = Number.parseFloat(form.contractAmount) || 0;
    const machine = Number.parseFloat(form.machineExpenses) || 0;
    setForm((prev) => ({
      ...prev,
      multiplier: val,
      bedAmount: bed.toString(),
      paperAmount: paper.toString(),
      meshAmount: (total - bed - paper - machine).toString(),
    }));
  };

  const closeForm = useCallback(() => setShowForm(false), []);

  const openEdit = useCallback((c: any) => {
    setForm({
      name: c.name,
      multiplier: c.multiplier.toString(),
      contractAmount: c.contractAmount.toString(),
      machineExpenses: c.machineExpenses.toString(),
      bedAmount: c.bedAmount.toString(),
      paperAmount: c.paperAmount.toString(),
      meshAmount: (c.meshAmount ?? 0).toString(),
    });
    setIsEditing(true);
    setSelectedContract(c);
    setShowForm(true);
  }, []);

  const isSaving = addContract.isPending || updateContract.isPending;

  const handleSave = useCallback(() => {
    if (isSaving || !form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      multiplier: Number.parseFloat(form.multiplier),
      contractAmount: Number.parseFloat(form.contractAmount),
      machineExpenses: Number.parseFloat(form.machineExpenses),
      bedAmount: Number.parseFloat(form.bedAmount),
      paperAmount: Number.parseFloat(form.paperAmount),
      meshAmount: Number.parseFloat(form.meshAmount),
    };
    if (isEditing && selectedContract) {
      updateContract.mutate({ id: selectedContract.id, ...payload }, { onSuccess: () => setShowForm(false) });
    } else {
      addContract.mutate(payload, { onSuccess: () => setShowForm(false) });
    }
  }, [addContract, form, isEditing, isSaving, selectedContract, updateContract]);

  const fmt = useCallback(
    (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    [],
  );

  const fmtDate = (d: bigint | number | undefined) => {
    if (d === undefined || d === null) return "—";
    const ms = typeof d === "bigint" ? Number(d) / 1_000_000 : Number(d);
    return !ms || Number.isNaN(ms) ? "—" : format(new Date(ms), "dd MMM yyyy");
  };

  const activeCount = contracts.filter((c: any) => !c.settled).length;
  const completedCount = contracts.filter((c: any) => c.settled).length;

  const filteredContracts = useMemo(
    () =>
      contracts
        .filter((c: any) => (contractFilter === "active" ? !c.settled : c.settled))
        .slice()
        .sort((a: any, b: any) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0))
        .filter((c: any) => !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [contracts, searchQuery, contractFilter],
  );

  const openNew = () => {
    setIsEditing(false);
    setSelectedContract(null);
    setForm({
      name: "",
      multiplier: "1",
      contractAmount: "0",
      machineExpenses: "0",
      bedAmount: getBedBase().toString(),
      paperAmount: getPaperBase().toString(),
      meshAmount: "0",
    });
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="h-full px-4 pt-5" style={{ background: OFF_WHITE }}>
        <SkeletonCardList count={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] pb-32 text-[#182230]">
      <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] bg-[#172536] px-4 py-4 text-white sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">
                <FileText size={14} /> Work management
              </div>
              <ScrollHeaderTitle title="Contracts" className="text-2xl" />
              <p className="mt-0.5 max-w-xl text-[11px] leading-4 text-white/55">
                Manage contracts, rates and work columns.
              </p>
            </div>
            {canEdit && (
              <button type="button" onClick={openNew} className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-orange-500 px-3.5 text-[11px] font-extrabold shadow-lg shadow-orange-950/30 active:scale-95" data-ocid="contract.add_button">
                <Plus size={16} /><span className="hidden sm:inline">New contract</span><span className="sm:hidden">Add</span>
              </button>
            )}
          </div>

          <div className="relative mt-1.5 rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 shadow-inner">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setShowSearch((open) => !open)} className="flex min-w-0 flex-1 items-center gap-3 text-left" data-ocid="contracts.search_toggle">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><Search size={18} /></span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-white/35">Contract view</span>
                  <span className="mt-0.5 block truncate text-sm font-bold">{contractFilter === "active" ? "Ongoing contracts" : "Completed contracts"}</span>
                </span>
                <ChevronDown className={`ml-auto shrink-0 text-white/40 transition ${showSearch ? "rotate-180" : ""}`} size={18} />
              </button>
              <span className="shrink-0 rounded-xl bg-white/10 px-3 py-2.5 text-[11px] font-extrabold text-white/75">{filteredContracts.length} shown</span>
            </div>
          </div>
        </div>
      </header>

      {showSearch && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-3 sm:px-6" data-ocid="contracts.search_area">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
            <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search contracts" className="h-11 w-full rounded-xl bg-[#F8FAFC] px-9 text-xs text-[#101828] outline-none ring-1 ring-[#E4E7EC] focus:ring-orange-300" data-ocid="contracts.search_input" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setContractFilter("active")} className={`h-10 rounded-xl text-xs font-extrabold ${contractFilter === "active" ? "bg-[#172536] text-white" : "border bg-white text-[#667085]"}`} data-ocid="contracts.ongoing_tab">Ongoing · {activeCount}</button>
            <button type="button" onClick={() => setContractFilter("completed")} className={`h-10 rounded-xl text-xs font-extrabold ${contractFilter === "completed" ? "bg-[#172536] text-white" : "border bg-white text-[#667085]"}`} data-ocid="contracts.completed_tab">Completed · {completedCount}</button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6">
        {filteredContracts.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E4E7EC" }}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><FileText size={20} /></div>
            <h2 className="mt-3 text-base font-black text-[#101828]">No {contractFilter} contracts</h2>
            <p className="mt-1 text-xs text-[#667085]">{canEdit && contractFilter === "active" ? "Create a new contract to get started." : "Try another filter or search."}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E4E7EC" }}>
            {filteredContracts.map((c: any, index: number) => {
              const id = c.id.toString();
              const expanded = expandedContractId === id;
              return (
                <article key={id} className={index ? "border-t" : ""} style={{ borderColor: "#EAECF0" }} data-ocid="contract.card">
                  <button type="button" onClick={() => setExpandedContractId(expanded ? null : id)} className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-slate-50">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3EB] text-orange-500"><FileText size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-[#101828]">{c.name}</span>
                      <span className="mt-1 flex items-center gap-2 text-[11px] text-[#667085]"><CalendarDays size={14} />{fmtDate(c.createdAt)}<span>•</span>{c.workColumns?.length ?? 0} work columns</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-base font-black text-orange-500">{fmt(c.contractAmount)}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${c.settled ? "text-emerald-600" : "text-orange-600"}`}>{c.settled ? "Completed" : "Active"}</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#98A2B3] transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="border-t bg-[#F8FAFC] p-3 sm:p-4" style={{ borderColor: "#EAECF0" }}>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[[ "Multiplier", `${c.multiplier}x` ],[ "Bed", fmt(c.bedAmount) ],[ "Paper", fmt(c.paperAmount) ],[ "Mesh", fmt(c.meshAmount ?? 0) ],[ "Machine", fmt(c.machineExpenses) ],[ "Created", fmtDate(c.createdAt) ]].map(([label,value]) => (
                          <div key={label} className="rounded-xl border bg-white p-3" style={{ borderColor: "#EAECF0" }}>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#98A2B3]">{label}</p>
                            <p className="mt-1 truncate text-sm font-bold text-[#101828]">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => onViewAttendance?.(c.id)} className="flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-extrabold text-white" data-ocid="contract.view_attendance_button">View attendance <ArrowRight size={15} /></button>
                        {canEdit && <button type="button" onClick={() => openEdit(c)} className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold text-[#101828]" style={{ borderColor: "#D0D5DD" }} data-ocid="contract.edit_button"><Pencil size={14} />Edit</button>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>


      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#101828]/60 p-0 sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
          onKeyDown={(e) => { if (e.key === "Escape") closeForm(); }}
          role="presentation"
        >
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#EAECF0" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: ORANGE }}>{isEditing ? "Update" : "Create"}</p>
                <h2 className="mt-0.5 text-xl font-extrabold" style={{ color: NAVY }}>{isEditing ? "Edit contract" : "New contract"}</h2>
              </div>
              <button type="button" onClick={closeForm} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#F2F4F7", color: NAVY }} aria-label="Close" data-ocid="contract.close_button"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {[
                { label: "Contract name", key: "name", type: "text", placeholder: "e.g. ABC Production" },
                { label: "Multiplier", key: "multiplier", type: "number", step: "0.1" },
                { label: "Contract amount (₹)", key: "contractAmount", type: "number" },
                { label: "Machine expenses (₹)", key: "machineExpenses", type: "number" },
              ].map(({ label, key, type, step, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`contract-${key}`} className="mb-1.5 block text-xs font-bold" style={{ color: "#344054" }}>{label}</label>
                  <input
                    ref={key === "name" ? nameRef : undefined}
                    id={`contract-${key}`}
                    type={type}
                    step={step}
                    placeholder={placeholder}
                    value={form[key as keyof ContractFormData]}
                    onChange={(e) => {
                      if (key === "multiplier") {
                        updateMultiplier(e.target.value);
                        return;
                      }
                      setForm((prev) => {
                        const next = { ...prev, [key]: e.target.value };
                        if (key === "contractAmount" || key === "machineExpenses") {
                          const total = Number.parseFloat(key === "contractAmount" ? e.target.value : next.contractAmount) || 0;
                          const machine = Number.parseFloat(key === "machineExpenses" ? e.target.value : next.machineExpenses) || 0;
                          const bed = Number.parseFloat(next.bedAmount) || 0;
                          const paper = Number.parseFloat(next.paperAmount) || 0;
                          next.meshAmount = (total - bed - paper - machine).toString();
                        }
                        return next;
                      });
                    }}
                    className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none"
                    style={{ borderColor: "#D0D5DD", color: NAVY }}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {(["bedAmount", "paperAmount"] as const).map((key) => (
                  <div key={key}>
                    <label htmlFor={`contract-${key}`} className="mb-1.5 block text-xs font-bold" style={{ color: "#344054" }}>{key === "bedAmount" ? "Bed amount (₹)" : "Paper amount (₹)"}</label>
                    <input
                      id={`contract-${key}`}
                      type="number"
                      value={form[key]}
                      onChange={(e) => setForm((prev) => {
                        const next = { ...prev, [key]: e.target.value };
                        const total = Number.parseFloat(next.contractAmount) || 0;
                        const bed = Number.parseFloat(next.bedAmount) || 0;
                        const paper = Number.parseFloat(next.paperAmount) || 0;
                        const machine = Number.parseFloat(next.machineExpenses) || 0;
                        next.meshAmount = (total - bed - paper - machine).toString();
                        return next;
                      })}
                      className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none"
                      style={{ borderColor: "#D0D5DD", color: NAVY }}
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-4" style={{ background: "#FFF7F2", border: "1px solid #FED7AA" }}>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" style={{ color: ORANGE }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#9A3412" }}>Mesh allocation</p>
                </div>
                <label htmlFor="contract-meshAmount" className="mt-3 mb-1.5 block text-xs font-bold" style={{ color: "#344054" }}>Mesh amount (₹)</label>
                <input
                  id="contract-meshAmount"
                  type="number"
                  value={form.meshAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, meshAmount: e.target.value }))}
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-bold outline-none"
                  style={{ borderColor: "#FDBA74", color: NAVY }}
                />
              </div>

              {isSaving && <p className="text-xs font-semibold" style={{ color: ORANGE }}>Saving contract…</p>}
            </div>

            <div className="flex gap-3 border-t bg-white px-5 py-4 pb-safe" style={{ borderColor: "#EAECF0" }}>
              <button type="button" onClick={closeForm} className="h-11 flex-1 rounded-xl border text-sm font-bold" style={{ borderColor: "#D0D5DD", color: NAVY }} data-ocid="contract.cancel_button">Cancel</button>
              <button type="button" onClick={handleSave} disabled={isSaving || !form.name.trim()} className="h-11 flex-1 rounded-xl text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: ORANGE }} data-ocid="contract.save_button">
                {isSaving ? "Saving…" : isEditing ? "Save changes" : "Create contract"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ContractsPage);

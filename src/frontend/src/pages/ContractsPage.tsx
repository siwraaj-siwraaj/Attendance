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
  const [contractsScrollTop, setContractsScrollTop] = useState(0);
  const [contractsTitleTop, setContractsTitleTop] = useState<number | null>(null);
  const contractsTitleRef = useRef<HTMLHeadingElement>(null);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
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
    const scrollContainer = document.querySelector(".app-scroll-container");
    if (!scrollContainer) return;

    let frame = 0;
    const onScroll = () => setContractsScrollTop(scrollContainer.scrollTop);

    // Measure the title while it is still in normal document flow.
    // This gives us a stable document position for the same title element.
    const measureInitialPosition = () => {
      const title = contractsTitleRef.current;
      if (!title) {
        frame = requestAnimationFrame(measureInitialPosition);
        return;
      }

      const rect = title.getBoundingClientRect();
      setContractsTitleTop(rect.top + scrollContainer.scrollTop);
      setContractsScrollTop(scrollContainer.scrollTop);
    };

    frame = requestAnimationFrame(measureInitialPosition);
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, []);

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
    <div
      className="flex flex-col font-['Figtree',sans-serif]"
      style={{
        background: OFF_WHITE,
        color: NAVY,
        transform: rubberBandY ? `translateY(${rubberBandY}px)` : undefined,
        transition: rubberBandY ? "none" : "transform 180ms cubic-bezier(.22,1,.36,1)",
      }}
      onTouchStart={handleRubberBandStart}
      onTouchMove={handleRubberBandMove}
      onTouchEnd={handleRubberBandEnd}
      onTouchCancel={handleRubberBandEnd}
    >
      <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] bg-[#172536] px-4 py-4 text-white shadow-sm sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">
                <span className="inline-flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Work management</span>
              </p>
              <ScrollHeaderTitle title="Contracts" className="text-2xl" />
              <p className="mt-0.5 max-w-xl text-[11px] leading-4 text-white/55">
                Manage work agreements, rates, columns and attendance.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {canEdit && (
                <button type="button" onClick={openNew} className="flex h-11 items-center gap-2 rounded-2xl bg-orange-500 px-3.5 text-[11px] font-extrabold text-white shadow-lg shadow-orange-950/20 active:scale-95" data-ocid="contract.add_button">
                  <Plus className="h-4 w-4" /><span className="hidden sm:inline">New contract</span><span className="sm:hidden">Add</span>
                </button>
              )}
              <button
                ref={searchToggleRef}
                type="button"
                onClick={() => setShowSearch((open) => !open)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10"
                aria-label={showSearch ? "Close contract search" : "Search contracts"}
                data-ocid={showSearch ? "contracts.search_back_close" : "contracts.search_toggle"}
              >
                {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => setViewMode(viewMode === "card" ? "list" : "card")} className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 sm:flex" aria-label="Toggle contract view" data-ocid="contracts.view_toggle">
                {viewMode === "card" ? <List className="h-5 w-5" /> : <Grid2X2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Active</span>
              <span className="text-sm font-black">{activeCount}</span>
              <span className="mx-1 h-3 w-px bg-white/10" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Completed</span>
              <span className="text-sm font-black">{completedCount}</span>
            </div>
            <span className="truncate text-[10px] text-white/35">{filteredContracts.length} shown</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-1.5" role="tablist" aria-label="Contract status">
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" role="tab" aria-selected={contractFilter === "active"} onClick={() => setContractFilter("active")} className={`flex min-h-11 items-center justify-between rounded-xl px-4 text-xs font-extrabold transition-all ${contractFilter === "active" ? "bg-white text-[#172536] shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"}`} data-ocid="contracts.ongoing_tab">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Ongoing</span><span className="rounded-lg bg-white/10 px-2 py-1 text-[10px]">{activeCount}</span>
            </button>
            <button type="button" role="tab" aria-selected={contractFilter === "completed"} onClick={() => setContractFilter("completed")} className={`flex min-h-11 items-center justify-between rounded-xl px-4 text-xs font-extrabold transition-all ${contractFilter === "completed" ? "bg-white text-[#172536] shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"}`} data-ocid="contracts.completed_tab">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Completed</span><span className="rounded-lg bg-white/10 px-2 py-1 text-[10px]">{completedCount}</span>
            </button>
          </div>
        </div>
      </header>

      {showSearch && (
        <div ref={searchAreaRef} className="mx-auto w-full max-w-5xl px-4 pt-3 sm:px-6" data-ocid="contracts.search_area">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
            <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search contracts" className="h-12 w-full rounded-2xl border bg-white pl-11 pr-4 text-sm font-medium outline-none" style={{ borderColor: "#E4E7EC", color: NAVY }} data-ocid="contracts.search_input" />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-4 sm:px-6">
        {filteredContracts.length === 0 ? (
          <div className="rounded-3xl border bg-white px-6 py-12 text-center" style={{ borderColor: "#E4E7EC" }}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#FFF3EB", color: ORANGE }}><FileText className="h-6 w-6" /></div>
            <h2 className="mt-4 text-lg font-bold">No {contractFilter} contracts</h2>
            <p className="mt-1 text-sm" style={{ color: "#667085" }}>{canEdit && contractFilter === "active" ? "Create a new contract to get started." : "Try another filter or search."}</p>
          </div>
        ) : viewMode === "card" ? (
          <div className="space-y-3">
            {filteredContracts.map((c: any) => {
              const id = c.id.toString();
              const expanded = expandedContractId === id;
              return (
                <article key={id} className="overflow-hidden rounded-3xl border bg-white shadow-sm" style={{ borderColor: "#E4E7EC" }} data-ocid="contract.card">
                  <button type="button" className="w-full p-4 text-left sm:p-5" onClick={() => setExpandedContractId(expanded ? null : id)} aria-label="Toggle contract details">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3EB] text-orange-500"><FileText className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-[#101828]">{c.name}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[#667085]"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(c.createdAt)}<span>•</span>{c.workColumns?.length ?? 0} work columns</div>
                          </div>
                          <ChevronDown className={`h-5 w-5 shrink-0 text-[#98A2B3] transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">Contract value</p><p className="mt-0.5 text-2xl font-black tracking-tight text-[#101828]">{fmt(c.contractAmount)}</p></div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.settled ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>{c.settled ? "Completed" : "Active"}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t bg-[#FCFCFD] px-4 pb-4 pt-3 sm:px-5" style={{ borderColor: "#EAECF0" }}>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[[ "Multiplier", `${c.multiplier}x` ],[ "Bed", fmt(c.bedAmount) ],[ "Paper", fmt(c.paperAmount) ],[ "Mesh", fmt(c.meshAmount ?? 0) ],[ "Machine", fmt(c.machineExpenses) ],[ "Created", fmtDate(c.createdAt) ]].map(([label,value]) => <div key={label} className="rounded-2xl border bg-white p-3" style={{ borderColor: "#EAECF0" }}><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">{label}</p><p className="mt-1 truncate text-sm font-bold text-[#101828]">{value}</p></div>)}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); onViewAttendance?.(c.id); }} className="flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white" data-ocid="contract.view_attendance_button">View attendance <ArrowRight className="h-4 w-4" /></button>
                        {canEdit && <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-[#101828]" style={{ borderColor: "#D0D5DD" }} data-ocid="contract.edit_button"><Pencil className="h-3.5 w-3.5" />Edit</button>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border bg-white" style={{ borderColor: "#E4E7EC" }}>
            {filteredContracts.map((c: any, idx: number) => {
              const id = c.id.toString();
              const expanded = expandedContractId === id;
              return (
                <div key={id}>
                  <button type="button" onClick={() => setExpandedContractId(expanded ? null : id)} className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 ${idx ? "border-t" : ""}`} style={{ borderColor: "#EAECF0" }} data-ocid={`contract.item.${idx + 1}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EB] text-orange-500"><FileText className="h-4 w-4" /></div>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#101828]">{c.name}</span>
                    <span className="text-sm font-extrabold text-orange-500">{fmt(c.contractAmount)}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#98A2B3] transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && <div className="border-t bg-[#FCFCFD] px-4 pb-4 pt-3" style={{ borderColor: "#EAECF0" }}>
                    <div className="grid grid-cols-2 gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">Multiplier</p><p className="text-sm font-bold">{c.multiplier}x</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">Created</p><p className="text-sm font-bold">{fmtDate(c.createdAt)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">Bed</p><p className="text-sm font-bold">{fmt(c.bedAmount)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">Paper</p><p className="text-sm font-bold">{fmt(c.paperAmount)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">Mesh</p><p className="text-sm font-bold">{fmt(c.meshAmount ?? 0)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">Machine</p><p className="text-sm font-bold">{fmt(c.machineExpenses)}</p></div></div>
                    <div className="mt-3 flex gap-2"><button type="button" onClick={() => onViewAttendance?.(c.id)} className="flex h-9 items-center gap-1 rounded-xl bg-orange-500 px-3 text-xs font-bold text-white" data-ocid="contract.view_attendance_button">View attendance <ArrowRight className="h-3.5 w-3.5" /></button>{canEdit && <button type="button" onClick={() => openEdit(c)} className="flex h-9 items-center gap-1 rounded-xl border bg-white px-3 text-xs font-bold" style={{ borderColor: "#D0D5DD" }} data-ocid="contract.edit_button"><Pencil className="h-3.5 w-3.5" />Edit</button>}</div>
                  </div>}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isAdmin && (
        <button type="button" onClick={openNew} className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_10px_25px_rgba(249,115,22,0.3)] sm:hidden" style={{ background: ORANGE }} aria-label="Add Contract" data-ocid="contract.add_button">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

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

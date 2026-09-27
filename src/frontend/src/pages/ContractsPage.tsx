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
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [contractFilter, setContractFilter] = useState<"active" | "completed">("active");
  const [contractsScrollTop, setContractsScrollTop] = useState(0);
  const [contractsTitleTop, setContractsTitleTop] = useState<number | null>(null);
  const contractsTitleRef = useRef<HTMLHeadingElement>(null);

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
    <div className="flex flex-col font-['Figtree',sans-serif]" style={{ background: OFF_WHITE, color: NAVY }}>
      <header className="shrink-0 bg-[#172536] px-5 pb-5 pt-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#667085" }}>
              {name?.trim() || username?.trim() || "Welcome back"}
            </p>
            <div className="mt-1 h-9" aria-hidden="true" />
            <h1
              ref={contractsTitleRef}
              className="z-40 font-black tracking-tight text-white transition-[top,left,width,height,font-size,padding,background-color,box-shadow] duration-150 ease-out"
              style={{
                position: contractsTitleTop === null ? "relative" : "fixed",
                top: `${Math.max(0, (contractsTitleTop ?? 0) - contractsScrollTop)}px`,
                left: contractsScrollTop > 24 ? 0 : 20,
                width: contractsScrollTop > 24 ? "100%" : "auto",
                height: contractsScrollTop > 24 ? 56 : "auto",
                paddingLeft: contractsScrollTop > 24 ? 20 : 0,
                paddingRight: contractsScrollTop > 24 ? 20 : 0,
                display: "flex",
                alignItems: "center",
                background: contractsScrollTop > 24 ? "#172536" : "transparent",
                boxShadow: contractsScrollTop > 24 ? "0 6px 18px rgba(8,17,31,0.18)" : "none",
                fontSize: `${Math.max(18, 30 - Math.min(contractsScrollTop, 120) * 0.1)}px`,
                lineHeight: 1.2,
              }}
            >
              Contracts
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#667085" }}>
              Manage your work agreements and attendance.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={openNew}
              className="flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.25)] transition-transform active:scale-95"
              style={{ background: ORANGE }}
              data-ocid="contract.add_button"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">New contract</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setContractFilter("active")}
            className="rounded-2xl border p-4 text-left transition-all"
            style={{
              background: contractFilter === "active" ? NAVY : "#fff",
              color: contractFilter === "active" ? "#fff" : NAVY,
              borderColor: contractFilter === "active" ? NAVY : "#E4E7EC",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Active</span>
              <span className="h-2 w-2 rounded-full" style={{ background: ORANGE }} />
            </div>
            <div className="mt-1 text-2xl font-extrabold">{activeCount}</div>
          </button>
          <button
            type="button"
            onClick={() => setContractFilter("completed")}
            className="rounded-2xl border p-4 text-left transition-all"
            style={{
              background: contractFilter === "completed" ? NAVY : "#fff",
              color: contractFilter === "completed" ? "#fff" : NAVY,
              borderColor: contractFilter === "completed" ? NAVY : "#E4E7EC",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Completed</span>
              <CheckCircle2 className="h-4 w-4" style={{ color: contractFilter === "completed" ? "#FDBA74" : "#98A2B3" }} />
            </div>
            <div className="mt-1 text-2xl font-extrabold">{completedCount}</div>
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#98A2B3" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts"
              className="h-12 w-full rounded-2xl border bg-white pl-11 pr-4 text-sm font-medium outline-none transition focus:ring-2"
              style={{ borderColor: "#E4E7EC", color: NAVY, boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
              data-ocid="contracts.search_input"
            />
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "card" ? "list" : "card")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white"
            style={{ borderColor: "#E4E7EC", color: NAVY }}
            aria-label={viewMode === "card" ? "Switch to list view" : "Switch to card view"}
            data-ocid="contracts.view_toggle"
          >
            {viewMode === "card" ? <List className="h-5 w-5" /> : <Grid2X2 className="h-5 w-5" />}
          </button>
        </div>
      </header>


      <main className="px-5 pb-28">
        {filteredContracts.length === 0 ? (
          <div className="rounded-3xl border bg-white px-6 py-12 text-center" style={{ borderColor: "#E4E7EC" }}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#FFF3EB", color: ORANGE }}>
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold">No {contractFilter} contracts</h2>
            <p className="mt-1 text-sm" style={{ color: "#667085" }}>
              {canEdit && contractFilter === "active" ? "Create a new contract to get started." : "Try another filter or search."}
            </p>
          </div>
        ) : viewMode === "card" ? (
          <div className="space-y-3">
            {filteredContracts.map((c: any) => {
              const id = c.id.toString();
              const expanded = expandedContractId === id;
              return (
                <article key={id} className="overflow-hidden rounded-3xl border bg-white shadow-[0_2px_8px_rgba(16,24,40,0.05)]" style={{ borderColor: "#E4E7EC" }} data-ocid="contract.card">
                  <button
                    type="button"
                    className="w-full p-5 text-left"
                    onClick={() => setExpandedContractId(expanded ? null : id)}
                    aria-label="Toggle contract details"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#FFF3EB", color: ORANGE }}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold" style={{ color: NAVY }}>{c.name}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: "#667085" }}>
                              <CalendarDays className="h-3.5 w-3.5" />
                              {fmtDate(c.createdAt)}
                              <span>•</span>
                              {c.workColumns?.length ?? 0} work columns
                            </div>
                          </div>
                          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} style={{ color: "#98A2B3" }} />
                        </div>
                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>Contract value</p>
                            <p className="mt-0.5 text-2xl font-extrabold tracking-tight" style={{ color: NAVY }}>{fmt(c.contractAmount)}</p>
                          </div>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{
                              background: c.settled ? "#ECFDF3" : "#FFF3EB",
                              color: c.settled ? "#027A48" : "#C2410C",
                            }}
                          >
                            {c.settled ? "Completed" : "Active"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: "#EAECF0", background: "#FCFCFD" }}>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          ["Multiplier", `${c.multiplier}x`],
                          ["Bed", fmt(c.bedAmount)],
                          ["Paper", fmt(c.paperAmount)],
                          ["Mesh", fmt(c.meshAmount ?? 0)],
                          ["Machine", fmt(c.machineExpenses)],
                          ["Created", fmtDate(c.createdAt)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl border bg-white p-3" style={{ borderColor: "#EAECF0" }}>
                            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>{label}</p>
                            <p className="mt-1 truncate text-sm font-bold" style={{ color: NAVY }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onViewAttendance?.(c.id); }}
                          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white"
                          style={{ background: ORANGE }}
                          data-ocid="contract.view_attendance_button"
                        >
                          View attendance <ArrowRight className="h-4 w-4" />
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                            className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold"
                            style={{ borderColor: "#D0D5DD", color: NAVY }}
                            data-ocid="contract.edit_button"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
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
                  <button
                    type="button"
                    onClick={() => setExpandedContractId(expanded ? null : id)}
                    className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 ${idx ? "border-t" : ""}`}
                    style={{ borderColor: "#EAECF0" }}
                    data-ocid={`contract.item.${idx + 1}`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FFF3EB", color: ORANGE }}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{c.name}</span>
                    <span className="text-sm font-extrabold" style={{ color: ORANGE }}>{fmt(c.contractAmount)}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} style={{ color: "#98A2B3" }} />
                  </button>
                  {expanded && (
                    <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "#EAECF0", background: "#FCFCFD" }}>
                      <div className="grid grid-cols-2 gap-2">
                        <div><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>Multiplier</p><p className="text-sm font-bold">{c.multiplier}x</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>Created</p><p className="text-sm font-bold">{fmtDate(c.createdAt)}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>Bed</p><p className="text-sm font-bold">{fmt(c.bedAmount)}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>Paper</p><p className="text-sm font-bold">{fmt(c.paperAmount)}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>Mesh</p><p className="text-sm font-bold">{fmt(c.meshAmount ?? 0)}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#98A2B3" }}>Machine</p><p className="text-sm font-bold">{fmt(c.machineExpenses)}</p></div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={() => onViewAttendance?.(c.id)} className="flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-bold text-white" style={{ background: ORANGE }} data-ocid="contract.view_attendance_button">View attendance <ArrowRight className="h-3.5 w-3.5" /></button>
                        {canEdit && <button type="button" onClick={() => openEdit(c)} className="flex h-9 items-center gap-1 rounded-xl border bg-white px-3 text-xs font-bold" style={{ borderColor: "#D0D5DD" }} data-ocid="contract.edit_button"><Pencil className="h-3.5 w-3.5" /> Edit</button>}
                      </div>
                    </div>
                  )}
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

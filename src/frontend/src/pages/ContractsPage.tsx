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

    return (
    <div className="min-h-full bg-[#F8FAFC] text-[#182230]">
      <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] bg-[#172536] px-4 py-4 text-white shadow-sm sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">Rossie · Work</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Contracts</h1>
              <p className="mt-0.5 text-[11px] leading-4 text-white/55">Manage work agreements and attendance.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setShowSearch((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white" aria-label="Search contracts" data-ocid="contracts.search_toggle">
                {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => setViewMode(viewMode === "card" ? "list" : "card")} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white" aria-label="Toggle contract view" data-ocid="contracts.view_toggle">
                {viewMode === "card" ? <List className="h-5 w-5" /> : <Grid2X2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => setContractFilter("active")} className={`flex h-11 items-center justify-between rounded-xl px-3 text-xs font-extrabold ${contractFilter === "active" ? "bg-white text-[#172536]" : "text-white/60"}`} data-ocid="contracts.ongoing_tab">
                <span>Ongoing</span><span className="rounded-lg bg-white/10 px-2 py-1">{activeCount}</span>
              </button>
              <button type="button" onClick={() => setContractFilter("completed")} className={`flex h-11 items-center justify-between rounded-xl px-3 text-xs font-extrabold ${contractFilter === "completed" ? "bg-white text-[#172536]" : "text-white/60"}`} data-ocid="contracts.completed_tab">
                <span>Completed</span><span className="rounded-lg bg-white/10 px-2 py-1">{completedCount}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {showSearch && <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search contracts" className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white pl-10 pr-3 text-sm outline-none focus:border-orange-400" data-ocid="contracts.search_input"/></div></div>}
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-4 sm:px-6">
        {filteredContracts.length === 0 ? (
          <div className="rounded-2xl border border-[#E4E7EC] bg-white p-8 text-center"><FileText className="mx-auto h-8 w-8 text-orange-400"/><h2 className="mt-3 text-base font-black">No {contractFilter} contracts</h2><p className="mt-1 text-xs text-slate-500">{canEdit && contractFilter === "active" ? "Create a new contract to get started." : "Try another filter or search."}</p></div>
        ) : viewMode === "card" ? (
          <div className="space-y-3">{filteredContracts.map((c:any)=>{
            const id=c.id.toString(); const expanded=expandedContractId===id;
            return <article key={id} className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-sm" data-ocid="contract.card">
              <button type="button" onClick={()=>setExpandedContractId(expanded?null:id)} className="w-full p-4 text-left">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><FileText className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-black">{c.name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.settled?"bg-emerald-50 text-emerald-700":"bg-orange-50 text-orange-700"}`}>{c.settled?"Completed":"Active"}</span></div><p className="mt-1 text-[11px] text-slate-500">{fmtDate(c.createdAt)} · {c.workColumns?.length ?? 0} work columns</p><p className="mt-2 text-xl font-black text-[#172536]">{fmt(c.contractAmount)}</p></div><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded?"rotate-180":""}`}/></div>
              </button>
              {expanded && <div className="border-t border-[#EAECF0] bg-[#FCFCFD] p-4"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[["Multiplier",c.multiplier+"x"],["Bed",fmt(c.bedAmount)],["Paper",fmt(c.paperAmount)],["Mesh",fmt(c.meshAmount??0)],["Machine",fmt(c.machineExpenses)],["Created",fmtDate(c.createdAt)]].map(([label,value])=><div key={label} className="rounded-xl border border-[#EAECF0] bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-bold">{value}</p></div>)}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>onViewAttendance?.(c.id)} className="flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-3 text-xs font-bold text-white" data-ocid="contract.view_attendance_button">View attendance <ArrowRight className="h-3.5 w-3.5"/></button>{canEdit&&<button type="button" onClick={()=>openEdit(c)} className="flex h-10 items-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-3 text-xs font-bold" data-ocid="contract.edit_button"><Pencil className="h-3.5 w-3.5"/> Edit</button>}</div></div>}
            </article>;
          })}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">{filteredContracts.map((c:any,idx:number)=>{const id=c.id.toString();const expanded=expandedContractId===id;return <div key={id}><button type="button" onClick={()=>setExpandedContractId(expanded?null:id)} className={`flex w-full items-center gap-3 p-4 text-left ${idx?"border-t border-[#EAECF0]":""}`}><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><FileText className="h-4 w-4"/></div><span className="min-w-0 flex-1 truncate text-sm font-bold">{c.name}</span><span className="text-sm font-black text-orange-500">{fmt(c.contractAmount)}</span><ChevronDown className={`h-4 w-4 text-slate-400 ${expanded?"rotate-180":""}`}/></button>{expanded&&<div className="border-t border-[#EAECF0] bg-[#FCFCFD] p-4"><div className="grid grid-cols-2 gap-2 text-xs"><span>Multiplier: <b>{c.multiplier}x</b></span><span>Bed: <b>{fmt(c.bedAmount)}</b></span><span>Paper: <b>{fmt(c.paperAmount)}</b></span><span>Mesh: <b>{fmt(c.meshAmount??0)}</b></span></div></div>}</div>})}</div>
        )}
      </main>
      {isAdmin&&<button type="button" onClick={openNew} className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg" aria-label="Add contract" data-ocid="contract.add_button"><Plus className="h-6 w-6"/></button>}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101828]/60 sm:items-center sm:p-4" onClick={e=>{if(e.target===e.currentTarget)closeForm();}}>
          <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <div className="flex items-center justify-between border-b border-[#EAECF0] px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500">{isEditing?"Update":"Create"}</p><h2 className="text-xl font-black">{isEditing?"Edit contract":"New contract"}</h2></div><button type="button" onClick={closeForm} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100"><X className="h-4 w-4"/></button></div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {[["name","Contract name","text"],["multiplier","Multiplier","number"],["contractAmount","Contract amount (₹)","number"],["machineExpenses","Machine expenses (₹)","number"]].map(([key,label,type])=><div key={key}><label className="mb-1.5 block text-xs font-bold text-slate-700">{label}</label><input type={type} value={form[key as keyof ContractFormData]} onChange={e=>{if(key==="multiplier"){updateMultiplier(e.target.value);return;}setForm(prev=>({...prev,[key]:e.target.value}));}} className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm outline-none"/></div>)}
              <div className="grid grid-cols-2 gap-3">{(["bedAmount","paperAmount"] as const).map(key=><div key={key}><label className="mb-1.5 block text-xs font-bold text-slate-700">{key==="bedAmount"?"Bed amount (₹)":"Paper amount (₹)"}</label><input type="number" value={form[key]} onChange={e=>setForm(prev=>({...prev,[key]:e.target.value}))} className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm outline-none"/></div>)}</div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3"><label className="mb-1.5 block text-xs font-bold text-orange-900">Mesh amount (₹)</label><input type="number" value={form.meshAmount} onChange={e=>setForm(prev=>({...prev,meshAmount:e.target.value}))} className="h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm outline-none"/></div>
            </div>
            <div className="flex gap-3 border-t border-[#EAECF0] p-4"><button type="button" onClick={closeForm} className="h-11 flex-1 rounded-xl border border-[#D0D5DD] text-sm font-bold">Cancel</button><button type="button" onClick={handleSave} disabled={isSaving||!form.name.trim()} className="h-11 flex-1 rounded-xl bg-orange-500 text-sm font-bold text-white disabled:opacity-50">{isSaving?"Saving…":isEditing?"Save changes":"Create contract"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ContractsPage);

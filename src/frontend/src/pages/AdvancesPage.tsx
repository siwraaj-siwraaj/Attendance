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
    return (
    <div className="min-h-full bg-[#F8FAFC] text-[#182230]">
      <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] bg-[#172536] px-4 py-4 text-white shadow-sm sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">Rossie · Payroll</p><h1 className="mt-1 text-2xl font-black">Advances</h1><p className="mt-0.5 text-[11px] leading-4 text-white/55">Track money paid before final settlement.</p></div>{isAdmin&&<button type="button" onClick={openAdd} className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-3 text-xs font-extrabold text-white" data-ocid="advances.add_button"><Plus className="h-4 w-4"/><span>Add</span></button>}</div>
          <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Outstanding</p><p className="mt-1 text-2xl font-black">{money(outstanding)}</p></div><p className="text-[10px] text-white/40">{outstandingRows.length} groups</p></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-4 sm:px-6">
        <section className="rounded-2xl border border-[#E4E7EC] bg-white p-3 shadow-sm"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search labour, contract or note" className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] pl-10 pr-3 text-sm outline-none focus:border-orange-400" data-ocid="advances.search_input"/></div><select value={filterContractId} onChange={e=>setFilterContractId(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-semibold outline-none focus:border-orange-400" data-ocid="advances.contract_filter"><option value="all">All active contracts</option>{contracts.filter((contract: Contract)=>!contract.settled&&contract.settled!==1n).map((contract: Contract)=><option key={contract.id.toString()} value={contract.id.toString()}>{contract.name}</option>)}</select></section>
        <section className="mt-4"><div className="mb-2 flex items-center justify-between px-1"><div><h2 className="text-base font-black">Outstanding advances</h2><p className="text-[11px] text-slate-500">Grouped by labour</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-700">{outstandingRows.length}</span></div><Section items={outstandingRows} empty="No outstanding advances found"/></section>
      </main>
      {showForm&&<div className="fixed inset-0 z-[1000] flex items-end justify-center bg-[#101828]/60 sm:items-center sm:p-4" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}><div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"><div className="flex items-center justify-between border-b border-[#EAECF0] px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500">{editingAdvance?"Update":"New record"}</p><h2 className="text-xl font-black">{editingAdvance?"Edit advance":"Add advance"}</h2></div><button type="button" onClick={()=>setShowForm(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100"><X className="h-4 w-4"/></button></div><div className="flex-1 space-y-4 overflow-y-auto p-5"><div><label className="mb-1.5 block text-xs font-bold">Contract</label><select value={form.contractId} onChange={e=>setForm(p=>({...p,contractId:e.target.value}))} className="h-11 w-full rounded-xl border border-[#D0D5DD] px-3 text-sm"><option value="">Choose contract…</option>{formContracts.map((contract:Contract)=><option key={contract.id.toString()} value={contract.id.toString()}>{contract.name}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold">Labour</label><select value={form.labourId} onChange={e=>setForm(p=>({...p,labourId:e.target.value}))} className="h-11 w-full rounded-xl border border-[#D0D5DD] px-3 text-sm"><option value="">Choose labour…</option>{labours.map((labour:Labour)=><option key={labour.id.toString()} value={labour.id.toString()}>{labour.name}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold">Amount (₹)</label><input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} className="h-11 w-full rounded-xl border border-[#D0D5DD] px-3 text-sm"/></div><div><label className="mb-1.5 block text-xs font-bold">Note</label><input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} className="h-11 w-full rounded-xl border border-[#D0D5DD] px-3 text-sm"/></div>{error&&<p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</p>}</div><div className="flex gap-3 border-t border-[#EAECF0] p-4"><button type="button" onClick={()=>setShowForm(false)} className="h-11 flex-1 rounded-xl border border-[#D0D5DD] text-sm font-bold">Cancel</button><button type="button" onClick={save} disabled={addAdvance.isPending||updateAdvance.isPending} className="h-11 flex-1 rounded-xl bg-orange-500 text-sm font-bold text-white disabled:opacity-50">{addAdvance.isPending||updateAdvance.isPending?"Saving…":editingAdvance?"Save changes":"Add advance"}</button></div></div></div>}
      {confirmDelete!==null&&<div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#101828]/60 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 className="h-5 w-5"/></div><h2 className="mt-3 text-base font-black">Delete this advance?</h2><p className="mt-1 text-xs text-slate-500">This action cannot be undone.</p><div className="mt-5 flex gap-3"><button type="button" onClick={()=>setConfirmDelete(null)} className="h-11 flex-1 rounded-xl border border-[#D0D5DD] text-sm font-bold">Cancel</button><button type="button" onClick={()=>remove(confirmDelete)} disabled={deleteAdvance.isPending} className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white">{deleteAdvance.isPending?"Deleting…":"Delete"}</button></div></div></div>}
    </div>
  );
}

export default AdvancesPage;

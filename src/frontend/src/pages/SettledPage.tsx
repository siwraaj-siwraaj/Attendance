import React, { useCallback, useMemo, useState } from "react";
import { Archive, CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, Clock3, Search, Trash2, Users, X } from "lucide-react";
import { useAdvances, useAllAttendance, useContracts, useDeleteContract, useLabours, useMarkContractSettled } from "../hooks/useBackend";
import { useAdminGuard } from "../hooks/useAdminGuard";
import LoadingSpinner from "../components/LoadingSpinner";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const date = (ts: bigint | number | undefined) => {
  if (!ts) return "—";
  const ms = Number(ts) / 1_000_000;
  return ms ? new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
};

function SettledPage() {
  const { data: contracts = [], isLoading } = useContracts();
  const { data: labours = [] } = useLabours();
  const { data: attendance = [] } = useAllAttendance();
  const { data: advances = [] } = useAdvances();
  const settle = useMarkContractSettled();
  const remove = useDeleteContract();
  const { guardAction } = useAdminGuard();
  const [tab, setTab] = useState<"pending" | "settled">("settled");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<bigint | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<bigint | null>(null);
  const [processing, setProcessing] = useState<bigint | null>(null);

  const pending = useMemo(() => contracts.filter((c: any) => !c.settled), [contracts]);
  const settled = useMemo(() => contracts.filter((c: any) => c.settled), [contracts]);
  const visible = useMemo(() => (tab === "settled" ? settled : pending).filter((c: any) => String(c.name ?? "").toLowerCase().includes(query.trim().toLowerCase())), [tab, settled, pending, query]);
  const selectedTotal = useMemo(() => pending.filter((c: any) => selected.has(String(c.id))).reduce((s: number, c: any) => s + Number(c.contractAmount || 0), 0), [pending, selected]);

  const toggle = useCallback((id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const settleSelected = useCallback(() => guardAction(() => {
    if (!selected.size) return;
    [...selected].forEach(id => { const bid = BigInt(id); setProcessing(bid); settle.mutate({ id: bid, settled: true }, { onSettled: () => setProcessing(null) }); });
    setSelected(new Set());
  }), [guardAction, selected, settle]);
  const toggleSettled = useCallback((c: any) => guardAction(() => { setProcessing(c.id); settle.mutate({ id: c.id, settled: !c.settled }, { onSettled: () => setProcessing(null) }); }), [guardAction, settle]);
  const deleteContract = useCallback((id: bigint) => guardAction(() => { setProcessing(id); remove.mutate(id, { onSuccess: () => setConfirmDelete(null), onSettled: () => setProcessing(null) }); }), [guardAction, remove]);

  if (isLoading) return <div className="flex h-full items-center justify-center"><LoadingSpinner size="lg"/></div>;

  return <div className="h-full overflow-hidden bg-[#080d1b] text-white font-['Figtree',sans-serif]">
    <div className="h-full overflow-y-auto px-4 pt-4 pb-28">
      {/* Dashboard hero */}
      <section className="relative overflow-hidden rounded-[26px] border border-orange-400/15 bg-gradient-to-br from-[#172039] via-[#111a2d] to-[#0d1323] p-5 shadow-xl">
        <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl"/>
        <div className="relative flex items-start justify-between"><div><div className="flex items-center gap-2 text-orange-400"><Archive className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-[0.2em]">Settlement Center</span></div><h1 className="mt-2 text-2xl font-bold">Settled</h1><p className="mt-1 text-xs text-white/40">Track completed and pending contracts</p></div><div className="rounded-2xl bg-orange-500/15 p-3 text-orange-400"><CircleDollarSign className="h-6 w-6"/></div></div>
        <div className="relative mt-5 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-white/[0.055] p-3"><p className="text-[10px] uppercase tracking-wider text-white/35">Total</p><p className="mt-1 text-xl font-bold">{contracts.length}</p></div><div className="rounded-2xl bg-amber-500/10 p-3"><p className="text-[10px] uppercase tracking-wider text-amber-300/60">Pending</p><p className="mt-1 text-xl font-bold text-amber-300">{pending.length}</p></div><div className="rounded-2xl bg-emerald-500/10 p-3"><p className="text-[10px] uppercase tracking-wider text-emerald-300/60">Settled</p><p className="mt-1 text-xl font-bold text-emerald-300">{settled.length}</p></div></div>
      </section>

      {/* Segmented control + search */}
      <div className="sticky top-0 z-20 -mx-1 mt-4 bg-[#080d1b]/95 py-1 backdrop-blur-md">
        <div className="flex rounded-2xl border border-white/10 bg-[#11192b] p-1"><button type="button" onClick={()=>setTab("settled")} className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${tab==="settled"?'bg-emerald-500/15 text-emerald-300':'text-white/40'}`}>Settled <span className="ml-1 opacity-70">{settled.length}</span></button><button type="button" onClick={()=>setTab("pending")} className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${tab==="pending"?'bg-orange-500/15 text-orange-300':'text-white/40'}`}>Needs settlement <span className="ml-1 opacity-70">{pending.length}</span></button></div>
        <div className="relative mt-2"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search contracts" className="w-full rounded-2xl border border-white/10 bg-[#11192b] py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-500/50"/></div>
      </div>

      {tab === "pending" && pending.length > 0 && <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/[0.05] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-orange-300">Ready to settle</p><p className="mt-0.5 text-[11px] text-white/35">{selected.size} selected · {money(selectedTotal)}</p></div><button type="button" onClick={settleSelected} disabled={!selected.size || processing!==null} className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold disabled:opacity-30">Settle selected</button></div></div>}

      <div className="mt-4 space-y-3">
        {visible.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-10 text-center"><Archive className="mx-auto h-9 w-9 text-white/15"/><p className="mt-3 text-sm font-semibold text-white/50">{tab==='settled'?'No settled contracts':'No pending contracts'}</p><p className="mt-1 text-xs text-white/25">{query?'Try a different search':'Your settlement records will appear here'}</p></div> : visible.map((c: any, i: number) => {
          const id = String(c.id); const open = expanded === c.id; const checked = selected.has(id);
          const records = attendance.filter((r:any)=>r.contractId===c.id); const present = records.filter((r:any)=>r.value?.__kind__==='present'||r.value?.__kind__==='partial').length; const advanceTotal = advances.filter((a:any)=>a.contractId===c.id).reduce((s:number,a:any)=>s+Number(a.amount||0),0); const workerCount = new Set(records.map((r:any)=>String(r.labourId))).size;
          return <article key={id} className={`overflow-hidden rounded-[22px] border bg-[#10182a] transition ${checked?'border-orange-500/50':'border-white/[0.07]'}`} data-ocid={`settled.item.${i+1}`}>
            <div className="flex items-center gap-3 p-4">
              {tab==='pending' && <button type="button" onClick={()=>toggle(id)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${checked?'border-orange-500 bg-orange-500':'border-white/20 bg-white/[0.03]'}`}>{checked && <CheckCircle2 className="h-4 w-4"/>}</button>}
              <button type="button" onClick={()=>setExpanded(open?null:c.id)} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><p className="truncate text-base font-bold">{c.name}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${c.settled?'bg-emerald-500/10 text-emerald-300':'bg-amber-500/10 text-amber-300'}`}>{c.settled?'Settled':'Pending'}</span></div><div className="mt-1 flex items-center gap-3 text-[10px] text-white/30"><span>{date(c.createdAt)}</span><span>•</span><span>{workerCount} workers</span></div></button>
              <div className="text-right"><p className="text-base font-bold text-orange-400">{money(c.contractAmount)}</p><div className="mt-1 flex justify-end text-white/25">{open?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}</div></div>
            </div>
            {open && <div className="border-t border-white/[0.07] px-4 pb-4 pt-3">
              <div className="grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white/[0.035] p-3"><p className="text-[10px] text-white/30">Contract</p><p className="mt-1 text-sm font-bold">{money(c.contractAmount)}</p></div><div className="rounded-2xl bg-white/[0.035] p-3"><p className="text-[10px] text-white/30">Multiplier</p><p className="mt-1 text-sm font-bold">{c.multiplier}×</p></div><div className="rounded-2xl bg-white/[0.035] p-3"><p className="text-[10px] text-white/30">Attendance</p><p className="mt-1 text-sm font-bold">{present} records</p></div><div className="rounded-2xl bg-white/[0.035] p-3"><p className="text-[10px] text-white/30">Advances</p><p className="mt-1 text-sm font-bold text-red-300">{money(advanceTotal)}</p></div></div>
              <div className="mt-3 rounded-2xl bg-white/[0.035] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-white/55"><Clock3 className="h-4 w-4 text-orange-400"/>Timeline</div><div className="mt-2 flex justify-between text-[11px]"><span className="text-white/30">Created</span><span>{date(c.createdAt)}</span></div><div className="mt-1 flex justify-between text-[11px]"><span className="text-white/30">Settled</span><span className={c.settled?'text-emerald-300':'text-amber-300'}>{c.settled?date(c.settledAt||c.updatedAt||c.createdAt):'Not settled'}</span></div></div>
              <div className="mt-3 flex gap-2">{tab==='pending'?<button type="button" onClick={()=>toggleSettled(c)} disabled={processing!==null} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white disabled:opacity-40">Mark settled</button>:<button type="button" onClick={()=>toggleSettled(c)} disabled={processing!==null} className="flex-1 rounded-xl bg-amber-500/10 py-2.5 text-xs font-bold text-amber-300">Reopen</button>}<button type="button" onClick={()=>setConfirmDelete(c.id)} className="rounded-xl border border-red-500/15 bg-red-500/5 px-3 text-red-300"><Trash2 className="h-4 w-4"/></button></div>
            </div>}
          </article>;
        })}
      </div>
    </div>

    {confirmDelete !== null && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#111a2c] p-5"><div className="flex items-center justify-between"><div className="rounded-2xl bg-red-500/10 p-3 text-red-300"><Trash2 className="h-5 w-5"/></div><button type="button" onClick={()=>setConfirmDelete(null)} className="rounded-xl bg-white/5 p-2 text-white/40"><X className="h-5 w-5"/></button></div><h2 className="mt-4 text-lg font-bold">Delete contract?</h2><p className="mt-1 text-xs leading-5 text-white/40">This removes the contract and its stored record. This action cannot be undone.</p><div className="mt-5 flex gap-2"><button type="button" onClick={()=>setConfirmDelete(null)} className="flex-1 rounded-xl bg-white/5 py-3 text-xs font-semibold">Cancel</button><button type="button" onClick={()=>deleteContract(confirmDelete)} className="flex-1 rounded-xl bg-red-500 py-3 text-xs font-bold">Delete</button></div></div></div>}
  </div>;
}
export default SettledPage;

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
      return (
    <section className="rossie-page rossie-reference-page">
      <header className="rossie-page-header">
        <div><p className="rossie-eyebrow">Workforce finance</p><h1 className="rossie-display">Advances</h1><p className="rossie-muted">Track worker advances and outstanding balances</p></div>
        {isAdmin && <button type="button" onClick={openAdd} className="rossie-icon-button" aria-label="Add advance"><Plus size={18}/></button>}
      </header>

      <section className="rossie-hero-card">
        <div className="rossie-orb rossie-orb-orange"/>
        <div className="relative z-10">
          <p className="rossie-kicker">Outstanding balance</p>
          <p className="rossie-hero-value">{fmt(totalOutstanding)}</p>
          <p className="mt-3 text-[10px] text-white/40">Across active contracts</p>
        </div>
      </section>

      <div className="flex items-center gap-2">
        <select value={filterContractId} onChange={e=>setFilterContractId(e.target.value)} className="flex-1" data-ocid="advances.contract_filter">
          <option value="all">All active contracts</option>
          {contracts.filter((c:any)=>!c.settled).map((c:any)=><option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}
        </select>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-[10px] font-bold text-white/45">{activeAdvances.length} open</span>
      </div>

      <section>
        <div className="rossie-section-heading"><div><p className="rossie-kicker">Current</p><h2>Active advances</h2></div><span className="text-xs font-bold text-orange-300">{fmt(activeAdvances.reduce((s:number,a:any)=>s+Number(a.amount||0),0))}</span></div>
        <div className="mt-3">{renderAdvancesSection(activeAdvances,"Active Advances","No active advances recorded.")}</div>
      </section>

      <section className="rossie-glass-section">
        <button type="button" onClick={()=>setShowCleared(v=>!v)} className="flex w-full items-center justify-between text-left"><div><p className="rossie-kicker">History</p><h2>Cleared advances</h2></div><span className="text-xs text-white/35">{clearedAdvances.length} records</span></button>
        {showCleared && <div className="mt-4">{renderAdvancesSection(clearedAdvances,"Cleared Advances","No cleared advances recorded.")}</div>}
      </section>

      {isAdmin && <button type="button" onClick={openAdd} className="rossie-fab z-40 flex items-center justify-center" aria-label="Add Advance" data-ocid="advances.add_button"><Plus size={22}/></button>}

      {showForm && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}>
        <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1727]/96 shadow-2xl">
          <div className="border-b border-white/[0.08] p-5"><p className="rossie-eyebrow">Settlement</p><h2 className="mt-1 text-xl font-bold">{editingAdvance?"Edit advance":"New advance"}</h2></div>
          <div className="space-y-3 p-5">
            <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">Contract</span><select value={form.contractId} onChange={e=>setForm(p=>({...p,contractId:e.target.value}))} className="w-full">{formContracts.map((c:any)=><option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">Labour</span><select value={form.labourId} onChange={e=>setForm(p=>({...p,labourId:e.target.value}))} className="w-full"><option value="">Choose labour…</option>{labours.map((l:any)=><option key={String(l.id)} value={String(l.id)}>{l.name}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">Amount</span><input ref={amountRef} type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="₹0" className="w-full"/></label>
            <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">Note</span><input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Optional note" className="w-full"/></label>
            {error&&<p className="text-xs text-red-300">{error}</p>}
          </div>
          <div className="flex gap-2 border-t border-white/[0.08] p-5"><button type="button" onClick={()=>setShowForm(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/55">Cancel</button><button type="button" onClick={handleSave} className="rossie-primary flex-1 rounded-xl py-3 text-sm font-bold">Save advance</button></div>
        </div>
      </div>}

      {confirmDelete!==null && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"><div className="w-full max-w-sm rounded-[28px] border border-red-400/15 bg-[#0b1727] p-5"><h2 className="text-lg font-bold">Delete advance?</h2><p className="mt-2 text-xs text-white/40">This cannot be undone.</p><div className="mt-5 flex gap-2"><button type="button" onClick={()=>setConfirmDelete(null)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/55">Cancel</button><button type="button" onClick={()=>handleDelete(confirmDelete)} className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold">Delete</button></div></div></div>}
    </section>
  );
}

export default memo(AdvancesPage);

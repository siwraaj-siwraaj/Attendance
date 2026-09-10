import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, UserPlus, Users, UserCheck, UserX, Pencil, X, BriefcaseBusiness, CalendarDays, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAddLabour, useLabours, useUpdateLabour } from "../hooks/useBackend";
import SkeletonLoader from "../components/SkeletonLoader";

function LaboursPage() {
  const { isAdmin } = useAuth();
  const { data: labours = [], isLoading } = useLabours();
  const addLabour = useAddLabour();
  const updateLabour = useUpdateLabour();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const activeCount = useMemo(() => labours.filter((l: any) => l.isActive !== false).length, [labours]);
  const inactiveCount = labours.length - activeCount;
  const filtered = useMemo(() => labours.filter((l: any) => {
    const statusOk = filter === "all" || (filter === "active" ? l.isActive !== false : l.isActive === false);
    const q = query.trim().toLowerCase();
    return statusOk && (!q || String(l.name ?? "").toLowerCase().includes(q) || String(l.employeeId ?? "").toLowerCase().includes(q));
  }), [labours, filter, query]);

  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 80); }, [showForm]);

  const openAdd = useCallback(() => {
    setEditing(null); setName(""); setEmployeeId(""); setJoinDate(""); setActive(true); setError(""); setShowForm(true);
  }, []);
  const openEdit = useCallback((l: any) => {
    setEditing(l); setName(l.name ?? ""); setEmployeeId(l.employeeId ?? ""); setJoinDate(l.joinDate ?? ""); setActive(l.isActive !== false); setError(""); setShowForm(true);
  }, []);
  const save = useCallback(() => {
    if (!name.trim()) { setError("Name is required"); return; }
    setShowForm(false); setError("");
    const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to save labour");
    if (editing) updateLabour.mutate({ id: editing.id, name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim(), isActive: active }, { onError });
    else addLabour.mutate({ name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim() }, { onError });
  }, [name, employeeId, joinDate, active, editing, addLabour, updateLabour]);

  if (isLoading) return <div className="h-full p-4"><SkeletonLoader /></div>;

  return (
    <div className="h-full overflow-hidden bg-[#080d1b] text-white font-['Figtree',sans-serif]">
      <div className="h-full overflow-y-auto px-4 pt-4 pb-28">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[26px] border border-orange-400/15 bg-gradient-to-br from-[#172039] via-[#10182b] to-[#0d1323] p-5 shadow-xl">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2 text-orange-400"><BriefcaseBusiness className="h-4 w-4"/><span className="text-[11px] font-bold uppercase tracking-[0.18em]">Workforce</span></div>
              <h1 className="text-2xl font-bold tracking-tight">Labours</h1>
              <p className="mt-1 text-xs text-white/45">Manage your team and availability</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><Users className="h-6 w-6"/></div>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/[0.055] p-3"><p className="text-[10px] uppercase tracking-wider text-white/35">Total</p><p className="mt-1 text-xl font-bold">{labours.length}</p></div>
            <div className="rounded-2xl bg-emerald-500/10 p-3"><p className="text-[10px] uppercase tracking-wider text-emerald-300/55">Active</p><p className="mt-1 text-xl font-bold text-emerald-300">{activeCount}</p></div>
            <div className="rounded-2xl bg-white/[0.055] p-3"><p className="text-[10px] uppercase tracking-wider text-white/35">Inactive</p><p className="mt-1 text-xl font-bold text-white/60">{inactiveCount}</p></div>
          </div>
        </section>

        {/* Search */}
        <div className="sticky top-0 z-10 -mx-1 mt-4 bg-[#080d1b]/95 py-1 backdrop-blur-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or employee ID" className="w-full rounded-2xl border border-white/10 bg-[#121a2c] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-orange-500/50" data-ocid="labours.search_input"/>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {([['active',`Active ${activeCount}`],['all',`All ${labours.length}`],['inactive',`Inactive ${inactiveCount}`]] as const).map(([key,label]) => <button key={key} type="button" onClick={() => setFilter(key)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${filter===key?'bg-orange-500 text-white shadow-lg shadow-orange-500/20':'bg-white/[0.06] text-white/50 border border-white/10'}`}>{label}</button>)}
          </div>
        </div>

        {/* List */}
        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-10 text-center"><Users className="mx-auto h-8 w-8 text-white/15"/><p className="mt-3 text-sm font-semibold text-white/55">No labours found</p><p className="mt-1 text-xs text-white/30">Try another search or filter</p></div> : filtered.map((l: any, index: number) => {
            const isActive = l.isActive !== false;
            return <button key={String(l.id)} type="button" onClick={() => isAdmin && openEdit(l)} className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#10182a] p-3 text-left transition active:scale-[0.99] hover:border-orange-500/25" data-ocid={`labour.item.${index+1}`}>
              <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${isActive?'bg-orange-500/15 text-orange-400':'bg-white/5 text-white/30'}`}>{String(l.name ?? '?').trim().charAt(0).toUpperCase() || '?' }<span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#10182a] ${isActive?'bg-emerald-400':'bg-white/20'}`}/></div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{l.name}</p>{isActive && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400"/>}</div><div className="mt-1 flex items-center gap-3 text-[11px] text-white/35">{l.employeeId && <span>ID {l.employeeId}</span>}{l.joinDate && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/>{l.joinDate}</span>}</div></div>
              <div className="shrink-0 rounded-xl bg-white/5 p-2 text-white/25 group-hover:text-orange-400"><Pencil className="h-4 w-4"/></div>
            </button>;
          })}
        </div>
      </div>

      {isAdmin && <button type="button" onClick={openAdd} className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-xl shadow-orange-900/30 active:scale-95" aria-label="Add Labour" data-ocid="labours.add_button"><UserPlus className="h-6 w-6"/></button>}

      {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={e => {if(e.target===e.currentTarget)setShowForm(false)}}>
        <div className="w-full max-w-md rounded-t-[28px] border border-white/10 bg-[#111a2c] p-5 shadow-2xl sm:rounded-[28px]">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">Workforce</p><h2 className="mt-1 text-xl font-bold">{editing?'Edit Labour':'Add Labour'}</h2></div><button type="button" onClick={()=>setShowForm(false)} className="rounded-xl bg-white/5 p-2 text-white/50"><X className="h-5 w-5"/></button></div>
          <div className="space-y-3">
            <label className="block"><span className="mb-1.5 block text-xs text-white/45">Full name *</span><input ref={nameRef} value={name} onChange={e=>setName(e.target.value)} placeholder="Enter labour name" className="w-full rounded-2xl border border-white/10 bg-[#0a1020] px-4 py-3 text-sm outline-none focus:border-orange-500/60"/></label>
            <label className="block"><span className="mb-1.5 block text-xs text-white/45">Employee ID</span><input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Optional employee ID" className="w-full rounded-2xl border border-white/10 bg-[#0a1020] px-4 py-3 text-sm outline-none focus:border-orange-500/60"/></label>
            <label className="block"><span className="mb-1.5 block text-xs text-white/45">Join date</span><input type="date" value={joinDate} onChange={e=>setJoinDate(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0a1020] px-4 py-3 text-sm outline-none focus:border-orange-500/60"/></label>
            {editing && <button type="button" onClick={()=>setActive(v=>!v)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4"><span className="flex items-center gap-3">{active?<UserCheck className="h-5 w-5 text-emerald-400"/>:<UserX className="h-5 w-5 text-white/35"/>}<span className="text-sm font-semibold">{active?'Active labour':'Inactive labour'}</span></span><span className={`h-6 w-11 rounded-full p-1 transition ${active?'bg-emerald-500':'bg-white/15'}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${active?'translate-x-5':''}`}/></span></button>}
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="button" onClick={save} className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-bold shadow-lg shadow-orange-900/20">{editing?'Save changes':'Add labour'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

export default LaboursPage;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, UserPlus, Users, UserCheck, UserX, Pencil, X, BriefcaseBusiness, CalendarDays, Phone, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAddLabour, useLabours, useUpdateLabour, useDeleteLabour } from "../hooks/useBackend";
import SkeletonLoader from "../components/SkeletonLoader";
import ScrollHeaderTitle from "../components/ScrollHeaderTitle";

function LaboursPage() {
  const { isAdmin } = useAuth();
  const { data: labours = [], isLoading } = useLabours();
  const addLabour = useAddLabour();
  const updateLabour = useUpdateLabour();
  const deleteLabour = useDeleteLabour();
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const activeCount = useMemo(() => labours.filter((l: any) => l.isActive !== false).length, [labours]);
  const inactiveCount = labours.length - activeCount;
  const filtered = useMemo(() => labours.filter((l: any) => {
    const statusOk = filter === "all" || (filter === "active" ? l.isActive !== false : l.isActive === false);
    const q = query.trim().toLowerCase();
    return statusOk && (!q || String(l.name ?? "").toLowerCase().includes(q) || String(l.employeeId ?? "").toLowerCase().includes(q) || String(l.phoneNumber ?? "").includes(q));
  }), [labours, filter, query]);

  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 80); }, [showForm]);

  const openAdd = useCallback(() => {
    setEditing(null); setName(""); setEmployeeId(""); setPhoneNumber(""); setJoinDate(""); setActive(true); setError(""); setShowForm(true);
  }, []);

  const openEdit = useCallback((l: any) => {
    setEditing(l); setName(l.name ?? ""); setEmployeeId(l.employeeId ?? ""); setPhoneNumber(l.phoneNumber ?? ""); setJoinDate(l.joinDate ?? ""); setActive(l.isActive !== false); setError(""); setShowForm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteLabour.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Labour removed"); setDeleteTarget(null); setShowForm(false); setEditing(null); },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not remove labour"),
    });
  }, [deleteTarget, deleteLabour]);

  const save = useCallback(() => {
    if (!name.trim()) { setError("Name is required"); return; }
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) { setError("Enter a valid 10-digit mobile number"); return; }
    const duplicate = labours.some((l: any) => String(l.phoneNumber ?? "") === normalizedPhone && String(l.id) !== String(editing?.id ?? ""));
    if (duplicate) { setError("This mobile number is already saved for another labour"); return; }
    setShowForm(false); setError("");
    const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to save labour");
    if (editing) updateLabour.mutate({ id: editing.id, name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim(), isActive: active, phoneNumber: normalizedPhone }, { onError });
    else addLabour.mutate({ name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim(), phoneNumber: normalizedPhone }, { onError });
  }, [name, employeeId, phoneNumber, joinDate, active, editing, labours, addLabour, updateLabour]);

  if (isLoading) return <div className="h-full p-4"><SkeletonLoader /></div>;

  return (
    <div className="min-h-full bg-[#F8FAFC] text-[#101828] font-['Figtree',sans-serif]">
      <div className="pb-28">
        <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] border-b border-white/10 bg-[#172536] px-4 py-2 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-300"><BriefcaseBusiness className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Workforce</span></div>
              <ScrollHeaderTitle title="Labours" className="text-3xl" />
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/55">Your workforce, in one place.</p>
            </div>
            {isAdmin && <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-2xl bg-[#F97316] px-4 text-xs font-extrabold text-white shadow-lg shadow-orange-200 active:scale-95"><UserPlus className="h-4 w-4" />Add</button>}
          </div>

          <div className="mt-1.5 grid grid-cols-3 overflow-hidden rounded-xl border border-[#101828]/10 bg-[#F8FAFC]">
            <button type="button" onClick={() => setFilter("all")} className="border-r border-[#101828]/10 px-3 py-2 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#101828]/55">Team</p><p className="mt-1 text-xl font-extrabold">{labours.length}</p>
            </button>
            <button type="button" onClick={() => setFilter("active")} className="border-r border-[#101828]/10 px-3 py-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active</p><p className="mt-1 text-xl font-extrabold text-emerald-700">{activeCount}</p>
            </button>
            <button type="button" onClick={() => setFilter("inactive")} className="px-3 py-2 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#101828]/55">Inactive</p><p className="mt-1 text-xl font-extrabold text-[#101828]/70">{inactiveCount}</p>
            </button>
          </div>
        </header>

        <main className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#101828]/45" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search labour, ID or mobile" className="h-12 w-full rounded-2xl border border-[#101828]/10 bg-white pl-11 pr-4 text-sm text-[#101828] shadow-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100" data-ocid="labours.search_input" />
          </div>

          <div className="mt-3 flex rounded-xl bg-[#101828]/5 p-1">
            {([["active", "Active"], ["all", "All"], ["inactive", "Inactive"]] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setFilter(key)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${filter === key ? "bg-white text-[#101828] shadow-sm" : "text-[#101828]/55"}`}>{label}</button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div><h2 className="text-sm font-extrabold">Team members</h2><p className="mt-0.5 text-[11px] text-[#101828]/50">{filtered.length} shown</p></div>
            {isAdmin && <button type="button" onClick={openAdd} className="text-xs font-bold text-[#F97316]">+ New labour</button>}
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-[#101828]/10 bg-white shadow-sm">
            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#101828]/5"><Users className="h-6 w-6 text-[#101828]/35" /></div>
                <p className="mt-4 text-sm font-bold">No labours found</p>
                <p className="mt-1 text-xs text-[#101828]/50">Try another search or status filter.</p>
              </div>
            ) : filtered.map((l: any, index: number) => {
              const isActive = l.isActive !== false;
              const initial = String(l.name ?? "?").trim().charAt(0).toUpperCase() || "?";
              return (
                <button key={String(l.id)} type="button" onClick={() => isAdmin && openEdit(l)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-[#F8FAFC] ${index > 0 ? "border-t border-[#101828]/10" : ""}`} data-ocid={`labour.item.${index + 1}`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${isActive ? "bg-orange-50 text-[#F97316]" : "bg-[#101828]/5 text-[#101828]/45"}`}>{initial}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-extrabold text-[#101828]">{l.name}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#101828]/5 text-[#101828]/50"}`}>{isActive ? "ACTIVE" : "INACTIVE"}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-[#101828]/55">
                      <span>{l.employeeId ? `ID ${l.employeeId}` : "No ID"}</span>
                      <span>{l.phoneNumber || "No mobile"}</span>
                    </div>
                  </div>
                  {isAdmin && <ChevronRight className="h-4 w-4 shrink-0 text-[#101828]/25" />}
                </button>
              );
            })}
          </div>
        </main>

        {isAdmin && <button type="button" onClick={openAdd} className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#F97316] text-white shadow-xl shadow-orange-200 active:scale-95" aria-label="Add Labour" data-ocid="labours.add_button"><UserPlus className="h-6 w-6" /></button>}

        {deleteTarget && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-[#101828]/10 p-5"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Trash2 className="h-5 w-5" /></div><div className="flex-1"><h3 className="font-extrabold">Remove labour</h3><p className="mt-1 text-xs text-[#101828]/55">This archives the labour while preserving historical records.</p></div><button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl p-2 text-[#101828]/50"><X className="h-4 w-4" /></button></div></div>
            <div className="p-5"><div className="rounded-2xl bg-[#F8FAFC] p-4"><p className="text-sm font-bold">{deleteTarget.name}</p><p className="mt-1 text-xs text-[#101828]/55">{deleteTarget.phoneNumber || "No mobile number"}</p></div><p className="mt-4 text-xs leading-5 text-[#101828]/60">Attendance and payment history will be preserved. The labour record will be archived.</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-[#101828]/10 py-3 text-sm font-bold">Cancel</button><button type="button" disabled={deleteLabour.isPending} onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50">{deleteLabour.isPending ? "Removing…" : "Remove"}</button></div></div>
          </div>
        </div>}

        {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101828]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#F97316]">{editing ? "Edit team member" : "New team member"}</p><h2 className="mt-1 text-xl font-extrabold">{editing ? "Edit Labour" : "Add Labour"}</h2></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-[#101828]/5 p-2"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Full name *</span><input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" className="w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 py-3 text-sm outline-none focus:border-[#F97316]" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Mobile number *</span><input type="tel" inputMode="numeric" maxLength={10} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" className="w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 py-3 text-sm outline-none focus:border-[#F97316]" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Employee ID</span><input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="Optional ID" className="w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 py-3 text-sm outline-none focus:border-[#F97316]" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Join date</span><input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className="w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 py-3 text-sm outline-none focus:border-[#F97316]" /></label>
              {editing && <button type="button" onClick={() => setActive(v => !v)} className="flex w-full items-center justify-between rounded-xl border border-[#101828]/10 bg-[#F8FAFC] p-4"><span className="flex items-center gap-3 text-sm font-bold">{active ? <UserCheck className="h-5 w-5 text-emerald-600" /> : <UserX className="h-5 w-5 text-[#101828]/45" />}{active ? "Active labour" : "Inactive labour"}</span><span className={`h-6 w-11 rounded-full p-1 ${active ? "bg-emerald-500" : "bg-[#101828]/20"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : ""}`} /></span></button>}
              {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">{editing && <button type="button" onClick={() => { setShowForm(false); setEditing(null); setDeleteTarget(editing); }} className="flex-1 rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600"><Trash2 className="mr-2 inline h-4 w-4" />Remove</button>}<button type="button" onClick={save} className="flex-1 rounded-xl bg-[#F97316] py-3.5 text-sm font-extrabold text-white">{editing ? "Save changes" : "Add labour"}</button></div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

export default LaboursPage;

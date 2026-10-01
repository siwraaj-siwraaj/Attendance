import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, UserPlus, Users, UserCheck, UserX, X, BriefcaseBusiness, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAddLabour, useLabours } from "../hooks/useBackend";
import SkeletonLoader from "../components/SkeletonLoader";
import ScrollHeaderTitle from "../components/ScrollHeaderTitle";

interface LaboursPageProps {
  onSelectLabour?: (labour: any) => void;
}

function LaboursPage({ onSelectLabour }: LaboursPageProps) {
  const { isAdmin } = useAuth();
  const { data: labours = [], isLoading } = useLabours();
  const addLabour = useAddLabour();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const activeCount = useMemo(() => labours.filter((l: any) => l.isActive !== false).length, [labours]);
  const inactiveCount = labours.length - activeCount;
  const filtered = useMemo(() => labours.filter((l: any) => {
    const statusOk = filter === "all" || (filter === "active" ? l.isActive !== false : l.isActive === false);
    const q = query.trim().toLowerCase();
    return statusOk && (!q || String(l.name ?? "").toLowerCase().includes(q) || String(l.employeeId ?? "").toLowerCase().includes(q) || String(l.phoneNumber ?? "").includes(q));
  }), [labours, filter, query]);

  useEffect(() => {
    if (showForm) window.setTimeout(() => nameRef.current?.focus(), 80);
  }, [showForm]);

  const openAdd = useCallback(() => {
    setName(""); setEmployeeId(""); setPhoneNumber(""); setJoinDate(""); setError(""); setShowForm(true);
  }, []);

  const save = useCallback(() => {
    if (!name.trim()) { setError("Name is required"); return; }
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) { setError("Enter a valid 10-digit mobile number"); return; }
    if (labours.some((l: any) => String(l.phoneNumber ?? "") === normalizedPhone)) { setError("This mobile number is already saved for another labour"); return; }
    setError("");
    addLabour.mutate(
      { name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim(), phoneNumber: normalizedPhone },
      { onSuccess: () => { toast.success("Labour added"); setShowForm(false); }, onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to save labour") },
    );
  }, [name, employeeId, phoneNumber, joinDate, labours, addLabour]);

  if (isLoading) return <div className="h-full p-4"><SkeletonLoader /></div>;

  return (
    <div className="min-h-full bg-[#F8FAFC] font-['Figtree',sans-serif] text-[#101828]">
      <header className="app-tab-header flex h-[200px] shrink-0 flex-col justify-between rounded-b-[28px] border-b border-white/10 bg-[#172536] px-4 py-2 text-white shadow-sm sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-orange-300"><BriefcaseBusiness className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Workforce</span></div>
            <ScrollHeaderTitle title="Labours" className="text-3xl" />
            <p className="mt-1 text-xs leading-5 text-white/55">Manage your workforce and labour records.</p>
          </div>
          {isAdmin && <button type="button" onClick={openAdd} className="flex h-11 items-center gap-2 rounded-2xl bg-orange-500 px-4 text-xs font-extrabold text-white shadow-lg shadow-orange-950/20 active:scale-95"><UserPlus size={16} />Add</button>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setFilter("all")} className={`rounded-2xl border px-3 py-2.5 text-left transition ${filter === "all" ? "border-orange-300/40 bg-white/[0.13]" : "border-white/10 bg-white/[0.06]"}`}>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/45">Team</p>
            <p className="mt-1 text-xl font-black text-white">{labours.length}</p>
          </button>
          <button type="button" onClick={() => setFilter("active")} className={`rounded-2xl border px-3 py-2.5 text-left transition ${filter === "active" ? "border-emerald-300/40 bg-white/[0.13]" : "border-white/10 bg-white/[0.06]"}`}>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-200/75">Active</p>
            <p className="mt-1 text-xl font-black text-emerald-200">{activeCount}</p>
          </button>
          <button type="button" onClick={() => setFilter("inactive")} className={`rounded-2xl border px-3 py-2.5 text-left transition ${filter === "inactive" ? "border-white/20 bg-white/[0.13]" : "border-white/10 bg-white/[0.06]"}`}>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/45">Inactive</p>
            <p className="mt-1 text-xl font-black text-white/75">{inactiveCount}</p>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
        <section className="rounded-3xl border border-[#101828]/10 bg-white p-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, ID or mobile" className="h-12 w-full rounded-2xl bg-[#F8FAFC] pl-10 pr-4 text-sm font-medium text-[#101828] outline-none ring-1 ring-[#EAECF0] focus:ring-2 focus:ring-orange-200" data-ocid="labours.search_input" />
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-base font-black">Team members</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#667085]">{filtered.length} {filtered.length === 1 ? "labour" : "labours"} shown</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#101828]/5 px-2.5 py-1.5 text-[10px] font-bold text-[#667085]"><SlidersHorizontal size={13} />{filter === "all" ? "All" : filter === "active" ? "Active" : "Inactive"}</div>
        </div>

        <section className="mt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#101828]/15 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101828]/5"><Users size={24} className="text-[#667085]" /></div>
              <p className="mt-4 text-sm font-black">No labours found</p>
              <p className="mt-1 text-xs text-[#667085]">Try a different name, ID, mobile number or status.</p>
            </div>
          ) : filtered.map((l: any, index: number) => {
            const isActive = l.isActive !== false;
            const initial = String(l.name ?? "?").trim().charAt(0).toUpperCase() || "?";
            return (
              <button key={String(l.id)} type="button" onClick={() => onSelectLabour?.(l)} className="flex w-full items-center gap-3 rounded-2xl border border-[#101828]/10 bg-white px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99] active:bg-[#F8FAFC]" data-ocid={`labour.item.${index + 1}`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black ${isActive ? "bg-orange-50 text-orange-500" : "bg-[#101828]/5 text-[#667085]"}`}>{initial}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="truncate text-sm font-black text-[#101828]">{l.name}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black tracking-wide ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#101828]/5 text-[#667085]"}`}>{isActive ? "ACTIVE" : "INACTIVE"}</span></div>
                  <p className="mt-1 truncate text-[11px] font-medium text-[#667085]">{l.employeeId ? `ID ${l.employeeId}` : "No employee ID"} <span className="mx-1 text-[#D0D5DD]">•</span> {l.phoneNumber || "No mobile number"}</p>
                </div>
                <span className="text-xs font-bold text-orange-500">View</span>
              </button>
            );
          })}
        </section>
      </main>

      {isAdmin && <button type="button" onClick={openAdd} className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-950/20 active:scale-95" aria-label="Add Labour" data-ocid="labours.add_button"><UserPlus size={22} /></button>}

      {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101828]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-500">New team member</p><h2 className="mt-1 text-xl font-black">Add Labour</h2></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-[#101828]/5 p-2"><X size={18} /></button></div>
          <div className="space-y-3">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Full name *</span><input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm outline-none focus:border-orange-400" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Mobile number *</span><input type="tel" inputMode="numeric" maxLength={10} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm outline-none focus:border-orange-400" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Employee ID</span><input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="Optional ID" className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm outline-none focus:border-orange-400" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#101828]/60">Join date</span><input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm outline-none focus:border-orange-400" /></label>
            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1"><button type="button" onClick={() => setShowForm(false)} className="h-12 flex-1 rounded-xl border border-[#101828]/10 text-sm font-bold">Cancel</button><button type="button" onClick={save} disabled={addLabour.isPending} className="h-12 flex-1 rounded-xl bg-orange-500 text-sm font-extrabold text-white disabled:opacity-50">{addLabour.isPending ? "Saving…" : "Add labour"}</button></div>
          </div>
        </div>
      </div>}
    </div>
  );
}

export default LaboursPage;

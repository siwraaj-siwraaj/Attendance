import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, CheckCircle2, Edit3, Phone, Trash2, User, X, Hash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useUpdateLabour, useDeleteLabour } from "../hooks/useBackend";

interface LabourDetailsPageProps {
  labour: any;
  onBack: () => void;
}

export default function LabourDetailsPage({ labour, onBack }: LabourDetailsPageProps) {
  const { isAdmin } = useAuth();
  const updateLabour = useUpdateLabour();
  const deleteLabour = useDeleteLabour();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(String(labour?.name ?? ""));
  const [employeeId, setEmployeeId] = useState(String(labour?.employeeId ?? ""));
  const [phoneNumber, setPhoneNumber] = useState(String(labour?.phoneNumber ?? ""));
  const [joinDate, setJoinDate] = useState(String(labour?.joinDate ?? ""));
  const [active, setActive] = useState(labour?.isActive !== false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!labour) return null;

  const save = () => {
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!/^\d{10}$/.test(normalizedPhone)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    updateLabour.mutate(
      { id: labour.id, name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim(), isActive: active, phoneNumber: normalizedPhone },
      { onSuccess: () => { toast.success("Labour updated"); setEditing(false); }, onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not update labour") },
    );
  };

  const remove = () => {
    deleteLabour.mutate(labour.id, {
      onSuccess: () => { toast.success("Labour removed"); onBack(); },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not remove labour"),
    });
  };

  const joined = joinDate ? new Date(joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not recorded";

  return (
    <div className="min-h-full bg-[#F8FAFC] text-[#101828] font-['Figtree',sans-serif]">
      <header className="app-tab-header flex h-[112px] shrink-0 items-end rounded-b-[28px] bg-[#172536] px-4 pb-4 text-white shadow-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <button type="button" onClick={onBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07]" aria-label="Back to labours"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-orange-300">Labour profile</p>
            <h1 className="truncate text-xl font-black">{labour.name || "Labour details"}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${active ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/55"}`}>{active ? "ACTIVE" : "INACTIVE"}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-[#101828]/10 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#172536] to-[#24364b] px-5 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black shadow-lg shadow-orange-950/20">{String(labour.name ?? "?").trim().charAt(0).toUpperCase() || "?"}</div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black">{labour.name || "Unnamed labour"}</p>
                <p className="mt-1 text-xs text-white/55">{employeeId ? `Employee ID · ${employeeId}` : "Employee ID not recorded"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px bg-[#101828]/10 sm:grid-cols-2">
            <div className="bg-white p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#101828]/45">Mobile</p><p className="mt-2 flex items-center gap-2 text-sm font-bold"><Phone size={15} className="text-orange-500" />{phoneNumber || "Not recorded"}</p></div>
            <div className="bg-white p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#101828]/45">Join date</p><p className="mt-2 flex items-center gap-2 text-sm font-bold"><CalendarDays size={15} className="text-orange-500" />{joined}</p></div>
            <div className="bg-white p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#101828]/45">Employee ID</p><p className="mt-2 flex items-center gap-2 text-sm font-bold"><Hash size={15} className="text-orange-500" />{employeeId || "Not recorded"}</p></div>
            <div className="bg-white p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#101828]/45">Status</p><p className="mt-2 flex items-center gap-2 text-sm font-bold">{active ? <CheckCircle2 size={15} className="text-emerald-600" /> : <User size={15} className="text-[#101828]/35" />}{active ? "Active labour" : "Inactive labour"}</p></div>
          </div>
        </section>

        {isAdmin && !editing && (
          <section className="mt-4 rounded-3xl border border-[#101828]/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#101828]/45">Manage labour</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEditing(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#172536] text-sm font-extrabold text-white"><Edit3 size={16} />Edit details</button>
              <button type="button" onClick={() => setConfirmRemove(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-extrabold text-red-600"><Trash2 size={16} />Remove</button>
            </div>
          </section>
        )}

        {editing && (
          <section className="mt-4 rounded-3xl border border-[#101828]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-orange-500">Edit profile</p><h2 className="mt-1 text-lg font-black">Update labour details</h2></div><button type="button" onClick={() => setEditing(false)} className="rounded-xl bg-[#101828]/5 p-2"><X size={17} /></button></div>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm font-semibold outline-none focus:border-orange-400" />
              <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0,10))} inputMode="numeric" placeholder="10-digit mobile number" className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm font-semibold outline-none focus:border-orange-400" />
              <input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="Employee ID" className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm font-semibold outline-none focus:border-orange-400" />
              <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className="h-12 w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm font-semibold outline-none focus:border-orange-400" />
              <button type="button" onClick={() => setActive(v => !v)} className="flex h-12 w-full items-center justify-between rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-4 text-sm font-bold"><span>{active ? "Active labour" : "Inactive labour"}</span><span className={`h-6 w-11 rounded-full p-1 ${active ? "bg-emerald-500" : "bg-[#101828]/20"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : ""}`} /></span></button>
              <div className="flex gap-2 pt-1"><button type="button" onClick={() => setEditing(false)} className="h-12 flex-1 rounded-xl border border-[#101828]/10 text-sm font-bold">Cancel</button><button type="button" onClick={save} disabled={updateLabour.isPending} className="h-12 flex-1 rounded-xl bg-orange-500 text-sm font-extrabold text-white disabled:opacity-50">{updateLabour.isPending ? "Saving…" : "Save changes"}</button></div>
            </div>
          </section>
        )}

        {confirmRemove && (
          <section className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-black text-red-700">Remove {labour.name}?</p>
            <p className="mt-1 text-xs leading-5 text-red-700/70">Attendance and payment history will be preserved. The labour will be archived.</p>
            <div className="mt-4 flex gap-2"><button type="button" onClick={() => setConfirmRemove(false)} className="h-11 flex-1 rounded-xl border border-red-200 bg-white text-sm font-bold">Cancel</button><button type="button" onClick={remove} disabled={deleteLabour.isPending} className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-extrabold text-white disabled:opacity-50">{deleteLabour.isPending ? "Removing…" : "Remove"}</button></div>
          </section>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { ArrowLeft, CalendarDays, Edit3, Hash, Phone, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useUpdateLabour, useDeleteLabour } from "../hooks/useBackend";

interface LabourDetailsPageProps { labour: any; onBack: () => void; }

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
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  const joined = joinDate ? new Date(joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "Not recorded";
  const initial = String(labour.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  const save = () => {
    if (!name.trim()) return toast.error("Name is required");
    if (!/^\d{10}$/.test(normalizedPhone)) return toast.error("Enter a valid 10-digit mobile number");
    updateLabour.mutate(
      { id: labour.id, name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim(), isActive: active, phoneNumber: normalizedPhone },
      { onSuccess: () => { toast.success("Labour updated"); setEditing(false); }, onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not update labour") },
    );
  };

  const remove = () => deleteLabour.mutate(labour.id, {
    onSuccess: () => { toast.success("Labour removed"); onBack(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not remove labour"),
  });

  return (
    <div className="min-h-full bg-[#F4F6F8] font-['Figtree',sans-serif] text-[#101828]">
      <main className="mx-auto w-full max-w-5xl px-4 pb-0 pt-4 sm:px-6">
        <button onClick={onBack} type="button" className="mb-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-extrabold text-[#172536] shadow-sm ring-1 ring-[#101828]/5 active:scale-[0.98]">
          <ArrowLeft size={17} /> Back to Labours
        </button>

        <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_8px_30px_rgba(16,24,40,0.08)]">
          <div className="bg-[#172536] px-5 pb-5 pt-5 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[20px] bg-orange-500 text-3xl font-black">{initial}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-black">{labour.name || "Unnamed labour"}</h1>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black tracking-wider ${active ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/60"}`}>{active ? "ACTIVE" : "INACTIVE"}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-white/55">{employeeId ? `Employee ID · ${employeeId}` : "Employee ID not recorded"}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
              <ShieldCheck size={16} className="text-orange-300" />
              <span className="text-xs font-semibold text-white/75">{active ? "Currently available for work" : "Currently inactive"}</span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#667085]">Personal information</p>
            <div className="mt-3 divide-y divide-[#EAECF0] rounded-2xl border border-[#EAECF0]">
              <div className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Phone size={17}/></div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Mobile number</p><p className="mt-0.5 text-sm font-bold">{phoneNumber || "Not recorded"}</p></div></div>
              <div className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Hash size={17}/></div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Employee ID</p><p className="mt-0.5 text-sm font-bold">{employeeId || "Not recorded"}</p></div></div>
              <div className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><CalendarDays size={17}/></div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Joining date</p><p className="mt-0.5 text-sm font-bold">{joined}</p></div></div>
            </div>
          </div>
        </section>

        {isAdmin && !editing && <section className="mt-4 rounded-[24px] bg-white p-4 shadow-[0_6px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172536] text-white"><UserRound size={17}/></div><div><p className="text-sm font-black">Manage labour</p><p className="text-[11px] text-[#667085]">Update or remove this team member</p></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setEditing(true)} type="button" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#172536] text-sm font-extrabold text-white active:scale-[0.98]"><Edit3 size={16}/>Edit profile</button>
            <button onClick={() => setConfirmRemove(true)} type="button" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-extrabold text-red-600 active:scale-[0.98]"><Trash2 size={16}/>Remove</button>
          </div>
        </section>}

        {editing && <section className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_6px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">Edit profile</p><h2 className="mt-1 text-lg font-black">Labour details</h2></div><button onClick={() => setEditing(false)} type="button" className="rounded-xl bg-[#101828]/5 p-2"><X size={17}/></button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-[#344054]">Full name</span><input value={name} onChange={e => setName(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-orange-400"/></label>
            <label><span className="mb-1.5 block text-xs font-bold text-[#344054]">Mobile number</span><input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g,"").slice(0,10))} inputMode="numeric" className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-orange-400"/></label>
            <label><span className="mb-1.5 block text-xs font-bold text-[#344054]">Employee ID</span><input value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-orange-400"/></label>
            <label><span className="mb-1.5 block text-xs font-bold text-[#344054]">Joining date</span><input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-orange-400"/></label>
            <button onClick={() => setActive(v => !v)} type="button" className="flex h-12 items-center justify-between rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-bold"><span>{active ? "Active" : "Inactive"}</span><span className={`h-6 w-11 rounded-full p-1 ${active ? "bg-emerald-500" : "bg-[#D0D5DD]"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : ""}`}/></span></button>
          </div>
          <div className="mt-4 flex gap-2"><button onClick={() => setEditing(false)} type="button" className="h-12 flex-1 rounded-xl border border-[#D0D5DD] text-sm font-bold">Cancel</button><button onClick={save} type="button" disabled={updateLabour.isPending} className="h-12 flex-1 rounded-xl bg-orange-500 text-sm font-extrabold text-white disabled:opacity-50">{updateLabour.isPending ? "Saving…" : "Save changes"}</button></div>
        </section>}

        {confirmRemove && <section className="mt-4 rounded-[24px] border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-black text-red-700">Remove {labour.name}?</p><p className="mt-1 text-xs leading-5 text-red-700/70">The labour will be archived and their existing history will be preserved.</p>
          <div className="mt-4 flex gap-2"><button onClick={() => setConfirmRemove(false)} type="button" className="h-11 flex-1 rounded-xl bg-white text-sm font-bold">Cancel</button><button onClick={remove} type="button" disabled={deleteLabour.isPending} className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-extrabold text-white">{deleteLabour.isPending ? "Removing…" : "Remove labour"}</button></div>
        </section>}

        <div aria-hidden="true" className="h-[var(--rossie-nav-clearance)] shrink-0" />
      </main>
    </div>
  );
}
import { CalendarCheck, ClipboardCheck, CreditCard, FileText, UserCheck, Users, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAllAttendance, useContracts, useGetActiveLabours } from "../hooks/useBackend";

export default function HomePage() {
  const { name, username, setActiveTab } = useAuth();
  const { data: contracts = [] } = useContracts();
  const { data: labours = [] } = useGetActiveLabours();
  const { data: attendance = [] } = useAllAttendance();

  const profile = name?.trim() || username?.trim() || "User";
  const stats = useMemo(() => {
    const present = attendance.filter((r) => r.value.__kind__ === "present" || (r.value.__kind__ === "partial" && r.value.partial > 0)).length;
    const absent = attendance.filter((r) => r.value.__kind__ === "absent").length;
    return {
      total: labours.length,
      present: Math.min(present, labours.length),
      absent: Math.min(absent, labours.length),
      leave: Math.max(0, labours.length - Math.min(present, labours.length) - Math.min(absent, labours.length)),
    };
  }, [attendance, labours.length]);

  return (
    <div className="h-full overflow-y-auto px-3 pb-28 pt-4" data-ocid="home.page">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <section className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 border border-orange-500/40 text-lg font-black text-orange-400">
                {profile.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/45">Hello,</p>
                <h1 className="truncate text-lg font-extrabold text-white">{profile}</h1>
              </div>
            </div>
            <CalendarCheck size={22} className="text-orange-400 shrink-0" />
          </div>
        </section>

        <section className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400"><CalendarCheck size={18}/></div>
            <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white">Today's Attendance</p><p className="text-[10px] text-white/45">{new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date())}</p></div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[9px] font-bold text-emerald-300">Active</span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="glass-card rounded-xl p-3"><p className="text-[10px] text-white/45">Total</p><p className="mt-1 text-2xl font-black text-white">{stats.total}</p><Users size={16} className="mt-2 text-blue-300"/></div>
          <div className="glass-card rounded-xl p-3"><p className="text-[10px] text-white/45">Present</p><p className="mt-1 text-2xl font-black text-emerald-300">{stats.present}</p><UserCheck size={16} className="mt-2 text-emerald-300"/></div>
          <div className="glass-card rounded-xl p-3"><p className="text-[10px] text-white/45">Absent</p><p className="mt-1 text-2xl font-black text-rose-300">{stats.absent}</p><ClipboardCheck size={16} className="mt-2 text-rose-300"/></div>
          <div className="glass-card rounded-xl p-3"><p className="text-[10px] text-white/45">On Leave</p><p className="mt-1 text-2xl font-black text-purple-300">{stats.leave}</p><CalendarCheck size={16} className="mt-2 text-purple-300"/></div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setActiveTab("attendance")} className="glass-card rounded-xl p-3 text-left text-xs font-bold text-white"><ClipboardCheck size={18} className="mb-2 text-orange-400"/>Mark Attendance</button>
            <button type="button" onClick={() => setActiveTab("contracts")} className="glass-card rounded-xl p-3 text-left text-xs font-bold text-white"><FileText size={18} className="mb-2 text-orange-400"/>View Contracts</button>
            <button type="button" onClick={() => setActiveTab("payments")} className="glass-card rounded-xl p-3 text-left text-xs font-bold text-white"><CreditCard size={18} className="mb-2 text-orange-400"/>Payments</button>
            <button type="button" onClick={() => setActiveTab("advances")} className="glass-card rounded-xl p-3 text-left text-xs font-bold text-white"><Wallet size={18} className="mb-2 text-orange-400"/>Advances</button>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-3">
          <h2 className="mb-3 text-sm font-extrabold text-white">Overview</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/[0.025] p-3"><p className="text-white/45">Active contracts</p><p className="mt-1 text-lg font-black text-white">{contracts.filter((c) => !c.settled).length}</p></div>
            <div className="rounded-xl bg-white/[0.025] p-3"><p className="text-white/45">Active labours</p><p className="mt-1 text-lg font-black text-white">{labours.length}</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}

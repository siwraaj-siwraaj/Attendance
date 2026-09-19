import { CalendarDays, CheckCircle2, ClipboardCheck, CreditCard, FileText, Plus, UserPlus, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAllAttendance, useContracts, useGetActiveLabours } from "../hooks/useBackend";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function HomePage() {
  const { name, username, setActiveTab, isAdmin } = useAuth();
  const { data: contracts = [] } = useContracts();
  const { data: activeLabours = [] } = useGetActiveLabours();
  const { data: attendance = [] } = useAllAttendance();

  const stats = useMemo(() => {
    const present = attendance.filter((r) => r.value.__kind__ === "present" || (r.value.__kind__ === "partial" && r.value.partial > 0)).length;
    const absent = attendance.filter((r) => r.value.__kind__ === "absent").length;
    return {
      total: activeLabours.length,
      present: Math.min(present, activeLabours.length),
      absent: Math.min(absent, activeLabours.length),
      leave: Math.max(0, activeLabours.length - Math.min(present, activeLabours.length) - Math.min(absent, activeLabours.length)),
    };
  }, [activeLabours.length, attendance]);

  const profileName = name?.trim() || username?.trim() || "User";
  const dateLabel = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

  return (
    <div className="rossie-home-page" data-ocid="home.page">
      <section className="rossie-home-hero">
        <div className="rossie-profile">
          <div className="rossie-avatar"><span>{profileName.charAt(0).toUpperCase()}</span></div>
          <div>
            <p>Hello,</p>
            <h1>{profileName}</h1>
          </div>
        </div>
        <button type="button" className="rossie-icon-button" aria-label="Notifications"><span>♧</span></button>
      </section>

      <section className="rossie-today-card">
        <div className="rossie-today-icon"><CalendarDays size={18} /></div>
        <div className="rossie-today-copy">
          <strong>Today's Attendance</strong>
          <span>{dateLabel}</span>
        </div>
        <span className="rossie-status-pill present">Present</span>
      </section>

      <section className="rossie-stat-grid">
        <div className="rossie-stat-card blue"><span>Total</span><strong>{stats.total}</strong><ClipboardCheck size={18}/></div>
        <div className="rossie-stat-card green"><span>Present</span><strong>{stats.present}</strong><CheckCircle2 size={18}/></div>
        <div className="rossie-stat-card red"><span>Absent</span><strong>{stats.absent}</strong><span className="rossie-stat-symbol">×</span></div>
        <div className="rossie-stat-card purple"><span>On Leave</span><strong>{stats.leave}</strong><CalendarDays size={18}/></div>
      </section>

      <section className="rossie-home-section">
        <div className="rossie-section-title"><h2>Quick Actions</h2></div>
        <div className="rossie-quick-grid">
          <button type="button" onClick={() => setActiveTab("attendance")}><span className="qa-icon blue"><ClipboardCheck size={19}/></span><span>Mark Attendance</span></button>
          <button type="button" onClick={() => setActiveTab("contracts")}><span className="qa-icon green"><FileText size={19}/></span><span>View Contracts</span></button>
          <button type="button" onClick={() => setActiveTab("payments")}><span className="qa-icon purple"><CreditCard size={19}/></span><span>Payments</span></button>
          <button type="button" onClick={() => setActiveTab("advances")}><span className="qa-icon orange"><Wallet size={19}/></span><span>Advances</span></button>
        </div>
      </section>

      <section className="rossie-home-section">
        <div className="rossie-section-title"><h2>Overview</h2><button type="button" onClick={() => setActiveTab("contracts")}>View all</button></div>
        <div className="rossie-overview-card">
          <div><span>Active contracts</span><strong>{contracts.filter((c) => !c.settled).length}</strong></div>
          <div><span>Active labours</span><strong>{activeLabours.length}</strong></div>
          <div><span>Total contract value</span><strong>{money(contracts.filter((c) => !c.settled).reduce((s, c) => s + c.contractAmount, 0))}</strong></div>
        </div>
      </section>

      {isAdmin && (
        <button type="button" className="rossie-home-fab" onClick={() => setActiveTab("contracts")} aria-label="Add contract"><Plus size={22}/></button>
      )}
    </div>
  );
}

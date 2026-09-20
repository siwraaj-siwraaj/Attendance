import { ArrowUpRight, Bell, CalendarCheck, ChevronRight, CircleDollarSign, FileText, Users, Wallet, Zap } from "lucide-react";
import { useMemo } from "react";
import { useContracts, useLabours, useAllAttendance, useAdvances } from "../hooks/useBackend";
import { useAuth } from "../hooks/useAuth";

const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

export default function DashboardPage(){
  const {name,setActiveTab}=useAuth();
  const {data:contracts=[]}=useContracts();
  const {data:labours=[]}=useLabours();
  const {data:attendance=[]}=useAllAttendance();
  const {data:advances=[]}=useAdvances();

  const activeContracts=contracts.filter((c:any)=>!c.settled);
  const activeLabours=labours.filter((l:any)=>l.isActive!==false);
  const totalContractValue=activeContracts.reduce((s:number,c:any)=>s+Number(c.contractAmount||0),0);
  const outstandingAdvances=advances.filter((a:any)=>!contracts.some((c:any)=>c.id===a.contractId&&c.settled)).reduce((s:number,a:any)=>s+Number(a.amount||0),0);

  const todayStats=useMemo(()=>{
    const byLabour=new Map<string,any>();
    for(const r of attendance as any[]){const id=String(r.labourId);byLabour.set(id,r)}
    let present=0,absent=0;
    for(const r of byLabour.values()){if(r.value?.__kind__==="present")present++;if(r.value?.__kind__==="absent")absent++}
    return {present,absent,total:activeLabours.length};
  },[attendance,activeLabours.length]);

  const completion=activeLabours.length?Math.round((todayStats.present/activeLabours.length)*100):0;
  const recent=activeContracts.slice(0,3);

  return <section className="rossie-page rossie-reference-page">
    <header className="rossie-page-header">
      <div>
        <p className="rossie-eyebrow">Executive Dashboard</p>
        <h1 className="rossie-display">Hello, {name||"User"}</h1>
        <p className="rossie-muted">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"2-digit",month:"long"})}</p>
      </div>
      <button type="button" className="rossie-icon-button" aria-label="Notifications"><Bell size={18}/><span className="rossie-notification-dot"/></button>
    </header>

    <section className="rossie-hero-card">
      <div className="rossie-orb rossie-orb-pink"/>
      <div className="rossie-orb rossie-orb-orange"/>
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="rossie-kicker">Active portfolio</p>
            <p className="rossie-hero-value">{money(totalContractValue)}</p>
          </div>
          <div className="rossie-hero-icon"><CircleDollarSign size={22}/></div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div><p className="text-[11px] text-white/45">Today's attendance</p><p className="mt-1 text-sm font-semibold">{todayStats.present} present · {todayStats.absent} absent</p></div>
          <span className="rossie-status-pill">{completion}% covered</span>
        </div>
        <div className="rossie-progress"><span style={{width:`${Math.min(100,completion)}%`}}/></div>
      </div>
    </section>

    <div className="rossie-section-heading"><div><p className="rossie-kicker">Live overview</p><h2>Operations at a glance</h2></div></div>
    <div className="rossie-stat-grid">
      <button type="button" onClick={()=>setActiveTab("labours")} className="rossie-metric-card metric-cyan"><Users size={18}/><span>Workforce</span><strong>{activeLabours.length}</strong><small>active workers</small></button>
      <button type="button" onClick={()=>setActiveTab("attendance")} className="rossie-metric-card metric-purple"><CalendarCheck size={18}/><span>Attendance</span><strong>{todayStats.present}</strong><small>present today</small></button>
      <button type="button" onClick={()=>setActiveTab("payments")} className="rossie-metric-card metric-pink"><CircleDollarSign size={18}/><span>Payroll</span><strong>{money(totalContractValue)}</strong><small>active contracts</small></button>
      <button type="button" onClick={()=>setActiveTab("advances")} className="rossie-metric-card metric-orange"><Wallet size={18}/><span>Advances</span><strong>{money(outstandingAdvances)}</strong><small>outstanding</small></button>
    </div>

    <section className="rossie-glass-section">
      <div className="rossie-section-heading">
        <div><p className="rossie-kicker">Workforce hub</p><h2>Quick actions</h2></div>
        <Zap size={18} className="text-pink-300"/>
      </div>
      <div className="rossie-action-grid">
        <button type="button" onClick={()=>setActiveTab("attendance")} className="rossie-action-card"><span className="action-icon action-cyan"><CalendarCheck size={18}/></span><span><b>Mark attendance</b><small>Update today's register</small></span><ArrowUpRight size={15}/></button>
        <button type="button" onClick={()=>setActiveTab("contracts")} className="rossie-action-card"><span className="action-icon action-purple"><FileText size={18}/></span><span><b>Contracts</b><small>Open active portfolio</small></span><ArrowUpRight size={15}/></button>
      </div>
    </section>

    <section>
      <div className="rossie-section-heading"><div><p className="rossie-kicker">Portfolio</p><h2>Active contracts</h2></div><button type="button" onClick={()=>setActiveTab("contracts")} className="rossie-text-button">View all</button></div>
      <div className="rossie-list-stack">
        {recent.map((c:any)=><button key={String(c.id)} type="button" onClick={()=>setActiveTab("contracts")} className="rossie-reference-row">
          <span className="row-icon"><FileText size={17}/></span>
          <span className="min-w-0 flex-1 text-left"><b className="truncate">{c.name}</b><small>{c.workColumns?.length||0} work columns · Active</small></span>
          <span className="row-value">{money(Number(c.contractAmount||0))}<ChevronRight size={15}/></span>
        </button>)}
        {recent.length===0&&<div className="rossie-empty-card">No active contracts yet.</div>}
      </div>
    </section>
  </section>;
}

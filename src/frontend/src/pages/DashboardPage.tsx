import { Bell, ChevronRight, FileText, Wallet, Users, CalendarCheck, CreditCard } from "lucide-react";
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
  const todayStats=useMemo(()=>{
    const byLabour=new Map<string,any>();
    for(const r of attendance as any[]){const id=String(r.labourId);byLabour.set(id,r)}
    let present=0,absent=0;
    for(const r of byLabour.values()){if(r.value?.__kind__==="present")present++;if(r.value?.__kind__==="absent")absent++}
    return {present,absent,total:activeLabours.length};
  },[attendance,activeLabours.length]);
  const cards=activeContracts.slice(0,4);
  return <section className="rossie-page rossie-content">
    <div className="flex items-center justify-between mb-5">
      <div><p className="text-xs text-slate-400">Hello,</p><h1 className="text-[24px] font-extrabold tracking-tight">{name||"User"}</h1></div>
      <button className="h-11 w-11 rounded-full border border-white/10 bg-white/5 grid place-items-center"><Bell size={19}/></button>
    </div>
    <div className="rounded-[22px] border border-cyan-300/15 p-4 mb-4" style={{background:"linear-gradient(135deg,rgba(20,48,71,.88),rgba(10,35,53,.72))"}}>
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-cyan-400/15 grid place-items-center text-cyan-300"><CalendarCheck size={20}/></div><div><p className="text-sm font-semibold">Today's Attendance</p><p className="text-[10px] text-slate-400">{new Date().toLocaleDateString()}</p></div></div><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-bold text-emerald-300">{todayStats.present} Present</span></div>
    </div>
    <div className="grid grid-cols-4 gap-2.5 mb-6">
      <div className="rossie-card rossie-stat-blue rounded-2xl p-3"><p className="text-[10px] text-slate-300">Total</p><b className="text-xl">{activeLabours.length}</b></div>
      <div className="rossie-card rossie-stat-green rounded-2xl p-3"><p className="text-[10px] text-slate-300">Present</p><b className="text-xl">{todayStats.present}</b></div>
      <div className="rossie-card rossie-stat-pink rounded-2xl p-3"><p className="text-[10px] text-slate-300">Absent</p><b className="text-xl">{todayStats.absent}</b></div>
      <div className="rossie-card rossie-stat-purple rounded-2xl p-3"><p className="text-[10px] text-slate-300">On leave</p><b className="text-xl">0</b></div>
    </div>
    <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold">Quick Actions</h2></div>
    <div className="grid grid-cols-2 gap-3 mb-7">
      {[
        ["Mark Attendance",CalendarCheck,"attendance","rossie-stat-blue"],
        ["View Contracts",FileText,"contracts","rossie-stat-green"],
        ["Payments",CreditCard,"payments","rossie-stat-purple"],
        ["Advances",Wallet,"advances","rossie-stat-orange"],
      ].map(([label,Icon,tab,cls]:any)=><button key={label} onClick={()=>setActiveTab(tab)} className={`rossie-card ${cls} rounded-2xl p-4 text-left`}><Icon size={20} className="mb-4"/><span className="text-xs font-semibold">{label}</span></button>)}
    </div>
    <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold">Active Contracts</h2><button onClick={()=>setActiveTab("contracts")} className="text-xs font-semibold text-pink-300">See all</button></div>
    <div className="space-y-2.5">
      {cards.map((c:any)=><button key={String(c.id)} onClick={()=>setActiveTab("contracts")} className="rossie-list-row w-full rounded-2xl border p-3 text-left flex items-center gap-3"><div className="h-10 w-10 shrink-0 rounded-xl bg-pink-500/15 text-pink-300 grid place-items-center"><FileText size={18}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{c.name}</p><p className="text-[10px] text-slate-400">Status: Active</p></div><div className="text-right"><p className="text-sm font-bold">{money(Number(c.contractAmount||0))}</p><ChevronRight size={15} className="ml-auto text-slate-500"/></div></button>)}
      {cards.length===0&&<div className="rossie-card rounded-2xl p-5 text-center text-sm text-slate-400">No active contracts yet.</div>}
    </div>
  </section>
}

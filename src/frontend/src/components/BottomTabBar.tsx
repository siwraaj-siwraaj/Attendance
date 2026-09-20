import { BarChart3, CalendarCheck, CreditCard, FileText, Home, MoreHorizontal, ShieldCheck, Users, Wallet, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Tab } from "../types";

interface Props { activeTab: Tab; onTabChange: (tab: Tab) => void; }

export default function BottomTabBar({activeTab,onTabChange}:Props){
  const {allowedTabs,isAdmin}=useAuth();
  const [moreOpen,setMoreOpen]=useState(false);
  const primary: {key:Tab;label:string;icon:any}[]=[
    {key:"dashboard",label:"Dashboard",icon:Home},
    {key:"labours",label:"Workforce",icon:Users},
    {key:"payments",label:"Payroll",icon:CreditCard},
    {key:"settled",label:"Analytics",icon:BarChart3},
  ];
  const more: {key:Tab;label:string;icon:any}[]=[
    {key:"contracts",label:"Contracts",icon:FileText},
    {key:"attendance",label:"Attendance",icon:CalendarCheck},
    {key:"advances",label:"Advances",icon:Wallet},
    ...(isAdmin?[{key:"admin" as Tab,label:"Admin Panel",icon:ShieldCheck}]:[]),
  ];
  return <>
    {moreOpen&&<><button className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" onClick={()=>setMoreOpen(false)} aria-label="Close more menu"/><div className="rossie-more-sheet">
      {more.filter(x=>allowedTabs.includes(x.key)).map(item=>{const Icon=item.icon;return <button key={item.key} className="rossie-more-item" onClick={()=>{setMoreOpen(false);onTabChange(item.key)}}><span className="rossie-more-icon"><Icon size={19}/></span><span className="flex-1 text-sm font-semibold">{item.label}</span><span className="text-slate-500">›</span></button>})}
    </div></>}
    <nav className="rossie-bottom z-50 pointer-events-none" aria-label="Primary navigation">
      <div className="rossie-bottom-shell pointer-events-auto relative overflow-hidden">
        <div className="relative flex h-full items-stretch gap-1 p-1.5">
          {primary.filter(x=>allowedTabs.includes(x.key)).map(item=>{const Icon=item.icon;const active=activeTab===item.key&&!moreOpen;return <button key={item.key} onClick={()=>{setMoreOpen(false);onTabChange(item.key)}} className="rossie-bottom-item relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1" data-active={active} aria-current={active?"page":undefined}><Icon size={19} strokeWidth={active?2.2:1.8} className={active?"text-pink-300":"text-slate-400"}/><span className="rossie-bottom-label text-slate-300">{item.label}</span></button>})}
          <button onClick={()=>setMoreOpen(v=>!v)} className="rossie-bottom-item relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1" data-active={moreOpen}><MoreHorizontal size={19} className={moreOpen?"text-pink-300":"text-slate-400"}/><span className="rossie-bottom-label text-slate-300">More</span></button>
        </div>
      </div>
    </nav>
  </>;
}

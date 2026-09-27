import { useRef, useState, type ReactNode } from "react";
import * as XLSX from "xlsx";
import { ChevronRight, FileText, KeyRound, LogOut, Settings, ShieldCheck, Upload, UserCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { markBackupDownloaded } from "../hooks/useAutoBackupReminder";
import { useChangeOwnPassword, useExportData, useImportData } from "../hooks/useBackend";
import { safeParse, safeStringify } from "../lib/bigintJson";
import { roleLabel } from "../types";
import SettingsPanel from "../components/SettingsPanel";
import ScrollHeaderTitle from "../components/ScrollHeaderTitle";

export default function MorePage() {
  const { mode, activeTab, setActiveTab, logout, role, username, name } = useAuth();
  const exportData = useExportData().mutateAsync;
  const importData = useImportData().mutateAsync;
  const changePasswordMutation = useChangeOwnPassword();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const profileName = name?.trim() || username?.trim() || "User";
  const profileInitial = profileName.charAt(0).toUpperCase();

  const handleExportCSV = async () => {
    markBackupDownloaded();
    try {
      const json = safeParse<any>(await exportData() as string);
      const rows: string[][] = [["Contracts"],["ID","Name","Multiplier","ContractAmount","MachineExpenses","BedAmount","PaperAmount","MeshAmount","Settled"]];
      for (const c of json.contracts || []) rows.push([String(c.id),c.name,String(c.multiplier),String(c.contractAmount),String(c.machineExpenses),String(c.bedAmount),String(c.paperAmount),String(c.meshAmount),String(c.settled)]);
      rows.push([],["Labours"],["ID","Name"]);
      for (const l of json.labours || []) rows.push([String(l.id),l.name]);
      rows.push([],["Advances"],["ID","ContractID","LabourID","Amount","Note"]);
      for (const a of json.advances || []) rows.push([String(a.id),String(a.contractId),String(a.labourId),String(a.amount),a.note]);
      rows.push([],["Attendance"],["ContractID","LabourID","ColumnID","ValueKind","Value"]);
      for (const r of json.attendance || []) { const kind=r.value?.__kind__; rows.push([String(r.contractId),String(r.labourId),r.columnId,kind,kind==="partial"?String(r.value?.partial??""):kind]); }
      const csv=rows.map(r=>r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
      const a=document.createElement("a"); const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.href=url; a.download=`rossie-export-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  const handleExportExcel = async () => {
    markBackupDownloaded();
    try {
      const json=safeParse<any>(await exportData() as string);
      const contractMap=new Map<string,string>((json.contracts||[]).map((c:any)=>[String(c.id),c.name||""]));
      const labourMap=new Map<string,string>((json.labours||[]).map((l:any)=>[String(l.id),l.name||""]));
      const wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Contract Name","Multiplier","Contract Amount","Bed Amount","Paper Amount","Mesh Amount","Machine Expenses"],...(json.contracts||[]).map((c:any)=>[c.name||"",c.multiplier??"",c.contractAmount??"",c.bedAmount??"",c.paperAmount??"",c.meshAmount??"",c.machineExpenses??""])]),"Contracts");
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Name","Employee ID","Join Date","Status"],...(json.labours||[]).map((l:any)=>[l.name||"",l.employeeId||"",l.joinDate||"",l.active===false?"Inactive":"Active"])]),"Labours");
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Labour Name","Contract Name","Amount","Note","Cleared"],...(json.advances||[]).map((a:any)=>[labourMap.get(String(a.labourId))||String(a.labourId),contractMap.get(String(a.contractId))||String(a.contractId),a.amount??"",a.note||"",a.cleared?"Yes":"No"])]),"Advances");
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Contract Name","Labour Name","Column Name","Value"],...(json.attendance||[]).map((r:any)=>{const k=r.value?.__kind__; return [contractMap.get(String(r.contractId))||String(r.contractId),labourMap.get(String(r.labourId))||String(r.labourId),r.columnId||"",k==="partial"?String(r.value?.partial??""):k||""]})]),"Attendance");
      XLSX.writeFile(wb,`rossie-export-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch {}
  };

  const handleImportCSV=(file:File)=>{
    const reader=new FileReader();
    reader.onload=async()=>{
      try {
        const lines=String(reader.result).split("\n").map(l=>l.trim()).filter(Boolean);
        const contracts:any[]=[],labours:any[]=[],advances:any[]=[],attendance:any[]=[];
        let section="",headerSkipped=false;
        for(const line of lines){
          const cols=line.split(",").map(c=>c.trim().replace(/^"|"$/g,"").replace(/""/g,'"'));
          if(cols.length===1 && ["Contracts","Labours","Advances","Attendance"].includes(cols[0])){section=cols[0];headerSkipped=false;continue;}
          if(!headerSkipped){headerSkipped=true;continue;}
          if(section==="Contracts"&&cols.length>=8) contracts.push({id:BigInt(cols[0]),name:cols[1],multiplier:Number(cols[2]),contractAmount:Number(cols[3]),machineExpenses:Number(cols[4]),bedAmount:Number(cols[5]),paperAmount:Number(cols[6]),meshAmount:Number(cols[7]),settled:cols[8]==="true",workColumns:[],createdAt:BigInt(Date.now())*BigInt(1000000)});
          else if(section==="Labours"&&cols.length>=2) labours.push({id:BigInt(cols[0]),name:cols[1],createdAt:BigInt(Date.now())*BigInt(1000000)});
          else if(section==="Advances"&&cols.length>=5) advances.push({id:BigInt(cols[0]),contractId:BigInt(cols[1]),labourId:BigInt(cols[2]),amount:Number(cols[3]),note:cols[4],createdAt:BigInt(Date.now())*BigInt(1000000)});
          else if(section==="Attendance"&&cols.length>=5){const k=cols[3];const v=k==="present"?{__kind__:"present",present:null}:k==="absent"?{__kind__:"absent",absent:null}:{__kind__:"partial",partial:Number(cols[4])||0};attendance.push({contractId:BigInt(cols[0]),labourId:BigInt(cols[1]),columnId:cols[2],value:v});}
        }
        await importData(safeStringify({contracts,labours,advances,attendance}));
        window.location.reload();
      } catch {}
    };
    reader.readAsText(file);
  };

  const handleChangePassword=()=>{
    if(newPassword.length<6){setPasswordMessage("Password must be at least 6 characters.");return;}
    if(newPassword!==confirmNewPassword){setPasswordMessage("Passwords do not match.");return;}
    setPasswordMessage(null);
    changePasswordMutation.mutate(newPassword,{onSuccess:()=>{setNewPassword("");setConfirmNewPassword("");setChangePasswordOpen(false);setPasswordMessage("Password changed successfully.");setTimeout(()=>setPasswordMessage(null),2500);},onError:(e:any)=>setPasswordMessage(e?.message??"Could not change password.")});
  };

  const menuItem = (icon: ReactNode, title: string, description: string, onClick: () => void, danger = false) => (
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-2xl border border-[#101828]/10 bg-[#F8FAFC] p-3 text-left transition-all hover:border-[#F97316]/25 hover:shadow-sm active:scale-[0.99]" data-ocid={`more.${title.toLowerCase().replaceAll(" ","_")}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-red-50 text-red-500" : "bg-[#F97316]/10 text-[#F97316]"}`}>{icon}</span>
      <span className="min-w-0 flex-1"><span className={`block text-sm font-bold ${danger ? "text-red-600" : "text-[#101828]"}`}>{title}</span><span className="mt-0.5 block text-[11px] text-white/70">{description}</span></span>
      {!danger && <ChevronRight size={17} className="shrink-0 text-[#101828]/65 transition-transform group-hover:translate-x-0.5 group-hover:text-[#F97316]" />}
    </button>
  );

  return (
    <div className="min-h-full bg-[#F8FAFC] pb-28 text-[#101828]">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <header className="relative shrink-0 overflow-hidden rounded-b-[28px] bg-[#172536] px-5 pb-5 pt-5 text-white shadow-sm">
          <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#F97316]/20 blur-3xl"/>
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><Settings size={20}/></div>
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300">Rossie</p><ScrollHeaderTitle title="More" className="text-3xl" /><p className="mt-1 max-w-xl text-xs leading-5 text-white/55">Account, management and app tools</p></div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[26px] border border-[#101828]/10 bg-white p-4 shadow-sm">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#F97316]/10"/>
          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#101828] text-white shadow-md"><UserCircle size={29}/></div>
            <div className="min-w-0 flex-1"><p className="truncate text-lg font-extrabold">{profileName}</p><p className="mt-0.5 text-xs font-semibold text-[#F97316]">{role ? roleLabel(role) : "Account"}</p><p className="mt-1 truncate text-[11px] text-[#101828]/65">{username || "Mobile number not available"}</p></div>
            <span className="hidden rounded-full bg-[#F97316]/10 px-3 py-1 text-[10px] font-bold text-[#F97316] sm:block">SIGNED IN</span>
          </div>
        </section>

        <section className="rounded-[26px] border border-[#101828]/10 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3 px-2 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316]"><KeyRound size={17}/></div>
            <div><p className="text-sm font-extrabold text-[#101828]">Security</p><p className="text-[11px] text-[#101828]/65">Keep your account protected</p></div>
          </div>
          {menuItem(<KeyRound size={18}/>,"Change password","Update your Rossie login password",()=>{setPasswordMessage(null);setChangePasswordOpen(v=>!v);})}
          {changePasswordOpen && <div className="mt-2 rounded-2xl border border-[#F97316]/20 bg-[#F97316]/5 p-3 space-y-2">
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-3 py-3 text-sm text-[#101828] outline-none focus:border-[#F97316]/60" autoComplete="new-password"/>
            <input type="password" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} placeholder="Confirm password" className="w-full rounded-xl border border-[#101828]/10 bg-[#F8FAFC] px-3 py-3 text-sm text-[#101828] outline-none focus:border-[#F97316]/60" autoComplete="new-password"/>
            {passwordMessage&&<p className="text-[11px] font-medium text-red-500">{passwordMessage}</p>}
            <button type="button" onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="w-full rounded-xl bg-[#F97316] py-3 text-xs font-bold text-white shadow-md shadow-orange-200 disabled:opacity-50">{changePasswordMutation.isPending?"Changing…":"Save password"}</button>
          </div>}
        </section>

        {mode !== "view" && <section className="rounded-[26px] border border-[#101828]/10 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3 px-2 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316]"><ShieldCheck size={17}/></div>
            <div><p className="text-sm font-extrabold">Management</p><p className="text-[11px] text-[#101828]/65">Administration and data tools</p></div>
          </div>
          <div className="space-y-2">
            {menuItem(<ShieldCheck size={18}/>,activeTab==="admin"?"Close Admin Panel":"Admin Panel","Manage accounts and permissions",()=>setActiveTab(activeTab==="admin"?"contracts":"admin"))}
            {menuItem(<FileText size={18}/>,"Export CSV","Download a portable backup",handleExportCSV)}
            {menuItem(<FileText size={18}/>,"Export Excel","Download a spreadsheet backup",handleExportExcel)}
            {menuItem(<Upload size={18}/>,"Import CSV","Restore compatible Rossie data",()=>csvInputRef.current?.click())}
          </div>
        </section>}

        {mode !== "view" && <section className="rounded-[26px] border border-[#101828]/10 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3 px-2 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316]"><Settings size={17}/></div>
            <div><p className="text-sm font-extrabold">App settings</p><p className="text-[11px] text-[#101828]/65">Application preferences</p></div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#101828]/10 bg-[#F8FAFC]"><SettingsPanel /></div>
        </section>}

        <section className="rounded-[26px] border border-red-100 bg-white p-3 shadow-sm">
          <div className="px-2 pb-3"><p className="text-sm font-extrabold text-[#101828]">Session</p><p className="text-[11px] text-[#101828]/65">Finish using Rossie on this device</p></div>
          {menuItem(<LogOut size={18}/>,"Logout","Sign out of this Rossie account",logout,true)}
        </section>
      </div>
      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)handleImportCSV(file);e.target.value="";}} />
    </div>
  );
}

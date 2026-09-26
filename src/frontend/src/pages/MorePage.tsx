import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileText, KeyRound, LogOut, Settings, ShieldCheck, Upload, UserCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { markBackupDownloaded } from "../hooks/useAutoBackupReminder";
import { useChangeOwnPassword, useExportData, useImportData } from "../hooks/useBackend";
import { safeParse, safeStringify } from "../lib/bigintJson";
import { roleLabel } from "../types";
import SettingsPanel from "../components/SettingsPanel";

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
      const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`rossie-export-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
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

  return <div className="h-full overflow-y-auto px-4 pt-5 pb-24">
    <div className="mx-auto w-full max-w-2xl space-y-3">
      <div><h1 className="text-2xl font-bold text-white">More</h1><p className="mt-1 text-sm text-white/45">Account, settings and tools</p></div>
      <div className="rounded-2xl border border-white/10 bg-[#11192b] overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/60 bg-[#17263c] text-base font-bold text-white">{profileInitial}</div>
          <div className="min-w-0"><p className="truncate text-base font-bold text-white">{profileName}</p>{role&&<p className="text-xs text-orange-300/80">{roleLabel(role)}</p>}</div>
        </div>
        <div className="p-3 space-y-2">
          <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Mobile number</p><p className="mt-1 text-sm font-semibold text-white">{username||"Not available"}</p></div>
          <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Gender</p><p className="mt-1 text-sm font-semibold text-white">Not set</p></div>
          <button type="button" onClick={()=>{setPasswordMessage(null);setChangePasswordOpen(v=>!v)}} className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 text-left text-sm font-semibold text-white" data-ocid="more.change_password"><KeyRound size={18} className="text-orange-400"/><span>Change password</span></button>
          {changePasswordOpen&&<div className="rounded-xl border border-orange-400/15 bg-orange-500/[0.04] p-3 space-y-2"><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" autoComplete="new-password"/><input type="password" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} placeholder="Confirm password" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" autoComplete="new-password"/>{passwordMessage&&<p className="text-[11px] text-orange-200">{passwordMessage}</p>}<button type="button" onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="w-full rounded-lg bg-orange-500 py-2 text-xs font-bold text-white disabled:opacity-50">{changePasswordMutation.isPending?"Changing…":"Save password"}</button></div>}
        </div>
      </div>
      {mode!=="view"&&<div className="rounded-2xl border border-white/10 bg-[#11192b] p-3 space-y-1">
        <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Account & settings</p>
        <button type="button" onClick={()=>setActiveTab(activeTab==="admin"?"contracts":"admin")} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium text-white hover:bg-white/5" data-ocid="more.admin_panel"><ShieldCheck size={18} className="text-orange-400"/><span>{activeTab==="admin"?"Close Admin Panel":"Admin Panel"}</span></button>
        <button type="button" onClick={handleExportCSV} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium text-white hover:bg-white/5" data-ocid="more.export_csv"><FileText size={18}/><span>Export CSV</span></button>
        <button type="button" onClick={handleExportExcel} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium text-white hover:bg-white/5" data-ocid="more.export_excel"><FileText size={18}/><span>Export Excel</span></button>
        <button type="button" onClick={()=>csvInputRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium text-white hover:bg-white/5" data-ocid="more.import_csv"><Upload size={18}/><span>Import CSV</span></button>
        <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImportCSV(f);e.currentTarget.value=""}}/>
        <div className="my-3 border-t border-white/10"/>
        <div className="flex items-center gap-2 px-2.5 pb-2"><Settings size={15} className="text-orange-400"/><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/80">Settings</p></div>
        <SettingsPanel />
      </div>}
      <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-3 py-3 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10" data-ocid="more.logout"><LogOut size={18}/><span>Logout</span></button>
    </div>
  </div>;
}

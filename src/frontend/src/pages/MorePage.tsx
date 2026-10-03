import { useRef, useState, type ReactNode } from "react";
import * as XLSX from "xlsx";
import { FileSharer } from "@capgo/capacitor-file-sharer";
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

  const textToBase64 = (value: string) => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const saveExportFile = async (filename: string, contentType: string, base64Data: string) => {
    await FileSharer.save({
      filename,
      contentType,
      base64Data,
      android: { saveDirectory: "downloads", relativePath: "Download/ShiWise" },
    });
    markBackupDownloaded();
  };

  const handleExportCSV = async () => {
    try {
      const json = safeParse<any>(await exportData() as string);
      const rows: string[][] = [["Contracts"],["ID","Name","Multiplier","ContractAmount","MachineExpenses","BedAmount","PaperAmount","MeshAmount","Settled"]];
      for (const contract of json.contracts || []) rows.push([String(contract.id),contract.name,String(contract.multiplier),String(contract.contractAmount),String(contract.machineExpenses),String(contract.bedAmount),String(contract.paperAmount),String(contract.meshAmount),String(contract.settled)]);
      rows.push([],["Labours"],["ID","Name"]);
      for (const labour of json.labours || []) rows.push([String(labour.id),labour.name]);
      rows.push([],["Advances"],["ID","ContractID","LabourID","Amount","Note"]);
      for (const advance of json.advances || []) rows.push([String(advance.id),String(advance.contractId),String(advance.labourId),String(advance.amount),advance.note]);
      rows.push([],["Attendance"],["ContractID","LabourID","ColumnID","ValueKind","Value"]);
      for (const record of json.attendance || []) {
        const kind = record.value?.__kind__;
        rows.push([String(record.contractId),String(record.labourId),record.columnId,kind,kind === "partial" ? String(record.value?.partial ?? "") : kind]);
      }
      const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
      await saveExportFile(`shiwise-backup-${new Date().toISOString().slice(0,10)}.csv`, "text/csv", textToBase64(csv));
    } catch (error) {
      console.error("ShiWise CSV export failed", error);
      window.alert("Export failed. Please try again.");
    }
  };

  const handleExportExcel = async () => {
    try {
      const json = safeParse<any>(await exportData() as string);
      const contractMap=new Map<string,string>((json.contracts||[]).map((contract:any)=>[String(contract.id),contract.name||""]));
      const labourMap=new Map<string,string>((json.labours||[]).map((labour:any)=>[String(labour.id),labour.name||""]));
      const wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Contract Name","Multiplier","Contract Amount","Bed Amount","Paper Amount","Mesh Amount","Machine Expenses"],...(json.contracts||[]).map((contract:any)=>[contract.name||"",contract.multiplier??"",contract.contractAmount??"",contract.bedAmount??"",contract.paperAmount??"",contract.meshAmount??"",contract.machineExpenses??""])]),"Contracts");
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Name","Employee ID","Join Date","Status"],...(json.labours||[]).map((labour:any)=>[labour.name||"",labour.employeeId||"",labour.joinDate||"",labour.active===false?"Inactive":"Active"])]),"Labours");
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Labour Name","Contract Name","Amount","Note","Cleared"],...(json.advances||[]).map((advance:any)=>[labourMap.get(String(advance.labourId))||String(advance.labourId),contractMap.get(String(advance.contractId))||String(advance.contractId),advance.amount??"",advance.note||"",advance.cleared?"Yes":"No"])]),"Advances");
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Contract Name","Labour Name","Column Name","Value"],...(json.attendance||[]).map((record:any)=>{const kind=record.value?.__kind__;return [contractMap.get(String(record.contractId))||String(record.contractId),labourMap.get(String(record.labourId))||String(record.labourId),record.columnId||"",kind==="partial"?String(record.value?.partial??""):kind||""]})]),"Attendance");
      const base64 = XLSX.write(wb,{bookType:"xlsx",type:"base64"});
      await saveExportFile(`shiwise-backup-${new Date().toISOString().slice(0,10)}.xlsx`,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",base64);
    } catch (error) {
      console.error("ShiWise Excel export failed", error);
      window.alert("Export failed. Please try again.");
    }
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
    <div className="flex flex-col bg-[#F8FAFC] pb-32 text-[#101828]">
      <div className="mx-auto w-full max-w-5xl">
        <header className="app-tab-header relative overflow-hidden rounded-b-[28px] bg-[#172536] px-4 py-5 text-white shadow-sm sm:px-6">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-300"><Settings className="h-3.5 w-3.5" /> Rossie</p>
              <ScrollHeaderTitle title="More" className="text-2xl" />
              <p className="mt-0.5 text-[11px] leading-4 text-white/55">Account, management and app tools.</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-orange-300"><UserCircle className="h-5 w-5" /></div>
          </div>
        </header>

        <main className="space-y-4 px-4 pb-32 pt-4 sm:px-6">
          <section className="rounded-3xl border bg-white p-4 shadow-sm" style={{ borderColor: "#E4E7EC" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#101828] text-white"><UserCircle className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-extrabold text-[#101828]">{profileName}</p>
                <p className="mt-0.5 text-xs font-bold text-orange-500">{role ? roleLabel(role) : "Account"}</p>
                <p className="mt-1 truncate text-[11px] text-[#667085]">{username || "Mobile number not available"}</p>
              </div>
              <span className="hidden rounded-full bg-orange-50 px-3 py-1 text-[9px] font-extrabold text-orange-600 sm:block">SIGNED IN</span>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-3 shadow-sm" style={{ borderColor: "#E4E7EC" }}>
            <div className="flex items-center gap-3 px-2 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><KeyRound className="h-4 w-4" /></div>
              <div><h2 className="text-sm font-extrabold">Security</h2><p className="text-[11px] text-[#667085]">Protect your Rossie account</p></div>
            </div>
            {menuItem(<KeyRound className="h-4 w-4" />,"Change password","Update your login password",()=>{setPasswordMessage(null);setChangePasswordOpen(v=>!v);})}
            {changePasswordOpen && (
              <div className="mt-2 space-y-2 rounded-2xl border border-orange-100 bg-orange-50/50 p-3">
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-3 text-sm outline-none focus:border-orange-400" autoComplete="new-password" />
                <input type="password" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} placeholder="Confirm password" className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-3 text-sm outline-none focus:border-orange-400" autoComplete="new-password" />
                {passwordMessage && <p className="text-[11px] font-semibold text-red-500">{passwordMessage}</p>}
                <button type="button" onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="w-full rounded-xl bg-orange-500 py-3 text-xs font-extrabold text-white disabled:opacity-50">{changePasswordMutation.isPending ? "Changing…" : "Save password"}</button>
              </div>
            )}
          </section>

          {mode !== "view" && (
            <>
              <section className="rounded-3xl border bg-white p-3 shadow-sm" style={{ borderColor: "#E4E7EC" }}>
                <div className="flex items-center gap-3 px-2 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><ShieldCheck className="h-4 w-4" /></div>
                  <div><h2 className="text-sm font-extrabold">Management</h2><p className="text-[11px] text-[#667085]">Administration and data tools</p></div>
                </div>
                <div className="space-y-2">
                  {menuItem(<ShieldCheck className="h-4 w-4" />,activeTab==="admin"?"Close Admin Panel":"Admin Panel","Manage accounts and permissions",()=>setActiveTab(activeTab==="admin"?"contracts":"admin"))}
                  {menuItem(<FileText className="h-4 w-4" />,"Export CSV","Download a portable backup",handleExportCSV)}
                  {menuItem(<FileText className="h-4 w-4" />,"Export Excel","Download a spreadsheet backup",handleExportExcel)}
                  {menuItem(<Upload className="h-4 w-4" />,"Import CSV","Restore compatible Rossie data",()=>csvInputRef.current?.click())}
                </div>
              </section>

              <section className="rounded-3xl border bg-white p-3 shadow-sm" style={{ borderColor: "#E4E7EC" }}>
                <div className="flex items-center gap-3 px-2 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Settings className="h-4 w-4" /></div>
                  <div><h2 className="text-sm font-extrabold">App settings</h2><p className="text-[11px] text-[#667085]">Application preferences</p></div>
                </div>
                <div className="overflow-hidden rounded-2xl border bg-[#F8FAFC]" style={{ borderColor: "#E4E7EC" }}><SettingsPanel /></div>
              </section>
            </>
          )}

          <section className="rounded-3xl border border-red-100 bg-white p-3 shadow-sm">
            <div className="px-2 pb-3"><h2 className="text-sm font-extrabold">Session</h2><p className="text-[11px] text-[#667085]">Finish using Rossie on this device</p></div>
            {menuItem(<LogOut className="h-4 w-4" />,"Logout","Sign out of this Rossie account",logout,true)}
          </section>
        </main>
      </div>
      <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)handleImportCSV(file);e.target.value="";}} />
    </div>
  );

}

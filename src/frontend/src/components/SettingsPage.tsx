import {
  ArrowLeft, Bell, ChevronRight, CircleHelp, Download, Info, KeyRound, LogOut,
  Settings, ShieldCheck, Upload, User, UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useChangeOwnPassword, useExportData, useImportData } from "../hooks/useBackend";
import { requestNotificationPermission, showAppNotification } from "../hooks/nativeNotifications";
import { safeParse, safeStringify } from "../lib/bigintJson";
import { roleLabel } from "../types";

interface SettingsPageProps { onBack: () => void; }

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { username, name, role, isAdmin, setActiveTab, logout } = useAuth();
  const exportMutation = useExportData();
  const importMutation = useImportData();
  const changePasswordMutation = useChangeOwnPassword();
  const [bedBase, setBedBase] = useState(() => localStorage.getItem("rossie_bed_base") ?? "");
  const [paperBase, setPaperBase] = useState(() => localStorage.getItem("rossie_paper_base") ?? "");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const n = Number(bedBase);
    if (Number.isFinite(n) && n > 0) localStorage.setItem("rossie_bed_base", String(n));
  }, [bedBase]);
  useEffect(() => {
    const n = Number(paperBase);
    if (Number.isFinite(n) && n > 0) localStorage.setItem("rossie_paper_base", String(n));
  }, [paperBase]);

  const savePreferences = () => {
    const b = Number(bedBase), p = Number(paperBase);
    if (Number.isFinite(b) && b > 0) localStorage.setItem("rossie_bed_base", String(b));
    if (Number.isFinite(p) && p > 0) localStorage.setItem("rossie_paper_base", String(p));
    setSaved(true); window.setTimeout(() => setSaved(false), 1500);
  };

  const changePassword = () => {
    if (newPassword.length < 6) { setPasswordMessage("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage("Passwords do not match."); return; }
    setPasswordMessage(null);
    changePasswordMutation.mutate(newPassword, {
      onSuccess: () => {
        setNewPassword(""); setConfirmPassword(""); setPasswordOpen(false);
        setPasswordMessage("Password changed successfully.");
        window.setTimeout(() => setPasswordMessage(null), 1800);
      },
      onError: (error: any) => setPasswordMessage(error?.message ?? "Could not change password."),
    });
  };

  const exportData = async (format: "csv" | "excel") => {
    try {
      const data = await exportMutation.mutateAsync();
      const json = safeParse<any>(data as string);
      if (format === "csv") {
        const rows: string[][] = [
          ["Contracts"], ["ID","Name","Multiplier","ContractAmount","MachineExpenses","BedAmount","PaperAmount","MeshAmount","Settled"],
          ...(json.contracts || []).map((c: any) => [String(c.id),c.name||"",String(c.multiplier??""),String(c.contractAmount??""),String(c.machineExpenses??""),String(c.bedAmount??""),String(c.paperAmount??""),String(c.meshAmount??""),String(c.settled??"")]),
          [], ["Labours"], ["ID","Name"], ...(json.labours || []).map((l: any) => [String(l.id),l.name||""]),
          [], ["Advances"], ["ID","ContractID","LabourID","Amount","Note"], ...(json.advances || []).map((a: any) => [String(a.id),String(a.contractId),String(a.labourId),String(a.amount??""),a.note||""]),
          [], ["Attendance"], ["ContractID","LabourID","ColumnID","ValueKind","Value"], ...(json.attendance || []).map((a: any) => [String(a.contractId),String(a.labourId),a.columnId||"",a.value?.__kind__||"",String(a.value?.partial??"")]),
        ];
        const csv = rows.map(r => r.map(cell => '"' + String(cell).replace(/"/g,'""') + '"').join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
        const a = document.createElement("a"); a.href = url; a.download = "rossie-export-" + new Date().toISOString().slice(0,10) + ".csv"; a.click(); URL.revokeObjectURL(url);
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name"],...(json.labours||[]).map((l:any)=>[l.name||""])]),"Labours");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name","Amount"],...(json.contracts||[]).map((c:any)=>[c.name||"",c.contractAmount??""])]),"Contracts");
        XLSX.writeFile(wb, "rossie-export-" + new Date().toISOString().slice(0,10) + ".xlsx");
      }
      void showAppNotification("Rossie", "Data exported as " + (format === "csv" ? "CSV" : "Excel") + ".");
    } catch { void showAppNotification("Rossie", "Could not export data."); }
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const lines = String(reader.result).split("\n").map(l=>l.trim()).filter(Boolean);
        const contracts: unknown[] = [], labours: unknown[] = [], advances: unknown[] = [], attendance: unknown[] = [];
        let section = "", headerSkipped = false;
        for (const line of lines) {
          const cols = line.split(",").map(c=>c.trim().replace(/^"|"$/g,"").replace(/""/g,'"'));
          if (cols.length === 1 && ["Contracts","Labours","Advances","Attendance"].includes(cols[0])) { section=cols[0]; headerSkipped=false; continue; }
          if (!headerSkipped) { headerSkipped=true; continue; }
          if (section==="Contracts" && cols.length>=8) contracts.push({id:BigInt(cols[0]),name:cols[1],multiplier:Number(cols[2]),contractAmount:Number(cols[3]),machineExpenses:Number(cols[4]),bedAmount:Number(cols[5]),paperAmount:Number(cols[6]),meshAmount:Number(cols[7]),settled:cols[8]==="true",workColumns:[],createdAt:BigInt(Date.now())*BigInt(1000000)});
          else if (section==="Labours" && cols.length>=2) labours.push({id:BigInt(cols[0]),name:cols[1],createdAt:BigInt(Date.now())*BigInt(1000000)});
          else if (section==="Advances" && cols.length>=5) advances.push({id:BigInt(cols[0]),contractId:BigInt(cols[1]),labourId:BigInt(cols[2]),amount:Number(cols[3]),note:cols[4],createdAt:BigInt(Date.now())*BigInt(1000000)});
          else if (section==="Attendance" && cols.length>=5) {
            const kind=cols[3];
            const value=kind==="present"?{__kind__:"present",present:null}:kind==="absent"?{__kind__:"absent",absent:null}:{__kind__:"partial",partial:Number(cols[4])||0};
            attendance.push({contractId:BigInt(cols[0]),labourId:BigInt(cols[1]),columnId:cols[2],value});
          }
        }
        await importMutation.mutateAsync(safeStringify({contracts,labours,advances,attendance}));
        void showAppNotification("Rossie","CSV imported successfully."); onBack();
        window.setTimeout(()=>window.location.reload(),200);
      } catch { void showAppNotification("Rossie","Could not import that CSV file."); }
    };
    reader.readAsText(file);
  };

  const profileName = name?.trim() || username?.trim() || "User";
  const initial = profileName.charAt(0).toUpperCase();

  return <div className="relative min-h-full overflow-y-auto bg-[#f5f9ff] text-[#10265d]" data-no-tab-swipe data-ocid="settings.page">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden">
      <div className="absolute -left-24 top-32 h-64 w-64 rounded-full bg-[#e8f2ff]"/>
      <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#eaf3ff]"/>
      <div className="absolute right-[-70px] top-44 h-48 w-48 rounded-full bg-[#ffe7bd]"/>
    </div>
    <div className="relative mx-auto w-full max-w-[680px] px-5 pb-10 sm:px-8">
      <header className="flex items-center gap-5 pb-4 pt-[max(18px,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} className="flex h-10 w-10 items-center justify-center text-[#10265d]" aria-label="Back" data-ocid="settings.back_button"><ArrowLeft size={29}/></button>
        <h1 className="text-[27px] font-extrabold tracking-tight">Settings</h1>
      </header>
      <div className="flex flex-col items-center pb-7 pt-1">
        <div className="flex h-[70px] w-[70px] items-center justify-center rounded-[19px] bg-gradient-to-br from-[#ffb11b] to-[#ff7b20] text-white shadow-[0_10px_22px_rgba(255,143,29,.25)]"><Settings size={38}/></div>
        <h2 className="mt-2 text-[34px] font-extrabold tracking-tight">Rossie</h2><p className="text-[15px] font-medium text-[#45659b]">v1.0.0</p>
      </div>
      <section className="overflow-hidden rounded-[20px] border border-[#c9ddfa] bg-white/90 shadow-[0_7px_25px_rgba(53,101,160,.08)]">
        <button type="button" className="flex w-full items-center gap-4 border-b border-[#e3ebf7] px-5 py-4 text-left" data-ocid="settings.profile_row">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2f7bf4] text-[18px] font-bold text-white">{initial}</span>
          <span className="min-w-0 flex-1"><strong className="block text-[18px] font-bold">{profileName}</strong><span className="text-[15px] text-[#45659b]">{role ? roleLabel(role) : "User"}</span></span><ChevronRight size={23} className="text-[#4b70a7]"/>
        </button>
        <SettingRow icon={<User size={24}/>} label="My Profile" onClick={()=>setPasswordOpen(false)} dataOcid="settings.my_profile_row"/>
        <SettingRow icon={<KeyRound size={24}/>} label="Change Password" onClick={()=>{setPasswordOpen(v=>!v);setPasswordMessage(null)}} dataOcid="settings.change_password_row"/>
        {passwordOpen && <div className="border-b border-[#e3ebf7] bg-[#f7fbff] px-5 py-4"><div className="space-y-2.5">
          <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" autoComplete="new-password" className="w-full rounded-xl border border-[#c9ddfa] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#2f7bf4]"/>
          <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" className="w-full rounded-xl border border-[#c9ddfa] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#2f7bf4]"/>
          {passwordMessage && <p className="text-xs font-semibold text-[#d65b45]">{passwordMessage}</p>}
          <button type="button" onClick={changePassword} disabled={changePasswordMutation.isPending} className="w-full rounded-xl bg-[#2f7bf4] py-3 text-sm font-bold text-white disabled:opacity-50">{changePasswordMutation.isPending?"Saving…":"Save password"}</button>
        </div></div>}
        {isAdmin && <SettingRow icon={<UserCog size={24}/>} label="User Management" onClick={()=>setActiveTab("admin")} dataOcid="settings.user_management_row"/>}
        <SettingRow icon={<Settings size={24}/>} label="App Preferences" onClick={()=>setPreferencesOpen(v=>!v)} dataOcid="settings.preferences_row"/>
        {preferencesOpen && <div className="border-b border-[#e3ebf7] bg-[#f7fbff] px-5 py-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#45659b]">Default Multiplier Amounts</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[#45659b]">Bed Base (₹)<input type="number" value={bedBase} onChange={e=>setBedBase(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#c9ddfa] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2f7bf4]" data-ocid="settings.bed_base_input"/></label>
            <label className="text-xs font-semibold text-[#45659b]">Paper Base (₹)<input type="number" value={paperBase} onChange={e=>setPaperBase(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#c9ddfa] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2f7bf4]" data-ocid="settings.paper_base_input"/></label>
          </div>
          <button type="button" onClick={savePreferences} className="mt-3 w-full rounded-xl bg-[#2f7bf4] py-2.5 text-sm font-bold text-white">{saved?"Saved ✓":"Save Defaults"}</button>
        </div>}
        <SettingRow icon={<Bell size={24}/>} label="Notifications" onClick={()=>void requestNotificationPermission()} dataOcid="settings.notifications_row"/>
        <SettingRow icon={<CircleHelp size={24}/>} label="Help & Support" onClick={()=>setHelpOpen(v=>!v)} dataOcid="settings.help_row"/>
        {helpOpen && <div className="border-b border-[#e3ebf7] bg-[#f7fbff] px-5 py-4 text-sm leading-6 text-[#45659b]">For account access, approvals, attendance or contract issues, contact the Rossie administrator.</div>}
        <SettingRow icon={<Info size={24}/>} label="About" onClick={()=>setAboutOpen(v=>!v)} dataOcid="settings.about_row"/>
        {aboutOpen && <div className="border-b border-[#e3ebf7] bg-[#f7fbff] px-5 py-4 text-sm text-[#45659b]">Rossie · Construction Labour Management · Version 1.0.0</div>}
        <SettingRow icon={<Download size={24}/>} label="Export Data" onClick={()=>void exportData("excel")} dataOcid="settings.export_row"/>
        <label className="flex min-h-[60px] cursor-pointer items-center gap-4 px-5 text-[#10265d]"><span className="w-7"><Upload size={24}/></span><span className="flex-1 text-[17px] font-medium">Import CSV</span><ChevronRight size={22} className="text-[#4b70a7]"/><input type="file" accept=".csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)importCsv(file);e.currentTarget.value=""}} data-ocid="settings.import_csv_input"/></label>
      </section>
      <button type="button" onClick={logout} className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-[15px] border border-[#ffd6d0] bg-[#fff0ee] text-[17px] font-semibold text-[#ed352a]" data-ocid="settings.logout"><LogOut size={24}/> Logout</button>
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 -z-0 h-28 overflow-hidden"><div className="absolute -left-16 bottom-[-78px] h-36 w-72 rotate-[6deg] rounded-[50%] bg-[#ffd99f]"/><div className="absolute right-[-90px] bottom-[-70px] h-32 w-96 -rotate-[9deg] rounded-[50%] bg-[#cfe1ff]"/></div>
    </div>
  </div>;
}

function SettingRow({icon,label,onClick,dataOcid}:{icon:React.ReactNode;label:string;onClick:()=>void;dataOcid:string}) {
  return <button type="button" onClick={onClick} className="flex min-h-[60px] w-full items-center gap-4 border-b border-[#e3ebf7] px-5 text-left text-[#10265d] transition-colors hover:bg-[#f7fbff] active:bg-[#eef6ff]" data-ocid={dataOcid}><span className="w-7">{icon}</span><span className="flex-1 text-[17px] font-medium">{label}</span><ChevronRight size={22} className="text-[#4b70a7]"/></button>;
}

import React, { useState } from "react";
import {
  ArrowRight, Bell, Calendar, CalendarDays, ChevronLeft, ChevronRight,
  DollarSign, FileText, Home, LogOut, Lock, MoreHorizontal, Search, Shield,
  User
} from "lucide-react";

type Screen =
  | "splash" | "signin" | "signup" | "request_sent" | "dashboard"
  | "contracts" | "attendance" | "labour_details" | "payments"
  | "advances" | "admin" | "profile";

type ScreenProps = { setCurrentScreen: (screen: Screen) => void };

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [activeTab, setActiveTab] = useState("home");

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
    if (["dashboard", "contracts", "payments", "profile"].includes(screen)) {
      setActiveTab(screen === "dashboard" ? "home" : screen);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "splash": return <SplashScreen setCurrentScreen={navigate} />;
      case "signin": return <SignInScreen setCurrentScreen={navigate} />;
      case "signup": return <SignUpScreen setCurrentScreen={navigate} />;
      case "request_sent": return <RequestSentScreen setCurrentScreen={navigate} />;
      case "contracts": return <ContractsScreen setCurrentScreen={navigate} />;
      case "attendance": return <AttendanceScreen setCurrentScreen={navigate} />;
      case "labour_details": return <LabourDetailsScreen setCurrentScreen={navigate} />;
      case "payments": return <PaymentsScreen setCurrentScreen={navigate} />;
      case "advances": return <AdvancesScreen setCurrentScreen={navigate} />;
      case "admin": return <AdminPanelScreen setCurrentScreen={navigate} />;
      case "profile": return <ProfileScreen setCurrentScreen={navigate} />;
      default: return <DashboardScreen setCurrentScreen={navigate} />;
    }
  };

  const goTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") setCurrentScreen("dashboard");
    if (tab === "contracts") setCurrentScreen("contracts");
    if (tab === "payments") setCurrentScreen("payments");
    if (tab === "profile") setCurrentScreen("profile");
  };

  const showNavigation = ["dashboard", "contracts", "payments", "profile", "attendance", "advances", "admin"].includes(currentScreen);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center p-0 sm:p-6 text-slate-800 dark:text-slate-100">
        <div className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[430px] bg-white dark:bg-slate-900 sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col">
          <div className="h-10 shrink-0 px-5 flex items-center justify-between text-[10px] font-semibold bg-white dark:bg-slate-900">
            <span>9:41</span>
            <div className="flex items-center gap-1 text-slate-400"><span>●●●</span><span>▮</span></div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {renderScreen()}
          </div>

          {showNavigation && (
            <nav className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-4">
                {[
                  { id: "home", label: "Home", icon: Home },
                  { id: "contracts", label: "Contracts", icon: FileText },
                  { id: "payments", label: "Payments", icon: DollarSign },
                  { id: "profile", label: "Profile", icon: User },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => goTab(id)} className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold ${activeTab === id ? "text-blue-600" : "text-slate-400"}`}>
                    <Icon size={19} />
                    {label}
                  </button>
                ))}
              </div>
            </nav>
          )}

          {currentScreen !== "splash" && (
            <button
              aria-label="Toggle theme"
              onClick={() => setDarkMode((v) => !v)}
              className="fixed sm:absolute bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs"
            >
              {darkMode ? "☀" : "☾"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SplashScreen({ setCurrentScreen }: ScreenProps) {
  return (
    <div className="flex flex-col items-center justify-between h-full px-6 py-12 text-center relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="my-auto flex flex-col items-center z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl shadow-xl flex items-center justify-center mb-6">
          <CalendarDays className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold mb-1">Rossie</h1>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-8">Attendance Management</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[220px]">Better Workforce.<br />Brighter Tomorrow.</p>
      </div>
      <div className="w-full z-10">
        <button onClick={() => setCurrentScreen("signin")} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-2">
          Get Started <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function SignInScreen({ setCurrentScreen }: ScreenProps) {
  return (
    <div className="flex flex-col h-full px-6 py-8 justify-between">
      <div>
        <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow"><CalendarDays className="w-8 h-8 text-white" /></div></div>
        <h2 className="text-2xl font-bold text-center mb-1">Sign in</h2>
        <p className="text-xs text-slate-400 text-center mb-6">Rossie Workforce Management</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Mobile number or username</label>
            <div className="relative flex items-center"><User className="absolute left-3.5 text-slate-400" size={18} /><input type="text" placeholder="Mobile number or username" className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Password</label>
            <div className="relative flex items-center"><Lock className="absolute left-3.5 text-slate-400" size={18} /><input type="password" placeholder="Password" className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          </div>
        </div>
      </div>
      <div className="space-y-4 mt-6">
        <button onClick={() => setCurrentScreen("dashboard")} className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-2">SIGN IN <ArrowRight size={18} /></button>
        <p className="text-xs text-center text-slate-400">New here? <button onClick={() => setCurrentScreen("signup")} className="text-blue-600 font-semibold">Create account</button></p>
      </div>
    </div>
  );
}

function SignUpScreen({ setCurrentScreen }: ScreenProps) {
  return (
    <div className="flex flex-col h-full px-6 py-6 justify-between">
      <div>
        <button onClick={() => setCurrentScreen("signin")} className="mb-4 text-slate-600 dark:text-slate-300"><ChevronLeft size={24} /></button>
        <h2 className="text-2xl font-bold mb-1">Create account</h2>
        <p className="text-xs text-slate-400 mb-6">Join Rossie and manage your workforce effortlessly.</p>
        <div className="space-y-4">
          <input type="text" placeholder="Mobile number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm" />
          <input type="password" placeholder="Create password" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm" />
          <input type="password" placeholder="Confirm password" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm" />
        </div>
      </div>
      <div className="space-y-3 mt-6">
        <button onClick={() => setCurrentScreen("request_sent")} className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl shadow-lg">CREATE ACCOUNT</button>
        <button onClick={() => setCurrentScreen("signin")} className="w-full py-2 text-xs text-slate-400">Back to login</button>
      </div>
    </div>
  );
}

function RequestSentScreen({ setCurrentScreen }: ScreenProps) {
  return (
    <div className="flex flex-col h-full px-6 py-12 items-center justify-between text-center">
      <div />
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mb-6"><div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-12"><ArrowRight size={36} className="-rotate-45" /></div></div>
        <h2 className="text-2xl font-bold mb-2">Request sent to admin</h2>
        <p className="text-xs text-slate-400 max-w-[240px]">Your account will be available after admin approval.</p>
      </div>
      <button onClick={() => setCurrentScreen("signin")} className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg">Back to login</button>
    </div>
  );
}

function DashboardScreen({ setCurrentScreen }: ScreenProps) {
  return (
    <div className="px-5 py-4 space-y-5">
      <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">RK</div><div><p className="text-xs text-slate-400">Hello,</p><h3 className="text-sm font-bold">Ravi Kumar</h3></div></div><button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"><Bell size={18} /></button></div>
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 flex justify-between items-center"><div><div className="flex items-center gap-2 mb-1"><Calendar size={14} className="text-emerald-600" /><span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Today's Attendance</span></div><p className="text-[11px] text-slate-500">10 Sep 2025</p></div><span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">Present</span></div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Total","24","blue"],["Present","20","emerald"],["Absent","4","rose"],["On Leave","0","purple"]
        ].map(([label,value,tone]) => <div key={label} className={`bg-${tone}-50/60 dark:bg-slate-800/40 border border-${tone}-100 dark:border-slate-800 rounded-2xl p-4`}><span className="text-xs text-slate-400">{label}</span><p className={`text-2xl font-extrabold text-${tone}-600`}>{value}</p></div>)}
      </div>
      <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h4><div className="grid grid-cols-2 gap-3">
        {[
          ["attendance","Mark Attendance",Calendar,"blue"],
          ["contracts","View Contracts",FileText,"emerald"],
          ["payments","Payments",DollarSign,"purple"],
          ["advances","Advances",DollarSign,"orange"]
        ].map(([screen,label,Icon,tone]) => <button key={String(screen)} onClick={() => setCurrentScreen(screen as Screen)} className={`bg-${tone}-50/40 dark:bg-slate-800/50 border border-${tone}-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center`}><div className={`w-10 h-10 rounded-xl bg-${tone}-100 dark:bg-${tone}-900/50 text-${tone}-600 flex items-center justify-center mb-2`}><Icon size={20} /></div><span className="text-xs font-bold">{label}</span></button>)}
      </div></div>
    </div>
  );
}

function ContractsScreen({ setCurrentScreen }: ScreenProps) {
  return <div className="px-5 py-4 space-y-4"><div className="flex justify-between items-center"><h3 className="text-lg font-bold flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Contracts</h3></div><div className="relative"><Search className="absolute left-3.5 top-3 text-slate-400" size={16} /><input type="text" placeholder="Search contracts..." className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs" /></div><div className="space-y-3">{[{name:"Ocean Builders Ltd.",code:"#C-001",dates:"Jan 15, 2025 - Dec 31, 2025",count:"24 Labourers",status:"Active"},{name:"Sunrise Infra Pvt. Ltd.",code:"#C-002",dates:"Feb 01, 2025 - Nov 30, 2025",count:"18 Labourers",status:"Active"}].map((c) => <button key={c.code} className="w-full text-left bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex justify-between items-center"><div className="space-y-1"><div className="flex items-center gap-2"><h4 className="text-sm font-bold">{c.name}</h4><span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">{c.status}</span></div><p className="text-[11px] text-slate-400">{c.code} • {c.dates}</p><p className="text-[10px] text-slate-400">{c.count}</p></div><ChevronRight size={18} className="text-slate-400" /></button>)}</div></div>;
}

function AttendanceScreen({ setCurrentScreen }: ScreenProps) {
  return <div className="px-5 py-4 space-y-4"><div className="flex justify-between items-center"><button onClick={() => setCurrentScreen("dashboard")}><ChevronLeft size={22} /></button><h3 className="text-sm font-bold">Attendance</h3><Calendar size={18} className="text-slate-500" /></div><div className="space-y-2">{[{name:"Ramesh Kumar",id:"L-001",status:"Present",initials:"RK"},{name:"Suresh Babu",id:"L-002",status:"Present",initials:"SB"}].map((item) => <button key={item.id} onClick={() => setCurrentScreen("labour_details")} className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex justify-between items-center text-left"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">{item.initials}</div><div><h5 className="text-xs font-bold">{item.name}</h5><span className="text-[10px] text-slate-400">{item.id}</span></div></div><span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700">{item.status}</span></button>)}</div></div>;
}

function LabourDetailsScreen({ setCurrentScreen }: ScreenProps) {
  return <div className="px-5 py-4 space-y-4"><div className="flex justify-between items-center"><button onClick={() => setCurrentScreen("attendance")}><ChevronLeft size={22} /></button><h3 className="text-sm font-bold">Labour Details</h3><MoreHorizontal size={18} /></div><div className="bg-blue-600 text-white rounded-2xl p-4 flex items-center justify-between"><div><h4 className="font-bold text-base">Ramesh Kumar</h4><p className="text-xs text-blue-100">L-001 • Male • 28 yrs</p></div><span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full">Active</span></div><button onClick={() => setCurrentScreen("attendance")} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">Back to Attendance</button></div>;
}

function PaymentsScreen({ setCurrentScreen }: ScreenProps) {
  return <div className="px-5 py-4 space-y-4"><h3 className="text-sm font-bold flex items-center gap-2"><DollarSign size={18} className="text-blue-600" /> Payments</h3><div className="grid grid-cols-2 gap-3"><div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-2xl"><span className="text-[10px] text-emerald-700">Total Paid</span><p className="text-lg font-extrabold text-emerald-600 mt-1">₹ 48,750</p></div><div className="bg-orange-50 dark:bg-orange-950/20 p-3.5 rounded-2xl"><span className="text-[10px] text-orange-700">Pending</span><p className="text-lg font-extrabold text-orange-600 mt-1">₹ 12,500</p></div></div></div>;
}

function AdvancesScreen({ setCurrentScreen }: ScreenProps) {
  return <div className="px-5 py-4 space-y-4"><div className="flex justify-between items-center"><button onClick={() => setCurrentScreen("dashboard")}><ChevronLeft size={22} /></button><h3 className="text-sm font-bold">Advances</h3></div><div className="grid grid-cols-2 gap-3"><div className="bg-blue-50 p-3.5 rounded-2xl"><span className="text-[10px] text-blue-700">Total Advances</span><p className="text-lg font-extrabold text-blue-600 mt-1">₹ 15,000</p></div><div className="bg-purple-50 p-3.5 rounded-2xl"><span className="text-[10px] text-purple-700">Remaining</span><p className="text-lg font-extrabold text-purple-600 mt-1">₹ 7,500</p></div></div></div>;
}

function AdminPanelScreen({ setCurrentScreen }: ScreenProps) {
  return <div className="px-5 py-4 space-y-4"><h3 className="text-sm font-bold flex items-center gap-2"><Shield size={18} className="text-blue-600" /> Admin Panel</h3><div className="space-y-2.5"><div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl flex justify-between items-center text-xs"><div><span className="font-bold block text-sm">Active Accounts</span><span className="text-slate-400">12 out of 16 accounts</span></div><ChevronRight size={18} /></div></div></div>;
}

function ProfileScreen({ setCurrentScreen }: ScreenProps) {
  return <div className="px-5 py-4 space-y-5"><div className="text-center pb-2 border-b border-slate-200 dark:border-slate-800"><h3 className="font-bold text-base">Rossie</h3><p className="text-[10px] text-slate-400">v1.0.0</p></div><button onClick={() => setCurrentScreen("signin")} className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><LogOut size={16} /> Logout</button></div>;
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import PendingApproval from "./components/PendingApproval";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import ContractsPage from "./pages/ContractsPage";
import AttendancePage from "./pages/AttendancePage";
import AdvancesPage from "./pages/AdvancesPage";
import PaymentsPage from "./pages/PaymentsPage";
import LaboursPage from "./pages/LaboursPage";
import SettledPage from "./pages/SettledPage";
import AdminPanel from "./pages/AdminPanel";

// A stalled mobile/WebView network request must not leave React Query in a
// permanent first-load state. React Query retries rejected requests, but it
// cannot recover from a fetch promise that never settles. Keep the existing
// AbortSignal behavior while adding a hard upper bound for every fetch.
const FETCH_TIMEOUT_MS = 15_000;
if (typeof window !== "undefined" && !(window as any).__rossieFetchTimeoutInstalled) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const externalSignal = init?.signal;
    const abortFromCaller = () => controller.abort();
    externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
    return nativeFetch(input, { ...init, signal: controller.signal }).finally(() => {
      window.clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", abortFromCaller);
    });
  }) as typeof window.fetch;
  (window as any).__rossieFetchTimeoutInstalled = true;
}

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

interface AppProps { queryClient?: QueryClient; }

function OpeningRossie() {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden" style={{ background: "#07111f" }} role="status" aria-live="polite" aria-label="Opening Rossie"><div className="ambient-glow-1" aria-hidden="true" /><div className="ambient-glow-2" aria-hidden="true" /><div className="relative z-10 flex w-full max-w-xs flex-col items-center px-6 text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px]" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)", boxShadow: "0 0 42px rgba(249,115,22,0.38), 0 12px 36px rgba(0,0,0,0.45)", animation: "openingLogoPulse 1.8s ease-in-out infinite" }}><svg aria-hidden="true" width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" /></svg></div><h1 className="font-bold tracking-tight" style={{ fontFamily: "Figtree, sans-serif", fontSize: "2.7rem", lineHeight: 1, background: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Rossie</h1><p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#8892a4" }}>Attendance Management</p><div className="mt-8 flex items-center gap-2" aria-hidden="true"><span className="h-2 w-2 rounded-full bg-orange-500" style={{ animation: "openingDot 1.2s ease-in-out infinite" }} /><span className="h-2 w-2 rounded-full bg-orange-500" style={{ animation: "openingDot 1.2s ease-in-out 0.18s infinite" }} /><span className="h-2 w-2 rounded-full bg-orange-500" style={{ animation: "openingDot 1.2s ease-in-out 0.36s infinite" }} /></div><p className="mt-4 text-base font-semibold text-white">Opening Rossie…</p><p className="mt-1 text-xs" style={{ color: "#7f8ca1" }}>Please wait</p></div></div>;
}

function AppContent() {
  const { isAuthenticated, isInitializing, status, mode, activeTab, setActiveTab, attendanceContractId, setAttendanceContractId } = useAuth();
  const [selectedContractId, setSelectedContractId] = useState<bigint | null>(null);
  const [selectedContractIds, setSelectedContractIds] = useState<Set<string>>(() => new Set());
  const [paymentData, setPaymentData] = useState<any[] | null>(null);
  const [openColumnPickerFor, setOpenColumnPickerFor] = useState<bigint | null>(null);
  const handleViewAttendance = (contractId: bigint) => { setSelectedContractId(contractId); setAttendanceContractId(contractId); setActiveTab("attendance"); };
  if (isInitializing) return <OpeningRossie />;
  if (!isAuthenticated) return <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0d1220" }}><div className="ambient-glow-1" aria-hidden="true" /><div className="ambient-glow-2" aria-hidden="true" /><LoginPage /></div>;
  if (status !== "approved") return <PendingApproval />;
  return <Layout><div className="flex flex-col h-full"><ErrorBoundary tabName={activeTab} key={activeTab}>
    {activeTab === "admin" && <AdminPanel key="admin" />}
    {mode === "view" && activeTab === "attendance" && <AttendancePage key="attendance" selectedContractId={selectedContractId} openColumnPickerFor={openColumnPickerFor} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {mode === "view" && activeTab === "contracts" && <ContractsPage key="contracts-view" />}
    {mode === "edit" && activeTab === "contracts" && <ContractsPage key="contracts-edit" onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "attendance" && <AttendancePage key="attendance-edit" selectedContractId={selectedContractId ?? attendanceContractId} onContractChange={setAttendanceContractId} openColumnPickerFor={openColumnPickerFor} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {(mode === "edit" || mode === "view") && activeTab === "advances" && <AdvancesPage key="advances" />}
    {(mode === "edit" || mode === "view") && activeTab === "payments" && <PaymentsPage key="payments" selectedContractIds={selectedContractIds} setSelectedContractIds={setSelectedContractIds} paymentData={paymentData} setPaymentData={setPaymentData} />}
    {(mode === "edit" || mode === "view") && activeTab === "labours" && <LaboursPage key="labours" />}
    {(mode === "edit" || mode === "view") && activeTab === "settled" && <SettledPage key="settled" />}
  </ErrorBoundary></div></Layout>;
}

export default function App({ queryClient }: AppProps = {}) { const qc = queryClient ?? defaultQueryClient; return <ErrorBoundary><QueryClientProvider client={qc}><AuthProvider><AppContent /></AuthProvider></QueryClientProvider></ErrorBoundary>; }
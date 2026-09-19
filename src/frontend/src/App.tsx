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

// Keep stalled mobile/WebView requests from blocking the app indefinitely.
const FETCH_TIMEOUT_MS = 8_000;
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
      retry: 1,
      retryDelay: 500,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});

interface AppProps { queryClient?: QueryClient; }

function OpeningRossie() {
  return <div className="rossie-opening-screen fixed inset-0 z-[100] flex items-center justify-center overflow-hidden" role="status" aria-live="polite" aria-label="Opening Rossie"><div className="ambient-glow-1" aria-hidden="true" /><div className="ambient-glow-2" aria-hidden="true" /><div className="relative z-10 flex w-full max-w-xs flex-col items-center px-6 text-center"><div className="rossie-opening-logo"><svg aria-hidden="true" width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" /></svg></div><h1 className="rossie-opening-title">Rossie</h1><p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] rossie-opening-muted">Attendance Management</p><div className="mt-8 flex items-center gap-2" aria-hidden="true"><span className="rossie-opening-dot h-2 w-2 rounded-full" style={{ animation: "openingDot 1.2s ease-in-out infinite" }} /><span className="rossie-opening-dot h-2 w-2 rounded-full" style={{ animation: "openingDot 1.2s ease-in-out 0.18s infinite" }} /><span className="rossie-opening-dot h-2 w-2 rounded-full" style={{ animation: "openingDot 1.2s ease-in-out 0.36s infinite" }} /></div><p className="mt-4 text-base font-semibold rossie-opening-text">Opening Rossie…</p><p className="mt-1 text-xs rossie-opening-muted">Please wait</p></div></div>;
}

function AppContent() {
  const { isAuthenticated, isInitializing, status, mode, activeTab, setActiveTab, attendanceContractId, setAttendanceContractId } = useAuth();
  const [selectedContractId, setSelectedContractId] = useState<bigint | null>(null);
  const [selectedContractIds, setSelectedContractIds] = useState<Set<string>>(() => new Set());
  const [paymentData, setPaymentData] = useState<any[] | null>(null);
  const [openColumnPickerFor, setOpenColumnPickerFor] = useState<bigint | null>(null);
  const handleViewAttendance = (contractId: bigint) => { setSelectedContractId(contractId); setAttendanceContractId(contractId); setActiveTab("attendance"); };
  if (isInitializing) return <OpeningRossie />;
  if (!isAuthenticated) return <LoginPage />;
  if (status !== "approved") return <PendingApproval />;
  return <div className="rossie-theme"><Layout><div className="flex flex-col h-full"><ErrorBoundary tabName={activeTab} key={activeTab}>
    {activeTab === "admin" && <AdminPanel key="admin" />}
    {mode === "view" && activeTab === "attendance" && <AttendancePage key="attendance" selectedContractId={selectedContractId ?? attendanceContractId} openColumnPickerFor={openColumnPickerFor} onContractChange={setAttendanceContractId} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {mode === "view" && activeTab === "contracts" && <ContractsPage key="contracts-view" onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "contracts" && <ContractsPage key="contracts-edit" onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "attendance" && <AttendancePage key="attendance-edit" selectedContractId={selectedContractId ?? attendanceContractId} onContractChange={setAttendanceContractId} openColumnPickerFor={openColumnPickerFor} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {(mode === "edit" || mode === "view") && activeTab === "advances" && <AdvancesPage key="advances" />}
    {(mode === "edit" || mode === "view") && activeTab === "payments" && <PaymentsPage key="payments" selectedContractIds={selectedContractIds} setSelectedContractIds={setSelectedContractIds} paymentData={paymentData} setPaymentData={setPaymentData} />}
    {(mode === "edit" || mode === "view") && activeTab === "labours" && <LaboursPage key="labours" />}
    {(mode === "edit" || mode === "view") && activeTab === "settled" && <SettledPage key="settled" />}
  </ErrorBoundary></div></Layout></div>;
}

export default function App({ queryClient }: AppProps = {}) { const qc = queryClient ?? defaultQueryClient; return <ErrorBoundary><QueryClientProvider client={qc}><AuthProvider><AppContent /></AuthProvider></QueryClientProvider></ErrorBoundary>; }
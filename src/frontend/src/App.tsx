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
  return (
    <div className="rossie-launch-screen" role="status" aria-live="polite" aria-label="Opening Rossie">
      <div className="rossie-launch-orb rossie-launch-orb-a" />
      <div className="rossie-launch-orb rossie-launch-orb-b" />
      <div className="rossie-launch-card">
        <div className="rossie-logo-mark" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </div>
        <div className="rossie-launch-name">Rossie</div>
        <div className="rossie-launch-subtitle">Attendance Management</div>
        <div className="rossie-launch-loader"><span /><span /><span /></div>
      </div>
    </div>
  );
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
    {mode === "view" && activeTab === "attendance" && <AttendancePage key="attendance" selectedContractId={selectedContractId ?? attendanceContractId} openColumnPickerFor={openColumnPickerFor} onContractChange={setAttendanceContractId} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {mode === "view" && activeTab === "contracts" && <ContractsPage key="contracts-view" onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "contracts" && <ContractsPage key="contracts-edit" onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "attendance" && <AttendancePage key="attendance-edit" selectedContractId={selectedContractId ?? attendanceContractId} onContractChange={setAttendanceContractId} openColumnPickerFor={openColumnPickerFor} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {(mode === "edit" || mode === "view") && activeTab === "advances" && <AdvancesPage key="advances" />}
    {(mode === "edit" || mode === "view") && activeTab === "payments" && <PaymentsPage key="payments" selectedContractIds={selectedContractIds} setSelectedContractIds={setSelectedContractIds} paymentData={paymentData} setPaymentData={setPaymentData} />}
    {(mode === "edit" || mode === "view") && activeTab === "labours" && <LaboursPage key="labours" />}
    {(mode === "edit" || mode === "view") && activeTab === "settled" && <SettledPage key="settled" />}
  </ErrorBoundary></div></Layout>;
}

export default function App({ queryClient }: AppProps = {}) { const qc = queryClient ?? defaultQueryClient; return <ErrorBoundary><QueryClientProvider client={qc}><AuthProvider><AppContent /></AuthProvider></QueryClientProvider></ErrorBoundary>; }
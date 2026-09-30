import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import PendingApproval from "./components/PendingApproval";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { createSupabaseActor } from "./hooks/supabaseActor";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const AdvancesPage = lazy(() => import("./pages/AdvancesPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const LaboursPage = lazy(() => import("./pages/LaboursPage"));
const LabourDetailsPage = lazy(() => import("./pages/LabourDetailsPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const MorePage = lazy(() => import("./pages/MorePage"));

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

function PageLoadingFallback() {
  return (
    <div className="app-loading-screen" role="status" aria-label="Loading Attendance">
      <div className="app-loading-mark" aria-hidden="true"><span /></div>
      <span className="app-loading-label">Loading</span>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, status, mode, activeTab, setActiveTab, attendanceContractId, setAttendanceContractId, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [prefetchActor] = useState(() => createSupabaseActor());

  // Warm data for tabs the user has not opened yet. This runs after auth is
  // available, in parallel, so visiting another tab doesn't trigger its first
  // ever load. Existing cached data can render immediately.
  useEffect(() => {
    if (!isAuthenticated || status !== "approved") return;
    const options = { staleTime: 10 * 60 * 1000 };
    void Promise.allSettled([
      queryClient.prefetchQuery({ queryKey: ["contracts"], queryFn: () => prefetchActor.getContracts(), ...options }),
      queryClient.prefetchQuery({ queryKey: ["labours"], queryFn: () => prefetchActor.getLabours(), ...options }),
      queryClient.prefetchQuery({ queryKey: ["labours", "active"], queryFn: () => prefetchActor.getActiveLabours(), ...options }),
      queryClient.prefetchQuery({ queryKey: ["advances"], queryFn: () => prefetchActor.getAdvances(), ...options }),
      queryClient.prefetchQuery({ queryKey: ["attendance", "all"], queryFn: () => prefetchActor.getAllAttendance(), ...options }),
      ...(isAdmin ? [queryClient.prefetchQuery({ queryKey: ["users"], queryFn: () => prefetchActor.listUsers(), ...options })] : []),
    ]);
  }, [isAuthenticated, status, isAdmin, queryClient, prefetchActor]);
  const [selectedContractId, setSelectedContractId] = useState<bigint | null>(null);
  const [selectedContractIds, setSelectedContractIds] = useState<Set<string>>(() => new Set());
  const [paymentData, setPaymentData] = useState<any[] | null>(null);
  const [openColumnPickerFor, setOpenColumnPickerFor] = useState<bigint | null>(null);
  const [selectedLabour, setSelectedLabour] = useState<any | null>(null);
  const handleViewAttendance = (contractId: bigint) => {
    setSelectedContractId(contractId);
    setAttendanceContractId(contractId);
    setActiveTab("attendance");
  };
  const handleAttendanceBack = () => setActiveTab("contracts");
  // Never block the UI on auth initialization. Cached auth renders the app immediately;
  // without cached auth we show login immediately while session restoration runs in background.
  if (!isAuthenticated) return <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#040913" }}><div className="ambient-glow-1" aria-hidden="true" /><div className="ambient-glow-2" aria-hidden="true" /><Suspense fallback={<PageLoadingFallback />}><LoginPage /></Suspense></div>;
  if (status !== "approved") return <PendingApproval />;
  if (selectedLabour && activeTab === "labours") return <Layout><div className="flex flex-col min-h-full"><ErrorBoundary tabName="labours"><Suspense fallback={<PageLoadingFallback />}><LabourDetailsPage labour={selectedLabour} onBack={() => setSelectedLabour(null)} /></Suspense></ErrorBoundary></div></Layout>;
  return <Layout><div className="flex flex-col min-h-full"><ErrorBoundary tabName={activeTab} key={activeTab}><Suspense fallback={<PageLoadingFallback />}>
    {activeTab === "admin" && <AdminPanel key="admin" />}
    {mode === "view" && activeTab === "attendance" && <AttendancePage key="attendance" selectedContractId={selectedContractId ?? attendanceContractId} openColumnPickerFor={openColumnPickerFor} onContractChange={setAttendanceContractId} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} onBackToContracts={handleAttendanceBack} />}
    {mode === "view" && activeTab === "contracts" && <ContractsPage key="contracts-view" onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "contracts" && <ContractsPage key="contracts-edit" onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "attendance" && <AttendancePage key="attendance-edit" selectedContractId={selectedContractId ?? attendanceContractId} onContractChange={setAttendanceContractId} openColumnPickerFor={openColumnPickerFor} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} onBackToContracts={handleAttendanceBack} />}
    {(mode === "edit" || mode === "view") && activeTab === "advances" && <AdvancesPage key="advances" />}
    {(mode === "edit" || mode === "view") && activeTab === "payments" && <PaymentsPage key="payments" selectedContractIds={selectedContractIds} setSelectedContractIds={setSelectedContractIds} paymentData={paymentData} setPaymentData={setPaymentData} />}
    {(mode === "edit" || mode === "view") && activeTab === "labours" && <LaboursPage key="labours" onSelectLabour={setSelectedLabour} />}
    {(mode === "edit" || mode === "view") && activeTab === "more" && <MorePage key="more" />}

  </Suspense></ErrorBoundary></div></Layout>;
}

export default function App({ queryClient }: AppProps = {}) { const qc = queryClient ?? defaultQueryClient; return <ErrorBoundary><QueryClientProvider client={qc}><AuthProvider><AppContent /></AuthProvider></QueryClientProvider></ErrorBoundary>; }
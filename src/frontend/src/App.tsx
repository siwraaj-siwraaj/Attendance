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
  // Keep every tab the user has visited mounted. Returning to it then reveals
  // the existing screen instead of rebuilding the page from scratch.
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([activeTab]));
  useEffect(() => {
    setVisitedTabs((previous) => {
      if (previous.has(activeTab)) return previous;
      const next = new Set(previous);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Mount unopened tabs during idle time. Downloading lazy chunks alone does
  // not pay the cost of React mounting and layout, which can cause first-tap lag.
  useEffect(() => {
    if (!isAuthenticated || status !== "approved") return;
    const tabs = ["contracts", "attendance", "advances", "payments", "labours", "more", "admin"];
    let index = 0;
    let cancelled = false;
    let idleId: number | undefined;
    let timerId: number | undefined;
    const scheduleNext = () => {
      if (cancelled || index >= tabs.length) return;
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(mountNext, { timeout: 1200 });
      } else {
        timerId = window.setTimeout(mountNext, 250);
      }
    };
    const mountNext = () => {
      if (cancelled || index >= tabs.length) return;
      const tab = tabs[index++];
      setVisitedTabs((previous) => {
        if (previous.has(tab)) return previous;
        const next = new Set(previous);
        next.add(tab);
        return next;
      });
      scheduleNext();
    };
    scheduleNext();
    return () => {
      cancelled = true;
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [isAuthenticated, status]);
  const handleViewAttendance = (contractId: bigint) => {
    setSelectedContractId(contractId);
    setAttendanceContractId(contractId);
    setActiveTab("attendance");
  };
  const handleAttendanceBack = () => setActiveTab("contracts");
  // Never block the UI on auth initialization. Cached auth renders the app immediately;
  // without cached auth we show login immediately while session restoration runs in background.
  if (!isAuthenticated) return <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#040913" }}><div className="ambient-glow-1" aria-hidden="true" /><div className="ambient-glow-2" aria-hidden="true" /><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><LoginPage /></Suspense></div>;
  if (status !== "approved") return <PendingApproval />;
  // Render the newly selected tab in the same React render as the tab change;
  // waiting for the effect to mark it visited caused a one-frame blank flash.
  const showTab = (tab: string) => visitedTabs.has(tab) || activeTab === tab;
  const tabStyle = (tab: string) => ({ display: activeTab === tab ? "flex" : "none" });
  return <Layout><div className="flex flex-col min-h-full">
    <div style={tabStyle("contracts")} className="flex-col min-h-full" aria-hidden={activeTab !== "contracts"}>{showTab("contracts") && <ErrorBoundary tabName="contracts"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><ContractsPage onViewAttendance={handleViewAttendance} /></Suspense></ErrorBoundary>}</div>
    <div style={tabStyle("attendance")} className="flex-col min-h-full" aria-hidden={activeTab !== "attendance"}>{showTab("attendance") && <ErrorBoundary tabName="attendance"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><AttendancePage selectedContractId={selectedContractId ?? attendanceContractId} openColumnPickerFor={openColumnPickerFor} onContractChange={setAttendanceContractId} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} onBackToContracts={handleAttendanceBack} /></Suspense></ErrorBoundary>}</div>
    <div style={tabStyle("advances")} className="flex-col min-h-full" aria-hidden={activeTab !== "advances"}>{showTab("advances") && (mode === "edit" || mode === "view") && <ErrorBoundary tabName="advances"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><AdvancesPage /></Suspense></ErrorBoundary>}</div>
    <div style={tabStyle("payments")} className="flex-col min-h-full" aria-hidden={activeTab !== "payments"}>{showTab("payments") && (mode === "edit" || mode === "view") && <ErrorBoundary tabName="payments"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><PaymentsPage selectedContractIds={selectedContractIds} setSelectedContractIds={setSelectedContractIds} paymentData={paymentData} setPaymentData={setPaymentData} /></Suspense></ErrorBoundary>}</div>
    <div style={tabStyle("labours")} className="flex-col min-h-full" aria-hidden={activeTab !== "labours"}>{showTab("labours") && (mode === "edit" || mode === "view") && (selectedLabour ? <ErrorBoundary tabName="labours"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><LabourDetailsPage labour={selectedLabour} onBack={() => setSelectedLabour(null)} /></Suspense></ErrorBoundary> : <ErrorBoundary tabName="labours"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><LaboursPage onSelectLabour={setSelectedLabour} /></Suspense></ErrorBoundary>)}</div>
    <div style={tabStyle("more")} className="flex-col min-h-full" aria-hidden={activeTab !== "more"}>{showTab("more") && (mode === "edit" || mode === "view") && <ErrorBoundary tabName="more"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><MorePage /></Suspense></ErrorBoundary>}</div>
    <div style={tabStyle("admin")} className="flex-col min-h-full" aria-hidden={activeTab !== "admin"}>{showTab("admin") && <ErrorBoundary tabName="admin"><Suspense fallback={<div className="min-h-full flex-1" style={{ background: "#F8FAFC" }} />}><AdminPanel /></Suspense></ErrorBoundary>}</div>
  </div></Layout>;
}

export default function App({ queryClient }: AppProps = {}) { const qc = queryClient ?? defaultQueryClient; return <ErrorBoundary><QueryClientProvider client={qc}><AuthProvider><AppContent /></AuthProvider></QueryClientProvider></ErrorBoundary>; }
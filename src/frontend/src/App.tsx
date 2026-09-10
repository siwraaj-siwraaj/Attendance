import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import PendingApproval from "./components/PendingApproval";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useBackendActor } from "./hooks/useBackend";
import LoginPage from "./pages/LoginPage";

const loadContractsPage = () => import("./pages/ContractsPage");
const loadAttendancePage = () => import("./pages/AttendancePage");
const loadAdvancesPage = () => import("./pages/AdvancesPage");
const loadPaymentsPage = () => import("./pages/PaymentsPage");
const loadLaboursPage = () => import("./pages/LaboursPage");
const loadSettledPage = () => import("./pages/SettledPage");
const loadAdminPanel = () => import("./pages/AdminPanel");

const ContractsPage = lazy(loadContractsPage);
const AttendancePage = lazy(loadAttendancePage);
const AdvancesPage = lazy(loadAdvancesPage);
const PaymentsPage = lazy(loadPaymentsPage);
const LaboursPage = lazy(loadLaboursPage);
const SettledPage = lazy(loadSettledPage);
const AdminPanel = lazy(loadAdminPanel);

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});

interface AppProps { queryClient?: QueryClient; }

function OpeningRossie() {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden" style={{ background: "#07111f" }} role="status" aria-live="polite" aria-label="Opening Rossie"><div className="ambient-glow-1" aria-hidden="true" /><div className="ambient-glow-2" aria-hidden="true" /><div className="relative z-10 flex w-full max-w-xs flex-col items-center px-6 text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px]" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)", boxShadow: "0 0 42px rgba(249,115,22,0.38), 0 12px 36px rgba(0,0,0,0.45)", animation: "openingLogoPulse 1.8s ease-in-out infinite" }}><svg aria-hidden="true" width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" /></svg></div><h1 className="font-bold tracking-tight" style={{ fontFamily: "Figtree, sans-serif", fontSize: "2.7rem", lineHeight: 1, background: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Rossie</h1><p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#8892a4" }}>Attendance Management</p><div className="mt-8 flex items-center gap-2" aria-hidden="true"><span className="h-2 w-2 rounded-full bg-orange-500" style={{ animation: "openingDot 1.2s ease-in-out infinite" }} /><span className="h-2 w-2 rounded-full bg-orange-500" style={{ animation: "openingDot 1.2s ease-in-out 0.18s infinite" }} /><span className="h-2 w-2 rounded-full bg-orange-500" style={{ animation: "openingDot 1.2s ease-in-out 0.36s infinite" }} /></div><p className="mt-4 text-base font-semibold text-white">Opening Rossie…</p><p className="mt-1 text-xs" style={{ color: "#7f8ca1" }}>Please wait</p></div></div>;
}

function PageLoading() { return <div className="flex h-full min-h-[240px] items-center justify-center" aria-live="polite" aria-label="Loading page"><div className="h-7 w-7 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /></div>; }

function DataPreloader({ children }: { children: ReactNode }) {
  const { actor, actorReady } = useBackendActor();
  const queryClient = useQueryClient();
  const { isAuthenticated, status } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!actorReady || !actor || !isAuthenticated || status !== "approved") {
      setReady(false);
      return () => { cancelled = true; };
    }

    setReady(false);
    const warm = async () => {
      try {
        // Warm both the data cache and all page chunks before the first app
        // screen is released. This prevents the first visit to any tab from
        // racing lazy-module loading against React Query rendering on mobile.
        const [, , , , , , , pageModules] = await Promise.all([
          actor.getContracts(),
          actor.getLabours(),
          actor.getActiveLabours(),
          actor.getAdvances(),
          actor.getAllAttendance(),
          loadContractsPage(),
          loadAttendancePage(),
          Promise.all([
            loadAdvancesPage(),
            loadPaymentsPage(),
            loadLaboursPage(),
            loadSettledPage(),
            loadAdminPanel(),
          ]),
        ]);

        if (cancelled) return;

        const [contractsResult, laboursResult, activeLaboursResult, advancesResult, attendanceResult] = await Promise.all([
          actor.getContracts(),
          actor.getLabours(),
          actor.getActiveLabours(),
          actor.getAdvances(),
          actor.getAllAttendance(),
        ]);

        queryClient.setQueryData(["contracts"], contractsResult);
        queryClient.setQueryData(["contracts", "all"], contractsResult);
        queryClient.setQueryData(["labours"], laboursResult);
        queryClient.setQueryData(["labours", "active"], activeLaboursResult);
        queryClient.setQueryData(["advances"], advancesResult);
        queryClient.setQueryData(["attendance", "all"], attendanceResult);

        const advancesByContract = new Map<string, typeof advancesResult>();
        for (const item of advancesResult) {
          const key = String(item.contractId);
          const list = advancesByContract.get(key);
          if (list) list.push(item); else advancesByContract.set(key, [item]);
        }
        for (const [contractId, items] of advancesByContract) queryClient.setQueryData(["advances", contractId], items);

        const attendanceByContract = new Map<string, typeof attendanceResult>();
        for (const item of attendanceResult) {
          const key = String(item.contractId);
          const list = attendanceByContract.get(key);
          if (list) list.push(item); else attendanceByContract.set(key, [item]);
        }
        for (const [contractId, items] of attendanceByContract) queryClient.setQueryData(["attendance", contractId], items);

        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    };

    void warm();
    return () => { cancelled = true; };
  }, [actor, actorReady, isAuthenticated, status, queryClient]);

  if (isAuthenticated && status === "approved" && !ready) return <OpeningRossie />;
  return <>{children}</>;
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
  return <Layout><div className="flex flex-col h-full"><ErrorBoundary tabName={activeTab} key={activeTab}><Suspense fallback={<PageLoading />}>
    {activeTab === "admin" && <AdminPanel />}
    {mode === "view" && activeTab === "attendance" && <AttendancePage selectedContractId={selectedContractId} openColumnPickerFor={openColumnPickerFor} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {mode === "view" && activeTab === "contracts" && <ContractsPage />}
    {mode === "edit" && activeTab === "contracts" && <ContractsPage onViewAttendance={handleViewAttendance} />}
    {mode === "edit" && activeTab === "attendance" && <AttendancePage selectedContractId={selectedContractId ?? attendanceContractId} onContractChange={setAttendanceContractId} openColumnPickerFor={openColumnPickerFor} onColumnPickerOpened={() => setOpenColumnPickerFor(null)} />}
    {(mode === "edit" || mode === "view") && activeTab === "advances" && <AdvancesPage />}
    {(mode === "edit" || mode === "view") && activeTab === "payments" && <PaymentsPage selectedContractIds={selectedContractIds} setSelectedContractIds={setSelectedContractIds} paymentData={paymentData} setPaymentData={setPaymentData} />}
    {(mode === "edit" || mode === "view") && activeTab === "labours" && <LaboursPage />}
    {(mode === "edit" || mode === "view") && activeTab === "settled" && <SettledPage />}
  </Suspense></ErrorBoundary></div></Layout>;
}

export default function App({ queryClient }: AppProps = {}) { const qc = queryClient ?? defaultQueryClient; return <ErrorBoundary><QueryClientProvider client={qc}><AuthProvider><DataPreloader><AppContent /></DataPreloader></AuthProvider></QueryClientProvider></ErrorBoundary>; }
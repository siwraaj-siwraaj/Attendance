import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import PendingApproval from "./components/PendingApproval";
import SkeletonLoader from "./components/SkeletonLoader";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import {
  useAdvances,
  useAllAttendance,
  useContracts,
} from "./hooks/useBackend";
import LoginPage from "./pages/LoginPage";
import type { Tab } from "./types";

import ContractsPage from "./pages/ContractsPage";
import AttendancePage from "./pages/AttendancePage";
import AdvancesPage from "./pages/AdvancesPage";
import PaymentsPage from "./pages/PaymentsPage";
import LaboursPage from "./pages/LaboursPage";
import SettledPage from "./pages/SettledPage";
import AdminPanel from "./pages/AdminPanel";

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

interface AppProps {
  queryClient?: QueryClient;
}

function TabSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <SkeletonLoader type="table-row" className="h-10" />
      <SkeletonLoader type="table-row" className="h-16" />
      <SkeletonLoader type="table-row" className="h-16" />
      <SkeletonLoader type="table-row" className="h-16" />
    </div>
  );
}

function DataPreloader() {
  useContracts();
  useAllAttendance();
  useAdvances();
  return null;
}

function AppContent() {
  const {
    isAuthenticated,
    isInitializing,
    status,
    mode,
    activeTab,
    setActiveTab,
    attendanceContractId,
    setAttendanceContractId,
  } = useAuth();
  const [selectedContractId, setSelectedContractId] = useState<bigint | null>(
    null,
  );
  const [selectedContractIds, setSelectedContractIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [paymentData, setPaymentData] = useState<any[] | null>(null);
  // When set, AttendancePage should auto-open the Manage Columns panel for
  // this contract. Cleared once the page acknowledges it.
  const [openColumnPickerFor, setOpenColumnPickerFor] = useState<bigint | null>(
    null,
  );

  const handleViewAttendance = (contractId: bigint) => {
    setSelectedContractId(contractId);
    setAttendanceContractId(contractId);
    setActiveTab("attendance");
  };

  // While the II provider restores a stored session, show a neutral loading
  // state instead of flashing the login screen.
  if (isInitializing) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#0d1220" }}
      >
        <div className="ambient-glow-1" aria-hidden="true" />
        <div className="ambient-glow-2" aria-hidden="true" />
        <SkeletonLoader type="table-row" className="h-10 w-64" />
      </div>
    );
  }

  // Not signed in — show the Internet Identity login screen.
  if (!isAuthenticated) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#0d1220" }}
      >
        <div className="ambient-glow-1" aria-hidden="true" />
        <div className="ambient-glow-2" aria-hidden="true" />
        <LoginPage />
      </div>
    );
  }

  // Signed in but not approved (pending or revoked) — no data access.
  if (status !== "approved") {
    return <PendingApproval />;
  }

  // Approved — render the app shell with role-scoped tabs.
  return (
    <Layout>
      <DataPreloader />
      <div className="flex flex-col h-full">
        <ErrorBoundary tabName={activeTab}>

            {activeTab === "admin" && <AdminPanel />}
            {mode === "view" && activeTab === "attendance" && (
              <AttendancePage
                selectedContractId={selectedContractId}
                openColumnPickerFor={openColumnPickerFor}
                onColumnPickerOpened={() => setOpenColumnPickerFor(null)}
              />
            )}
            {mode === "view" && activeTab === "contracts" && <ContractsPage />}
            {mode === "edit" && activeTab === "contracts" && (
              <ContractsPage onViewAttendance={handleViewAttendance} />
            )}
            {mode === "edit" && activeTab === "attendance" && (
              <AttendancePage
                selectedContractId={selectedContractId ?? attendanceContractId}
                onContractChange={setAttendanceContractId}
                openColumnPickerFor={openColumnPickerFor}
                onColumnPickerOpened={() => setOpenColumnPickerFor(null)}
              />
            )}
            {mode === "edit" && activeTab === "advances" && <AdvancesPage />}
            {mode === "edit" && activeTab === "payments" && (
              <PaymentsPage
                selectedContractIds={selectedContractIds}
                setSelectedContractIds={setSelectedContractIds}
                paymentData={paymentData}
                setPaymentData={setPaymentData}
              />
            )}
            {mode === "edit" && activeTab === "labours" && <LaboursPage />}
            {mode === "edit" && activeTab === "settled" && <SettledPage />}
          
        </ErrorBoundary>
      </div>
    </Layout>
  );
}

export default function App({ queryClient }: AppProps = {}) {
  const qc = queryClient ?? defaultQueryClient;
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          {/* Ambient glow background — decorative, behind all content */}
          <div className="ambient-glow-1" aria-hidden="true" />
          <div className="ambient-glow-2" aria-hidden="true" />
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

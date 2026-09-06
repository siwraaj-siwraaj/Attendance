import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AttendancePage from "../pages/AttendancePage";
import type { AttendanceRecord, Contract, Labour } from "../types";

// Vitest globals are not enabled, so Testing Library's automatic cleanup does
// not run between tests. Clean up explicitly to avoid DOM accumulation.
afterEach(() => cleanup());

// The generated backend bindings import ExternalBlob from object-storage,
// whose ESM layout is not resolvable under Vitest's resolver. Mock it so the
// import chain loads.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: { fromBytes: (b: Uint8Array) => ({ bytes: b }) },
}));

const contract: Contract = {
  id: 7n,
  name: "Sunrise Textiles — Bed Batch A",
  multiplier: 1,
  contractAmount: 120000,
  machineExpenses: 8000,
  bedAmount: 45000,
  paperAmount: 30000,
  meshAmount: 15000,
  settled: false,
  createdAt: 1705276800000000000n,
  workColumns: [{ id: "col-bed-1", workType: "bed", name: "Bed Stitching" }],
};

const labours: Labour[] = [
  {
    id: 1n,
    name: "Ramesh Kumar",
    employeeId: "EMP-001",
    joinDate: "2024-01-15",
    isActive: true,
    createdAt: 1705276800000000000n,
  },
];

const attendance: AttendanceRecord[] = [
  {
    contractId: 7n,
    labourId: 1n,
    columnId: "col-bed-1",
    value: { __kind__: "present", present: null },
  },
];

// The real useBackendActor hook resolves the actor asynchronously by polling
// window.__CANISTER_IDS__.backend. We mock createActor (the seam the hook uses
// to build the actor) so the hook's own async-ready logic is exercised for
// real, while the actor's data methods return our fixtures.
const { createActorMock } = vi.hoisted(() => ({ createActorMock: vi.fn() }));

vi.mock("../backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../backend")>();
  return {
    ...actual,
    createActor: createActorMock,
  };
});

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ canEdit: true, isAdmin: true }),
}));

describe("initially-open tab re-renders when the backend actor becomes ready", () => {
  beforeEach(() => {
    // No sync canister id — the actor is not ready on the first render,
    // exactly like a page load before the backend resolves.
    process.env.CANISTER_ID_BACKEND = undefined;
    (window as unknown as Record<string, unknown>).__CANISTER_IDS__ = undefined;
    createActorMock.mockReset();
    createActorMock.mockReturnValue({
      getContracts: () => Promise.resolve([contract]),
      getLabours: () => Promise.resolve(labours),
      getActiveLabours: () => Promise.resolve(labours),
      getAllAttendance: () => Promise.resolve(attendance),
    });
  });

  it("renders the selected contract's data once the actor resolves, without a tab switch", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnMount: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AttendancePage selectedContractId={7n} />
      </QueryClientProvider>,
    );

    // Before the actor is ready, the page is still loading — no data yet.
    expect(
      screen.queryByRole("option", { name: "Sunrise Textiles — Bed Batch A" }),
    ).not.toBeInTheDocument();

    // The backend becomes ready: the canister ids appear on window, which the
    // hook's polling interval picks up on its next tick (every 200ms).
    (
      window as unknown as Record<string, Record<string, string>>
    ).__CANISTER_IDS__ = { backend: "bkyz2-fmaaa-aaaaa-qaaaq-cai" };

    // The initially-open attendance tab shows the contract and its labour
    // attendance as soon as the actor resolves — no tab switch was needed.
    expect(
      await screen.findByRole("option", {
        name: "Sunrise Textiles — Bed Batch A",
      }),
    ).toBeInTheDocument();

    const table = screen.getByRole("table");
    expect(within(table).getByText("Ramesh Kumar")).toBeInTheDocument();
    expect(within(table).getByText("Present")).toBeInTheDocument();
  });
});

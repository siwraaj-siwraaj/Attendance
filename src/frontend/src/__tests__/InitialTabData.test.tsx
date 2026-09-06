import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
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

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ canEdit: true, isAdmin: true }),
}));

vi.mock("../hooks/useBackend", () => ({
  useContracts: () => ({ data: [contract], isLoading: false }),
  useLabours: () => ({ data: labours, isLoading: false }),
  useGetActiveLabours: () => ({ data: labours }),
  useAllAttendance: () => ({ data: attendance, isLoading: false }),
  useSetAttendance: () => ({ mutate: vi.fn(), isPending: false }),
  useAddWorkColumn: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateWorkColumn: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveWorkColumn: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("initially-open attendance tab renders its data", () => {
  it("shows the selected contract and its labour attendance immediately", () => {
    render(<AttendancePage selectedContractId={7n} />);

    // The contract data renders as soon as the page mounts — no tab switch
    // is needed to surface it.
    expect(
      screen.getByRole("option", { name: "Sunrise Textiles — Bed Batch A" }),
    ).toBeInTheDocument();

    // The attendance table lists the labour and its recorded value.
    const table = screen.getByRole("table");
    expect(within(table).getByText("Ramesh Kumar")).toBeInTheDocument();
    expect(within(table).getByText("Present")).toBeInTheDocument();
  });
});

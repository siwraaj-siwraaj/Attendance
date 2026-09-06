import { act, cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContractsPage from "../pages/ContractsPage";
import type { Contract, Labour } from "../types";

// Vitest globals are not enabled, so Testing Library's automatic cleanup does
// not run between tests. Clean up explicitly to avoid DOM accumulation.
afterEach(() => cleanup());

// The generated backend bindings import ExternalBlob from object-storage,
// whose ESM layout is not resolvable under Vitest's resolver. Mock it so the
// import chain loads.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: { fromBytes: (b: Uint8Array) => ({ bytes: b }) },
}));

const { addContractMock, addWorkColumnMock, setAttendanceMock } = vi.hoisted(
  () => ({
    addContractMock: vi.fn(),
    addWorkColumnMock: vi.fn(),
    setAttendanceMock: vi.fn(),
  }),
);

const createdContract: Contract = {
  id: 99n,
  name: "New Batch Contract",
  multiplier: 1,
  contractAmount: 50000,
  machineExpenses: 2000,
  bedAmount: 30000,
  paperAmount: 15000,
  meshAmount: 3000,
  settled: false,
  createdAt: 1705276800000000000n,
  workColumns: [],
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

// The combined contract+attendance flow is gated behind the admin role (the
// only role that can both create contracts and mark attendance), so the mock
// must report isAdmin: true for the FAB to render.
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ canEdit: true, isAdmin: true }),
}));

vi.mock("../hooks/useBackend", () => ({
  useContracts: () => ({ data: [], isLoading: false }),
  useAddContract: () => ({ mutate: addContractMock, isPending: false }),
  useAddWorkColumn: () => ({ mutate: addWorkColumnMock, isPending: false }),
  useSetAttendance: () => ({ mutate: setAttendanceMock, isPending: false }),
  useLabours: () => ({ data: labours }),
  useGetActiveLabours: () => ({ data: labours }),
  useUpdateContract: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("combined contract creation + attendance flow", () => {
  it("creates a contract and marks attendance for it in a single flow", async () => {
    const user = userEvent.setup();
    render(<ContractsPage />);

    // Open the combined flow via the floating action button.
    await user.click(screen.getByRole("button", { name: "Add Contract" }));
    expect(
      screen.getByRole("heading", { name: "New Contract + Attendance" }),
    ).toBeInTheDocument();

    // Step 1 — enter contract details and create the contract.
    await user.type(
      screen.getByLabelText("Contract Name"),
      "New Batch Contract",
    );
    await user.type(screen.getByLabelText("Contract Amount (₹)"), "50000");
    await user.click(screen.getByRole("button", { name: "Create Contract" }));

    // The contract creation mutation is invoked with the entered details.
    expect(addContractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Batch Contract",
        contractAmount: 50000,
      }),
      expect.any(Object),
    );

    // Simulate the backend resolving the created contract, then add a work
    // column so attendance can be marked against it.
    const onSuccess = addContractMock.mock.calls[0][1].onSuccess;
    act(() => onSuccess(createdContract));
    await user.click(screen.getByRole("button", { name: "+ Bed" }));
    expect(addWorkColumnMock).toHaveBeenCalledWith(
      { contractId: 99n, name: "", workType: "bed" },
      expect.any(Object),
    );
    // Resolve the column add with a contract that now has the bed column.
    const colOnSuccess = addWorkColumnMock.mock.calls[0][1].onSuccess;
    act(() =>
      colOnSuccess({
        ...createdContract,
        workColumns: [{ id: "col-1", workType: "bed", name: "Bed 1" }],
      }),
    );

    // Step 2 — mark attendance for the newly created contract.
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getByText(/Mark attendance for/)).toBeInTheDocument();

    // The labour row is shown with a Present/Absent selector for the bed column.
    const table = screen.getByRole("table");
    expect(within(table).getByText("Ramesh Kumar")).toBeInTheDocument();
    const select = within(table).getByRole("combobox");
    await user.selectOptions(select, "Present");

    // Step 3 — confirm and save.
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getByText("Labours Marked")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save & Finish" }));

    // Attendance is recorded for the newly created contract.
    expect(setAttendanceMock).toHaveBeenCalledWith({
      contractId: 99n,
      labourId: 1n,
      columnId: "col-1",
      value: { __kind__: "present", present: null },
    });
  });
});

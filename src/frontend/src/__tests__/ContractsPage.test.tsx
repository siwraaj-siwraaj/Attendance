import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContractsPage from "../pages/ContractsPage";

// Vitest globals are not enabled, so Testing Library's automatic cleanup does
// not run between tests. Clean up explicitly to avoid DOM accumulation.
afterEach(() => cleanup());

// The generated backend bindings import ExternalBlob from object-storage,
// whose ESM layout is not resolvable under Vitest's resolver. Mock it so the
// import chain loads.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: { fromBytes: (b: Uint8Array) => ({ bytes: b }) },
}));

const { contract } = vi.hoisted(() => ({
  contract: {
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
  },
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ canEdit: true, isAdmin: true })),
}));

import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useBackend", () => ({
  useContracts: () => ({ data: [contract], isLoading: false }),
  useAddContract: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateContract: () => ({ mutate: vi.fn(), isPending: false }),
}));

// The component only consumes canEdit and isAdmin from useAuth; the rest of
// the auth context is irrelevant to these tests. Cast through unknown because
// AuthContextType is not exported from the hook module.
const authStub = (overrides: { canEdit?: boolean; isAdmin?: boolean }) =>
  ({ canEdit: true, isAdmin: true, ...overrides }) as unknown as ReturnType<
    typeof useAuth
  >;

describe("combined contract → attendance flow", () => {
  it("invokes onViewAttendance with the contract id from the list", async () => {
    const user = userEvent.setup();
    const onViewAttendance = vi.fn();
    render(<ContractsPage onViewAttendance={onViewAttendance} />);

    // The seeded contract is listed.
    expect(
      await screen.findByText("Sunrise Textiles — Bed Batch A"),
    ).toBeInTheDocument();

    // Expand the contract row to reveal the "View Attendance" action.
    await user.click(
      screen.getByRole("button", { name: /toggle contract details/i }),
    );
    await user.click(screen.getByRole("button", { name: /view attendance/i }));

    // The flow hands the selected contract to the attendance view.
    expect(onViewAttendance).toHaveBeenCalledWith(7n);
  });
});

describe("combined-flow FAB admin gating", () => {
  it("shows the Add Contract FAB to the admin role", () => {
    vi.mocked(useAuth).mockReturnValue(authStub({ isAdmin: true }));
    render(<ContractsPage />);
    expect(
      screen.getByRole("button", { name: "Add Contract" }),
    ).toBeInTheDocument();
  });

  it("hides the Add Contract FAB from non-admin roles that can edit", () => {
    // A contractOnly role can edit contracts but cannot mark attendance, so it
    // must not be offered the combined flow.
    vi.mocked(useAuth).mockReturnValue(authStub({ isAdmin: false }));
    render(<ContractsPage />);
    expect(
      screen.queryByRole("button", { name: "Add Contract" }),
    ).not.toBeInTheDocument();
  });
});

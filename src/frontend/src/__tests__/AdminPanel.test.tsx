import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Role, UserStatus } from "../backend";
import type { UserInfo } from "../backend";
import AdminPanel from "../pages/AdminPanel";

// Vitest globals are not enabled, so Testing Library's automatic cleanup does
// not run between tests. Clean up explicitly to avoid DOM accumulation.
afterEach(() => cleanup());

// The generated backend bindings import ExternalBlob from object-storage,
// whose ESM layout is not resolvable under Vitest's resolver. Mock it so the
// import chain loads.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: { fromBytes: (b: Uint8Array) => ({ bytes: b }) },
}));

const { createUserMock, updateUserCredentialsMock } = vi.hoisted(() => ({
  createUserMock: vi.fn(),
  updateUserCredentialsMock: vi.fn(),
}));

const users: UserInfo[] = [
  { username: "siwraaj", role: Role.admin, status: UserStatus.approved },
  { username: "rossie", role: Role.viewOnly, status: UserStatus.approved },
];

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ isAdmin: true }),
}));

vi.mock("../hooks/useBackend", () => ({
  useListUsers: () => ({ data: users, isLoading: false, isError: false }),
  useCreateUser: () => ({
    mutate: createUserMock,
    isPending: false,
  }),
  useUpdateUserCredentials: () => ({
    mutate: updateUserCredentialsMock,
    isPending: false,
  }),
  useApproveUser: () => ({ mutate: vi.fn(), isPending: false }),
  useSetUserRole: () => ({ mutate: vi.fn(), isPending: false }),
  useRevokeAccess: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("admin panel user management", () => {
  it("lists all user accounts with their usernames", () => {
    render(<AdminPanel />);
    expect(screen.getByText("siwraaj")).toBeInTheDocument();
    expect(screen.getByText("rossie")).toBeInTheDocument();
  });

  it("creates a new user account with a username and password", async () => {
    const user = userEvent.setup();
    render(<AdminPanel />);

    await user.type(screen.getByLabelText("Username"), "newbie");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(createUserMock).toHaveBeenCalledWith(
      { username: "newbie", password: "secret", role: Role.viewOnly },
      expect.any(Object),
    );
  });

  it("changes a user's username and/or password from the credentials modal", async () => {
    const user = userEvent.setup();
    render(<AdminPanel />);

    // Open the credentials modal for the "rossie" account.
    const editButtons = screen.getAllByRole("button", { name: "Credentials" });
    await user.click(editButtons[1]);

    // Scope to the edit modal — the create-user form also has a "Username"
    // label, so target the modal's own inputs by id.
    const modal = screen.getByRole("dialog");
    const usernameInput = within(modal).getByLabelText("Username");
    await user.clear(usernameInput);
    await user.type(usernameInput, "rossie2");
    await user.type(within(modal).getByLabelText("New password"), "newpass");
    await user.click(
      within(modal).getByRole("button", { name: "Save changes" }),
    );

    expect(updateUserCredentialsMock).toHaveBeenCalledWith(
      {
        oldUsername: "rossie",
        newUsername: "rossie2",
        newPassword: "newpass",
      },
      expect.any(Object),
    );
  });
});

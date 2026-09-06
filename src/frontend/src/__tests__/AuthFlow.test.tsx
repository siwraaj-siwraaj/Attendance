import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Role, UserStatus } from "../backend";
import { AuthProvider, useAuth } from "../hooks/useAuth";

// The generated backend bindings import ExternalBlob from object-storage,
// whose ESM layout is not resolvable under Vitest's resolver. Mock it so the
// import chain loads.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: { fromBytes: (b: Uint8Array) => ({ bytes: b }) },
}));

const { loginMock, logoutMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
}));

// Mock the actor seam used by useAuth. useAuth now resolves the backend actor
// through useBackendActor (from ./useBackend), which wraps createActor. login
// resolves the seeded admin (siwraaj / 74482) with the admin role and approved
// status.
vi.mock("../hooks/useBackend", () => ({
  useBackendActor: () => ({
    actor: {
      login: loginMock,
      logout: logoutMock,
      getCallerStatus: vi.fn(),
      getCallerRole: vi.fn(),
    },
    actorReady: true,
  }),
}));

function AuthProbe() {
  const { isAuthenticated, role, status, isAdmin, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="role">{role ?? "none"}</span>
      <span data-testid="status">{status ?? "none"}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <button type="button" onClick={() => void login("siwraaj", "74482")}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  loginMock.mockReset();
  logoutMock.mockReset();
});

describe("username/password auth resolves identity and role by username", () => {
  it("grants the admin role and approved status on valid credentials", async () => {
    loginMock.mockResolvedValue({
      username: "siwraaj",
      role: Role.admin,
      status: UserStatus.approved,
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");

    await user.click(screen.getByRole("button", { name: "login" }));

    expect(loginMock).toHaveBeenCalledWith({
      username: "siwraaj",
      password: "74482",
    });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("role")).toHaveTextContent(Role.admin);
    expect(screen.getByTestId("status")).toHaveTextContent(UserStatus.approved);
    expect(screen.getByTestId("isAdmin")).toHaveTextContent("true");
  });

  it("does not authenticate when credentials are invalid", async () => {
    loginMock.mockResolvedValue(null);
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "login" }));

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("role")).toHaveTextContent("none");
  });

  it("signs out and clears the session", async () => {
    loginMock.mockResolvedValue({
      username: "siwraaj",
      role: Role.admin,
      status: UserStatus.approved,
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "login" }));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "logout" }));

    expect(logoutMock).toHaveBeenCalled();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("role")).toHaveTextContent("none");
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../pages/LoginPage";

// Vitest globals are not enabled, so Testing Library's automatic cleanup does
// not run between tests. Clean up explicitly to avoid DOM accumulation.
afterEach(() => cleanup());

// The generated backend bindings import ExternalBlob from object-storage,
// whose ESM layout is not resolvable under Vitest's resolver. Mock it so the
// import chain loads.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: { fromBytes: (b: Uint8Array) => ({ bytes: b }) },
}));

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe("unified username/password login form", () => {
  it("shows a single username+password form with no Internet Identity button and no admin/user toggle", () => {
    render(<LoginPage />);

    // The unified form is present.
    expect(
      screen.getByRole("heading", { name: "Sign in to continue" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();

    // No Internet Identity button and no admin/user mode toggle.
    expect(screen.queryByText(/internet identity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/user mode/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /admin/i }),
    ).not.toBeInTheDocument();
  });

  it("submits the entered username and password to login", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(true);
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Username"), "siwraaj");
    await user.type(screen.getByLabelText("Password"), "74482");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(loginMock).toHaveBeenCalledWith("siwraaj", "74482");
  });

  it("shows an error and stays on the login page when credentials are invalid", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(false);
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Username"), "nobody");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      await screen.findByText("Invalid username or password"),
    ).toBeInTheDocument();
    // Still on the login page — the form is still present.
    expect(
      screen.getByRole("heading", { name: "Sign in to continue" }),
    ).toBeInTheDocument();
  });
});

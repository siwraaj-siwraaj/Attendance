import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

// The generated backend bindings import ExternalBlob from object-storage,
// whose ESM layout is not resolvable under Vitest's resolver. Mock it so the
// import chain loads.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: { fromBytes: (b: Uint8Array) => ({ bytes: b }) },
}));

// An unauthenticated user must be gated behind the login screen before any
// app data is reachable. This is stable behavior that the auth rework must
// preserve: the app still requires a sign-in before showing the workspace.
// useAuth resolves the backend actor through useBackendActor; with no actor
// resolved the user is not authenticated and the login screen is shown.
vi.mock("../hooks/useBackend", () => ({
  useBackendActor: () => ({ actor: null, actorReady: false }),
}));

describe("unauthenticated gate", () => {
  it("shows the login screen instead of the workspace", () => {
    render(<App />);
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.queryByText("Contracts")).not.toBeInTheDocument();
  });
});

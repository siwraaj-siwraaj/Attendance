import { QueryClient } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

type CanisterIdsJson = Record<string, { ic?: string; local?: string } | string>;
type EnvJson = Record<string, string>;

function isValidCanisterId(id: string | undefined | null): id is string {
  return !!id && id !== "undefined" && id !== "null" && id.length > 0;
}

function storeCanisterId(id: string) {
  (window as unknown as Record<string, unknown>).__CANISTER_IDS__ = {
    backend: id,
  };
  console.log("[Rossie] Backend canister ID resolved:", id);
}

async function resolveCanisterId(): Promise<string | null> {
  const envId = (process.env as Record<string, string | undefined>)
    .CANISTER_ID_BACKEND;
  if (isValidCanisterId(envId)) return envId;

  // Try all sources in parallel — fastest wins
  const sources = [
    fetch("/canister_ids.json")
      .then(async (r) => {
        if (!r.ok) return null;
        const data = (await r.json()) as CanisterIdsJson;
        const entry = data.backend;
        if (!entry) return null;
        const id =
          typeof entry === "string" ? entry : (entry.ic ?? entry.local ?? "");
        return isValidCanisterId(id) ? id : null;
      })
      .catch(() => null),
    fetch("/env.json")
      .then(async (r) => {
        if (!r.ok) return null;
        const data = (await r.json()) as EnvJson;
        return isValidCanisterId(data.backend_canister_id)
          ? data.backend_canister_id
          : null;
      })
      .catch(() => null),
    fetch("/.well-known/canister_ids.json")
      .then(async (r) => {
        if (!r.ok) return null;
        const data = (await r.json()) as CanisterIdsJson;
        const entry = data.backend;
        if (!entry) return null;
        const id =
          typeof entry === "string" ? entry : (entry.ic ?? entry.local ?? "");
        return isValidCanisterId(id) ? id : null;
      })
      .catch(() => null),
  ];

  // Return first non-null result
  const results = await Promise.all(sources);
  const id = results.find((r) => r !== null) ?? null;
  if (!id) console.warn("[Rossie] Could not resolve backend canister ID.");
  return id;
}

// Shared QueryClient instance — also used for prefetch in main.tsx
export const sharedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[Rossie] Root element not found — cannot mount React.");
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App queryClient={sharedQueryClient} />
    </React.StrictMode>,
  );
}

// Resolve canister ID + warm up JS chunks — all in background, never block mount.
// Chunk prefetching starts immediately, in parallel with canister resolution,
// so tab switches feel instant without delaying the first paint.
(async () => {
  // Eagerly prefetch page chunks so tab switches feel instant. Fire-and-forget
  // (not awaited) so a slow canister resolution never delays the prefetch.
  const chunkPrefetches = [
    import("./pages/ContractsPage"),
    import("./pages/AttendancePage"),
    import("./pages/AdvancesPage"),
    import("./pages/PaymentsPage"),
    import("./pages/LaboursPage"),
    import("./pages/SettledPage"),
  ];
  void Promise.allSettled(chunkPrefetches);

  try {
    const canisterId = await Promise.race([
      resolveCanisterId(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    if (canisterId) {
      storeCanisterId(canisterId);
    }
  } catch (err) {
    console.error("[Rossie] Canister resolution failed:", err);
  }
})();

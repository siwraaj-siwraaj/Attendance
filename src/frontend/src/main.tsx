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

const QUERY_CACHE_KEY = "rossie.queryCache.v1";
const PERSISTED_QUERY_KEYS = [["contracts"], ["labours"], ["labours", "active"]];

function encodeCache(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    typeof item === "bigint" ? { __rossieBigInt: item.toString() } : item,
  );
}

function decodeCache(value: string): unknown {
  return JSON.parse(value, (_key, item) =>
    item && typeof item === "object" && "__rossieBigInt" in item
      ? BigInt((item as { __rossieBigInt: string }).__rossieBigInt)
      : item,
  );
}

function restoreQueryCache(queryClient: QueryClient) {
  try {
    const raw = localStorage.getItem(QUERY_CACHE_KEY);
    if (!raw) return;
    const saved = decodeCache(raw) as Array<{ queryKey: unknown[]; data: unknown; updatedAt: number }>;
    for (const entry of saved) {
      if (Array.isArray(entry.queryKey) && entry.data !== undefined) {
        queryClient.setQueryData(entry.queryKey, entry.data, { updatedAt: entry.updatedAt ?? 0 });
      }
    }
  } catch {
    localStorage.removeItem(QUERY_CACHE_KEY);
  }
}

function persistQueryCache(queryClient: QueryClient) {
  try {
    const saved = PERSISTED_QUERY_KEYS.map((queryKey) => {
      const query = queryClient.getQueryCache().find({ queryKey });
      return query?.state.data === undefined
        ? null
        : { queryKey, data: query.state.data, updatedAt: query.state.dataUpdatedAt };
    }).filter(Boolean);
    localStorage.setItem(QUERY_CACHE_KEY, encodeCache(saved));
  } catch {
    // Cache is only an acceleration layer.
  }
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

restoreQueryCache(sharedQueryClient);
sharedQueryClient.getQueryCache().subscribe(() => persistQueryCache(sharedQueryClient));

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
  // Page modules are lazy-loaded when needed so startup can prioritize auth and the first screen.

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

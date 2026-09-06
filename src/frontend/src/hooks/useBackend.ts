import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ExternalBlob, type Role, createActor } from "../backend";

export function useBackendActor() {
  const [actor, setActor] = useState<ReturnType<typeof createActor> | null>(
    () => {
      // Try sync sources first
      const envId = (process.env as Record<string, string | undefined>)
        .CANISTER_ID_BACKEND;
      const isValid = (id: string | undefined | null): id is string =>
        !!id && id !== "undefined" && id !== "null" && id.length > 0;
      if (isValid(envId)) {
        return createActor(
          envId,
          () => Promise.resolve(new Uint8Array() as Uint8Array<ArrayBuffer>),
          (b: Uint8Array) =>
            Promise.resolve(
              ExternalBlob.fromBytes(b as Uint8Array<ArrayBuffer>),
            ),
        );
      }
      return null;
    },
  );

  useEffect(() => {
    if (actor) return; // already have one
    const isValid = (id: string | undefined | null): id is string =>
      !!id && id !== "undefined" && id !== "null" && id.length > 0;

    // Poll until the canister ID appears. We deliberately do NOT give up after
    // a fixed number of attempts: the canister ID can be injected onto
    // window.__CANISTER_IDS__.backend asynchronously (after the first tab has
    // already mounted), and permanently clearing the interval here left the
    // initially-open tab blank until a tab switch remounted it and restarted
    // the polling. Keeping the interval alive means the actor is created the
    // moment the ID appears, so the first tab's queries fire without a switch.
    const interval = setInterval(() => {
      const winIds = (
        window as unknown as Record<string, Record<string, string> | undefined>
      ).__CANISTER_IDS__;
      const canisterId = winIds?.backend;
      if (isValid(canisterId)) {
        setActor(
          createActor(
            canisterId,
            () => Promise.resolve(new Uint8Array() as Uint8Array<ArrayBuffer>),
            (b: Uint8Array) =>
              Promise.resolve(
                ExternalBlob.fromBytes(b as Uint8Array<ArrayBuffer>),
              ),
          ),
        );
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [actor]);

  // `actorReady` is derived directly from the `actor` state so that the moment
  // the backend actor resolves, every query gated on `enabled: actorReady`
  // re-renders and fires. Deriving it from a ref (as before) did not reliably
  // re-render the initially-open tab, leaving it blank until a tab switch.
  return { actor, actorReady: actor !== null };
}

// Labours

export function useLabours() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["labours"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    queryFn: () => actor!.getLabours(),
    enabled: actorReady,
  });
}

export function useAddLabour() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      name,
      employeeId,
      joinDate,
    }: { name: string; employeeId: string; joinDate: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addLabour(name, employeeId, joinDate);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    // Optimistic add: insert a temporary labour into the cache immediately so
    // the UI never blocks on the round-trip. The real labour (with a server-
    // assigned id and createdAt) replaces the placeholder on success.
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["labours"] });
      const prev = qc.getQueryData(["labours"]);
      const tempId = BigInt(`-1${Date.now()}`);
      const optimistic: Record<string, unknown> = {
        id: tempId,
        name: vars.name,
        employeeId: vars.employeeId,
        joinDate: vars.joinDate,
        isActive: true,
        createdAt: BigInt(Date.now()) * 1_000_000n,
        __optimistic: true,
      };
      qc.setQueryData(
        ["labours"],
        (old: Array<Record<string, unknown>> | undefined) => [
          ...(old ?? []),
          optimistic,
        ],
      );
      return { prev, tempId };
    },
    onSuccess: (newLabour, _vars, ctx) => {
      const c = ctx as { prev?: unknown; tempId?: bigint } | undefined;
      const tempId = c?.tempId;
      const created = newLabour as unknown as Record<string, unknown>;
      if (tempId !== undefined) {
        qc.setQueryData(
          ["labours"],
          (old: Array<Record<string, unknown>> | undefined) =>
            (old ?? []).map((item) => (item.id === tempId ? created : item)),
        );
      }
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["labours"], c.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["labours"] });
      qc.invalidateQueries({ queryKey: ["labours", "active"] });
    },
  });
}

export function useUpdateLabour() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      id,
      name,
      employeeId,
      joinDate,
      isActive,
    }: {
      id: bigint;
      name: string;
      employeeId: string;
      joinDate: string;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateLabour(
        id,
        name,
        employeeId,
        joinDate,
        isActive,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["labours"] });
      const prev = qc.getQueryData<unknown[]>(["labours"]) ?? [];
      qc.setQueryData(
        ["labours"],
        (prev as Array<{ id: bigint; isActive?: boolean }>).map((l) =>
          l.id === vars.id
            ? {
                ...l,
                isActive: vars.isActive,
                name: vars.name,
                employeeId: vars.employeeId,
                joinDate: vars.joinDate,
              }
            : l,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["labours"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["labours"] });
      qc.invalidateQueries({ queryKey: ["labours", "active"] });
    },
  });
}

export function useGetActiveLabours() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["labours", "active"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    queryFn: () => actor!.getActiveLabours(),
    enabled: actorReady,
  });
}

// Contracts

export function useContracts() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["contracts"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    queryFn: () => actor!.getContracts(),
    enabled: actorReady,
  });
}

type AddContractVars = {
  name: string;
  multiplier: number;
  contractAmount: number;
  machineExpenses: number;
  bedAmount: number;
  paperAmount: number;
  meshAmount: number;
};

// Optimistic add: insert a temporary contract into the cache immediately so
// the UI never blocks on the round-trip. The real contract (with a server-
// assigned id and createdAt) replaces the placeholder on success.
export function useAddContract() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async (vars: AddContractVars) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addContract(
        vars.name,
        vars.multiplier,
        vars.contractAmount,
        vars.machineExpenses,
        vars.bedAmount,
        vars.paperAmount,
        vars.meshAmount,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars: AddContractVars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      const tempId = BigInt(`-1${Date.now()}`);
      const optimistic: Record<string, unknown> = {
        id: tempId,
        name: vars.name,
        multiplier: vars.multiplier,
        contractAmount: vars.contractAmount,
        machineExpenses: vars.machineExpenses,
        bedAmount: vars.bedAmount,
        paperAmount: vars.paperAmount,
        meshAmount: vars.meshAmount,
        workColumns: [],
        settled: false,
        createdAt: BigInt(Date.now()) * 1_000_000n,
        __optimistic: true,
      };
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) => [
          ...(old ?? []),
          optimistic,
        ],
      );
      return { prev, tempId };
    },
    onSuccess: (newContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; tempId?: bigint } | undefined;
      const tempId = c?.tempId;
      const created = newContract as unknown as Record<string, unknown>;
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) =>
          (old ?? []).map((item) =>
            tempId !== undefined && item.id === tempId ? created : item,
          ),
      );
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

type UpdateContractVars = {
  id: bigint;
  name: string;
  multiplier: number;
  contractAmount: number;
  machineExpenses: number;
  bedAmount: number;
  paperAmount: number;
  meshAmount: number;
};

export function useUpdateContract() {
  // Optimistic update for contract edits
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation<unknown, Error, UpdateContractVars>({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      id,
      name,
      multiplier,
      contractAmount,
      machineExpenses,
      bedAmount,
      paperAmount,
      meshAmount,
    }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateContract(
        id,
        name,
        multiplier,
        contractAmount,
        machineExpenses,
        bedAmount,
        paperAmount,
        meshAmount,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars: UpdateContractVars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) =>
          (old ?? []).map((c) =>
            c.id === vars.id
              ? {
                  ...c,
                  name: vars.name,
                  multiplier: vars.multiplier,
                  contractAmount: vars.contractAmount,
                  machineExpenses: vars.machineExpenses,
                  bedAmount: vars.bedAmount,
                  paperAmount: vars.paperAmount,
                  meshAmount: vars.meshAmount,
                }
              : c,
          ),
      );
      return { prev };
    },
    onError: (_e: unknown, _v: unknown, ctx: unknown) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useAddWorkColumn() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      contractId,
      name,
      workType,
    }: { contractId: bigint; name: string; workType: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addWorkColumn(contractId, name, workType);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      // Optimistic add: append a placeholder column to the target contract
      // so the UI re-renders with the new column immediately, before the
      // canister round-trip completes. The backend auto-generates the real
      // name (e.g. "Bed 1") when the passed name is empty; we use a
      // temporary placeholder name that is replaced by the real contract
      // snapshot returned in onSuccess.
      const optimisticColumn = {
        id: `optimistic-${Date.now()}`,
        name: vars.name.trim() || `New ${vars.workType}`,
        workType: vars.workType,
      };
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) =>
          (old ?? []).map((c) =>
            c.id === vars.contractId
              ? {
                  ...c,
                  workColumns: [
                    ...(c.workColumns as Array<Record<string, unknown>>),
                    optimisticColumn,
                  ],
                }
              : c,
          ),
      );
      return { prev, vars };
    },
    onSuccess: (updatedContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; vars?: unknown } | undefined;
      if (updatedContract) {
        const updated = updatedContract as unknown as Record<string, unknown>;
        qc.setQueryData(
          ["contracts"],
          (old: Array<Record<string, unknown>> | undefined) => {
            const list = (old ?? []).slice();
            const idx = list.findIndex((item) => item.id === updated.id);
            if (idx >= 0) list[idx] = updated;
            else list.push(updated);
            return list;
          },
        );
      } else if (c?.prev) {
        qc.setQueryData(["contracts"], c.prev);
      }
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useUpdateWorkColumn() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      contractId,
      columnId,
      name,
    }: { contractId: bigint; columnId: string; name: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateWorkColumn(contractId, columnId, name);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      // Optimistic rename: update the column name in the target contract's
      // workColumns immediately so the UI reflects the change before the
      // canister round-trip completes.
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) =>
          (old ?? []).map((c) =>
            c.id === vars.contractId
              ? {
                  ...c,
                  workColumns: (
                    c.workColumns as Array<Record<string, unknown>>
                  ).map((col) =>
                    col.id === vars.columnId
                      ? { ...col, name: vars.name }
                      : col,
                  ),
                }
              : c,
          ),
      );
      return { prev, vars };
    },
    onSuccess: (updatedContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; vars?: unknown } | undefined;
      if (updatedContract) {
        const updated = updatedContract as unknown as Record<string, unknown>;
        qc.setQueryData(
          ["contracts"],
          (old: Array<Record<string, unknown>> | undefined) => {
            const list = (old ?? []).slice();
            const idx = list.findIndex((item) => item.id === updated.id);
            if (idx >= 0) list[idx] = updated;
            else list.push(updated);
            return list;
          },
        );
      } else if (c?.prev) {
        qc.setQueryData(["contracts"], c.prev);
      }
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useRemoveWorkColumn() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      contractId,
      columnId,
    }: { contractId: bigint; columnId: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.removeWorkColumn(contractId, columnId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      // Optimistic removal: drop the column from the target contract's
      // workColumns immediately so the UI updates before the round-trip.
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) =>
          (old ?? []).map((c) =>
            c.id === vars.contractId
              ? {
                  ...c,
                  workColumns: (
                    c.workColumns as Array<Record<string, unknown>>
                  ).filter((col) => col.id !== vars.columnId),
                }
              : c,
          ),
      );
      return { prev, vars };
    },
    onSuccess: (updatedContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; vars?: unknown } | undefined;
      if (updatedContract) {
        const updated = updatedContract as unknown as Record<string, unknown>;
        qc.setQueryData(
          ["contracts"],
          (old: Array<Record<string, unknown>> | undefined) => {
            const list = (old ?? []).slice();
            const idx = list.findIndex((item) => item.id === updated.id);
            if (idx >= 0) list[idx] = updated;
            else list.push(updated);
            return list;
          },
        );
      } else if (c?.prev) {
        qc.setQueryData(["contracts"], c.prev);
      }
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useMarkContractSettled() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({ id, settled }: { id: bigint; settled: boolean }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.markContractSettled(id, settled);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    // Optimistic update: flip the settled flag in the contracts cache
    // immediately so the list reflects the change before the round-trip.
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) =>
          (old ?? []).map((c) =>
            c.id === vars.id ? { ...c, settled: vars.settled } : c,
          ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.deleteContract(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    // Optimistic removal: drop the deleted contract from every contracts
    // cache immediately so the list updates before the round-trip settles.
    // Snapshot the previous cache so onError can restore it verbatim.
    onMutate: async (id: bigint) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(
        ["contracts"],
        (old: Array<Record<string, unknown>> | undefined) =>
          (old ?? []).filter((c) => c.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown } | undefined;
      if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

// Attendance

export function useAttendance(contractId: bigint | null) {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["attendance", contractId?.toString()],
    queryFn: () => actor!.getAttendance(contractId!),
    enabled: contractId !== null && actorReady,
  });
}

export function useAllAttendance() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["attendance", "all"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    queryFn: () => actor!.getAllAttendance(),
    enabled: actorReady,
  });
}

export function useSetAttendance() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      contractId,
      labourId,
      columnId,
      value,
    }: {
      contractId: bigint;
      labourId: bigint;
      columnId: string;
      value:
        | { __kind__: "present"; present: null }
        | { __kind__: "absent"; absent: null }
        | { __kind__: "partial"; partial: number };
    }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.setAttendance(
        contractId,
        labourId,
        columnId,
        value as any,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    // Optimistic update: reflect the new attendance value in both the
    // per-contract cache and the all-attendance cache immediately, so the
    // dropdown reflects the change without waiting for the round-trip.
    onMutate: async (vars) => {
      const key = ["attendance", vars.contractId.toString()] as const;
      const allKey = ["attendance", "all"] as const;
      await qc.cancelQueries({ queryKey: ["attendance"] });
      const prev = qc.getQueryData(key);
      const prevAll = qc.getQueryData(allKey);
      const apply = (
        old: Array<Record<string, unknown>> | undefined,
      ): Array<Record<string, unknown>> => {
        const list = old ?? [];
        const idx = list.findIndex(
          (r) => r.labourId === vars.labourId && r.columnId === vars.columnId,
        );
        const record = {
          contractId: vars.contractId,
          labourId: vars.labourId,
          columnId: vars.columnId,
          value: vars.value,
        };
        if (idx >= 0) {
          const next = list.slice();
          next[idx] = { ...next[idx], value: vars.value };
          return next;
        }
        return [...list, record];
      };
      qc.setQueryData(key, apply);
      qc.setQueryData(allKey, apply);
      return { prev, prevAll, key, allKey };
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as
        | {
            prev?: unknown;
            prevAll?: unknown;
            key?: readonly string[];
            allKey?: readonly string[];
          }
        | undefined;
      if (c?.prev !== undefined && c.key) qc.setQueryData(c.key, c.prev);
      if (c?.prevAll !== undefined && c.allKey)
        qc.setQueryData(c.allKey, c.prevAll);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({
        queryKey: ["attendance", vars.contractId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["attendance", "all"] });
    },
  });
}

// Advances

export function useAdvances() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["advances"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    queryFn: () => actor!.getAdvances(),
    enabled: actorReady,
  });
}

export function useAdvancesByContract(contractId: bigint | null) {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["advances", contractId?.toString()],
    queryFn: () => actor!.getAdvancesByContract(contractId!),
    enabled: contractId !== null && actorReady,
  });
}

export function useAddAdvance() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      contractId,
      labourId,
      amount,
      note,
    }: {
      contractId: bigint;
      labourId: bigint;
      amount: number;
      note: string;
    }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addAdvance(contractId, labourId, amount, note);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    // Optimistic insert: push a placeholder advance into both the all-advances
    // cache and the per-contract cache so every view updates instantly. The
    // temp id is negative so it can never collide with a real server id; it is
    // swapped for the real advance returned by the canister in onSuccess.
    onMutate: async (vars) => {
      const allKey = ["advances"] as const;
      const byContractKey = ["advances", vars.contractId.toString()] as const;
      await qc.cancelQueries({ queryKey: ["advances"] });
      const prevAll = qc.getQueryData(allKey);
      const prevByContract = qc.getQueryData(byContractKey);
      const tempId = BigInt(`-1${Date.now()}`);
      const optimistic = {
        id: tempId,
        contractId: vars.contractId,
        labourId: vars.labourId,
        amount: vars.amount,
        note: vars.note,
        createdAt: BigInt(Date.now()) * 1_000_000n,
        __optimistic: true,
      };
      qc.setQueryData(
        allKey,
        (old: Array<Record<string, unknown>> | undefined) => [
          ...(old ?? []),
          optimistic,
        ],
      );
      qc.setQueryData(
        byContractKey,
        (old: Array<Record<string, unknown>> | undefined) => [
          ...(old ?? []),
          optimistic,
        ],
      );
      return { prevAll, prevByContract, tempId, byContractKey };
    },
    onSuccess: (newAdvance, _vars, ctx) => {
      const c = ctx as
        | {
            prevAll?: unknown;
            prevByContract?: unknown;
            tempId?: bigint;
            byContractKey?: readonly string[];
          }
        | undefined;
      const tempId = c?.tempId;
      const byContractKey = c?.byContractKey;
      const created = newAdvance as unknown as Record<string, unknown>;
      if (tempId !== undefined) {
        const replace = (
          old: Array<Record<string, unknown>> | undefined,
        ): Array<Record<string, unknown>> =>
          (old ?? []).map((item) => (item.id === tempId ? created : item));
        qc.setQueryData(["advances"], replace);
        if (byContractKey) qc.setQueryData(byContractKey, replace);
      }
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as
        | {
            prevAll?: unknown;
            prevByContract?: unknown;
            byContractKey?: readonly string[];
          }
        | undefined;
      if (c?.prevAll !== undefined) qc.setQueryData(["advances"], c.prevAll);
      if (c?.byContractKey && c.prevByContract !== undefined)
        qc.setQueryData(c.byContractKey, c.prevByContract);
    },
    onSettled: (_d, _e, vars, _ctx) => {
      qc.invalidateQueries({ queryKey: ["advances"] });
      qc.invalidateQueries({
        queryKey: ["advances", vars.contractId.toString()],
      });
    },
  });
}

export function useUpdateAdvance() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      id,
      amount,
      note,
    }: { id: bigint; amount: number; note: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateAdvance(id, amount, note);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["advances"] });
      const prev = qc.getQueryData<unknown[]>(["advances"]) ?? [];
      qc.setQueryData(
        ["advances"],
        (prev as Array<{ id: bigint; amount: number; note: string }>).map(
          (a) =>
            a.id === vars.id
              ? { ...a, amount: vars.amount, note: vars.note }
              : a,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["advances"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["advances"] }),
  });
}

export function useDeleteAdvance() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.deleteAdvance(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["advances"] });
      const prev = qc.getQueryData<unknown[]>(["advances"]) ?? [];
      qc.setQueryData(
        ["advances"],
        (prev as Array<{ id: bigint }>).filter((a) => a.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["advances"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["advances"] }),
  });
}

// Export/Import

export function useExportData() {
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: () => actor!.exportData(),
  });
}

export function useImportData() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async (json: string) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.importData(json);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

// Auth / Admin panel

/** Sign in with a username/password. Resolves the AuthResult on success, or
 *  null when the credentials are invalid. */
export function useLogin() {
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      username,
      password,
    }: { username: string; password: string }) => {
      if (!actor) throw new Error("Backend not connected");
      return actor.login({ username, password });
    },
  });
}

/** Sign out the current caller. */
export function useLogout() {
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async () => {
      if (!actor) throw new Error("Backend not connected");
      await actor.logout();
    },
  });
}

/** All users with their role and approval status. Admin only. */
export function useListUsers() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["users"],
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    queryFn: () => actor!.listUsers(),
    enabled: actorReady,
  });
}

/** Create a new user account with a username and password. Admin only. */
export function useCreateUser() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      username,
      password,
      role,
    }: { username: string; password: string; role: Role }) => {
      if (!actor) throw new Error("Backend not connected");
      return actor.createUser(username, password, role);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

/** Change a user's username and/or password. Admin only. */
export function useUpdateUserCredentials() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      oldUsername,
      newUsername,
      newPassword,
    }: {
      oldUsername: string;
      newUsername: string;
      newPassword: string | null;
    }) => {
      if (!actor) throw new Error("Backend not connected");
      return actor.updateUserCredentials(oldUsername, newUsername, newPassword);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

/** Approve a pending user and assign them a role in a single action. Admin only. */
export function useApproveUser() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      username,
      role,
    }: { username: string; role: Role }) => {
      if (!actor) throw new Error("Backend not connected");
      await actor.approveUser(username, role);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

/** Change an approved user's role at any time. Admin only. */
export function useSetUserRole() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({
      username,
      role,
    }: { username: string; role: Role }) => {
      if (!actor) throw new Error("Backend not connected");
      await actor.setUserRole(username, role);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

/** Revoke a user's access. Admin only. */
export function useRevokeAccess() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Backend not connected");
      await actor.revokeAccess(username);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Role } from "../backend";
import { createSupabaseActor } from "./supabaseActor";

export function useBackendActor() {
  const [actor] = useState(() => createSupabaseActor());
  return { actor, actorReady: true };
}

// Labours

export function useLabours() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["labours"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
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
    mutationFn: async ({ name, employeeId, joinDate }: { name: string; employeeId: string; joinDate: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addLabour(name, employeeId, joinDate);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["labours"] });
      const prev = qc.getQueryData(["labours"]);
      const tempId = BigInt(`-1${Date.now()}`);
      const optimistic: Record<string, unknown> = { id: tempId, name: vars.name, employeeId: vars.employeeId, joinDate: vars.joinDate, isActive: true, createdAt: BigInt(Date.now()) * 1_000_000n, __optimistic: true };
      qc.setQueryData(["labours"], (old: Array<Record<string, unknown>> | undefined) => [...(old ?? []), optimistic]);
      return { prev, tempId };
    },
    onSuccess: (newLabour, _vars, ctx) => {
      const c = ctx as { prev?: unknown; tempId?: bigint } | undefined;
      const tempId = c?.tempId;
      const created = newLabour as unknown as Record<string, unknown>;
      if (tempId !== undefined) qc.setQueryData(["labours"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).map((item) => (item.id === tempId ? created : item)));
    },
    onError: (_e, _v, ctx) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["labours"], c.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["labours"] }); qc.invalidateQueries({ queryKey: ["labours", "active"] }); },
  });
}

export function useUpdateLabour() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({ id, name, employeeId, joinDate, isActive }: { id: bigint; name: string; employeeId: string; joinDate: string; isActive: boolean }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateLabour(id, name, employeeId, joinDate, isActive);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["labours"] });
      const prev = qc.getQueryData<unknown[]>(["labours"]) ?? [];
      qc.setQueryData(["labours"], (prev as Array<{ id: bigint; isActive?: boolean }>).map((l) => l.id === vars.id ? { ...l, isActive: vars.isActive, name: vars.name, employeeId: vars.employeeId, joinDate: vars.joinDate } : l));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["labours"], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["labours"] }); qc.invalidateQueries({ queryKey: ["labours", "active"] }); },
  });
}

export function useGetActiveLabours() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["labours", "active"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
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
    refetchOnMount: true,
    queryFn: () => actor!.getContracts(),
    enabled: actorReady,
  });
}

type AddContractVars = { name: string; multiplier: number; contractAmount: number; machineExpenses: number; bedAmount: number; paperAmount: number; meshAmount: number };

export function useAddContract() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async (vars: AddContractVars) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addContract(vars.name, vars.multiplier, vars.contractAmount, vars.machineExpenses, vars.bedAmount, vars.paperAmount, vars.meshAmount);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars: AddContractVars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      const tempId = BigInt(`-1${Date.now()}`);
      const optimistic: Record<string, unknown> = { id: tempId, name: vars.name, multiplier: vars.multiplier, contractAmount: vars.contractAmount, machineExpenses: vars.machineExpenses, bedAmount: vars.bedAmount, paperAmount: vars.paperAmount, meshAmount: vars.meshAmount, workColumns: [], settled: false, createdAt: BigInt(Date.now()) * 1_000_000n, __optimistic: true };
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => [...(old ?? []), optimistic]);
      return { prev, tempId };
    },
    onSuccess: (newContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; tempId?: bigint } | undefined;
      const tempId = c?.tempId;
      const created = newContract as unknown as Record<string, unknown>;
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).map((item) => tempId !== undefined && item.id === tempId ? created : item));
    },
    onError: (_e, _v, ctx) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["contracts"], c.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

type UpdateContractVars = { id: bigint; name: string; multiplier: number; contractAmount: number; machineExpenses: number; bedAmount: number; paperAmount: number; meshAmount: number };

export function useUpdateContract() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation<unknown, Error, UpdateContractVars>({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({ id, name, multiplier, contractAmount, machineExpenses, bedAmount, paperAmount, meshAmount }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateContract(id, name, multiplier, contractAmount, machineExpenses, bedAmount, paperAmount, meshAmount);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars: UpdateContractVars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).map((c) => c.id === vars.id ? { ...c, name: vars.name, multiplier: vars.multiplier, contractAmount: vars.contractAmount, machineExpenses: vars.machineExpenses, bedAmount: vars.bedAmount, paperAmount: vars.paperAmount, meshAmount: vars.meshAmount } : c));
      return { prev };
    },
    onError: (_e: unknown, _v: unknown, ctx: unknown) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["contracts"], c.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useAddWorkColumn() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({ contractId, name, workType }: { contractId: bigint; name: string; workType: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addWorkColumn(contractId, name, workType);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      const optimisticColumn = { id: `optimistic-${Date.now()}`, name: vars.name.trim() || `New ${vars.workType}`, workType: vars.workType };
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).map((c) => c.id === vars.contractId ? { ...c, workColumns: [...(c.workColumns as Array<Record<string, unknown>>), optimisticColumn] } : c));
      return { prev, vars };
    },
    onSuccess: (updatedContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; vars?: unknown } | undefined;
      if (updatedContract) {
        const updated = updatedContract as unknown as Record<string, unknown>;
        qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => { const list = (old ?? []).slice(); const idx = list.findIndex((item) => item.id === updated.id); if (idx >= 0) list[idx] = updated; else list.push(updated); return list; });
      } else if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onError: (_e, _v, ctx) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["contracts"], c.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useUpdateWorkColumn() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({ contractId, columnId, name }: { contractId: bigint; columnId: string; name: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateWorkColumn(contractId, columnId, name);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).map((c) => c.id === vars.contractId ? { ...c, workColumns: (c.workColumns as Array<Record<string, unknown>>).map((col) => col.id === vars.columnId ? { ...col, name: vars.name } : col) } : c));
      return { prev, vars };
    },
    onSuccess: (updatedContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; vars?: unknown } | undefined;
      if (updatedContract) {
        const updated = updatedContract as unknown as Record<string, unknown>;
        qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => { const list = (old ?? []).slice(); const idx = list.findIndex((item) => item.id === updated.id); if (idx >= 0) list[idx] = updated; else list.push(updated); return list; });
      } else if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onError: (_e, _v, ctx) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["contracts"], c.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useRemoveWorkColumn() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({ contractId, columnId }: { contractId: bigint; columnId: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.removeWorkColumn(contractId, columnId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).map((c) => c.id === vars.contractId ? { ...c, workColumns: (c.workColumns as Array<Record<string, unknown>>).filter((col) => col.id !== vars.columnId) } : c));
      return { prev, vars };
    },
    onSuccess: (updatedContract, _vars, ctx) => {
      const c = ctx as { prev?: unknown; vars?: unknown } | undefined;
      if (updatedContract) {
        const updated = updatedContract as unknown as Record<string, unknown>;
        qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => { const list = (old ?? []).slice(); const idx = list.findIndex((item) => item.id === updated.id); if (idx >= 0) list[idx] = updated; else list.push(updated); return list; });
      } else if (c?.prev) qc.setQueryData(["contracts"], c.prev);
    },
    onError: (_e, _v, ctx) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["contracts"], c.prev); },
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
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).map((c) => c.id === vars.id ? { ...c, settled: vars.settled } : c));
      return { prev };
    },
    onError: (_e, _v, ctx) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["contracts"], c.prev); },
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
    onMutate: async (id: bigint) => {
      await qc.cancelQueries({ queryKey: ["contracts"] });
      const prev = qc.getQueryData(["contracts"]);
      qc.setQueryData(["contracts"], (old: Array<Record<string, unknown>> | undefined) => (old ?? []).filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { const c = ctx as { prev?: unknown } | undefined; if (c?.prev) qc.setQueryData(["contracts"], c.prev); },
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
    refetchOnMount: true,
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
    mutationFn: async ({ contractId, labourId, columnId, value }: { contractId: bigint; labourId: bigint; columnId: string; value: { __kind__: "present"; present: null } | { __kind__: "absent"; absent: null } | { __kind__: "partial"; partial: number } }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.setAttendance(contractId, labourId, columnId, value as any);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      const key = ["attendance", vars.contractId.toString()] as const;
      const allKey = ["attendance", "all"] as const;
      await qc.cancelQueries({ queryKey: ["attendance"] });
      const prev = qc.getQueryData(key);
      const prevAll = qc.getQueryData(allKey);
      const apply = (old: Array<Record<string, unknown>> | undefined): Array<Record<string, unknown>> => {
        const list = old ?? [];
        const idx = list.findIndex((r) => r.labourId === vars.labourId && r.columnId === vars.columnId);
        const record = { contractId: vars.contractId, labourId: vars.labourId, columnId: vars.columnId, value: vars.value };
        if (idx >= 0) { const next = list.slice(); next[idx] = { ...next[idx], value: vars.value }; return next; }
        return [...list, record];
      };
      qc.setQueryData(key, apply);
      qc.setQueryData(allKey, apply);
      return { prev, prevAll, key, allKey };
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prev?: unknown; prevAll?: unknown; key?: readonly string[]; allKey?: readonly string[] } | undefined;
      if (c?.prev !== undefined && c.key) qc.setQueryData(c.key, c.prev);
      if (c?.prevAll !== undefined && c.allKey) qc.setQueryData(c.allKey, c.prevAll);
    },
    onSettled: (_d, _e, vars) => { qc.invalidateQueries({ queryKey: ["attendance", vars.contractId.toString()] }); qc.invalidateQueries({ queryKey: ["attendance", "all"] }); },
  });
}

// Advances

export function useAdvances() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({
    queryKey: ["advances"],
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
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
    mutationFn: async ({ contractId, labourId, amount, note }: { contractId: bigint; labourId: bigint; amount: number; note: string }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.addAdvance(contractId, labourId, amount, note);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      const allKey = ["advances"] as const;
      const byContractKey = ["advances", vars.contractId.toString()] as const;
      await qc.cancelQueries({ queryKey: ["advances"] });
      const prevAll = qc.getQueryData(allKey);
      const prevByContract = qc.getQueryData(byContractKey);
      const tempId = BigInt(`-1${Date.now()}`);
      const optimistic = { id: tempId, contractId: vars.contractId, labourId: vars.labourId, amount: vars.amount, note: vars.note, createdAt: BigInt(Date.now()) * 1_000_000n, __optimistic: true };
      qc.setQueryData(allKey, (old: Array<Record<string, unknown>> | undefined) => [...(old ?? []), optimistic]);
      qc.setQueryData(byContractKey, (old: Array<Record<string, unknown>> | undefined) => [...(old ?? []), optimistic]);
      return { prevAll, prevByContract, tempId, byContractKey };
    },
    onSuccess: (newAdvance, _vars, ctx) => {
      const c = ctx as { prevAll?: unknown; prevByContract?: unknown; tempId?: bigint; byContractKey?: readonly string[] } | undefined;
      const tempId = c?.tempId;
      const byContractKey = c?.byContractKey;
      const created = newAdvance as unknown as Record<string, unknown>;
      if (tempId !== undefined) {
        const replace = (old: Array<Record<string, unknown>> | undefined): Array<Record<string, unknown>> => (old ?? []).map((item) => (item.id === tempId ? created : item));
        qc.setQueryData(["advances"], replace);
        if (byContractKey) qc.setQueryData(byContractKey, replace);
      }
    },
    onError: (_e, _v, ctx) => {
      const c = ctx as { prevAll?: unknown; prevByContract?: unknown; byContractKey?: readonly string[] } | undefined;
      if (c?.prevAll !== undefined) qc.setQueryData(["advances"], c.prevAll);
      if (c?.byContractKey && c.prevByContract !== undefined) qc.setQueryData(c.byContractKey, c.prevByContract);
    },
    onSettled: (_d, _e, vars, _ctx) => { qc.invalidateQueries({ queryKey: ["advances"] }); qc.invalidateQueries({ queryKey: ["advances", vars.contractId.toString()] }); },
  });
}

export function useUpdateAdvance() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: async ({ id, amount, note, cleared }: { id: bigint; amount: number; note: string; cleared?: boolean }) => {
      if (!actor) throw new Error("Backend not connected");
      const result = await actor.updateAdvance(id, amount, note, cleared ?? false);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["advances"] });
      const prev = qc.getQueryData<unknown[]>(["advances"]) ?? [];
      qc.setQueryData(["advances"], (prev as Array<{ id: bigint; amount: number; note: string }>).map((a) => a.id === vars.id ? { ...a, amount: vars.amount, note: vars.note } : a));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["advances"], ctx.prev); },
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
      qc.setQueryData(["advances"], (prev as Array<{ id: bigint }>).filter((a) => a.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["advances"], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["advances"] }),
  });
}

// Export/Import

export function useExportData() {
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: () => actor!.exportData() });
}

export function useImportData() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async (json: string) => { if (!actor) throw new Error("Backend not connected"); await actor.importData(json); return true; }, onSuccess: () => qc.invalidateQueries() });
}

// Auth / Admin panel

export function useLogin() {
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async ({ username, password }: { username: string; password: string }) => { if (!actor) throw new Error("Backend not connected"); return actor.login({ username, password }); } });
}

export function useLogout() {
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async () => { if (!actor) throw new Error("Backend not connected"); await actor.logout(); } });
}

export function useListUsers() {
  const { actor, actorReady } = useBackendActor();
  return useQuery({ queryKey: ["users"], staleTime: 30 * 1000, gcTime: 60 * 1000, queryFn: () => actor!.listUsers(), enabled: actorReady });
}

export function useCreateUser() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async ({ username, password, role }: { username: string; password: string; role: Role | Role[] }) => { if (!actor) throw new Error("Backend not connected"); return actor.createUser(username, password, role); }, onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }) });
}

export function useUpdateUserCredentials() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async ({ oldUsername, newUsername, newPassword }: { oldUsername: string; newUsername: string; newPassword: string | null }) => { if (!actor) throw new Error("Backend not connected"); return actor.updateUserCredentials(oldUsername, newUsername, newPassword); }, onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }) });
}

export function useApproveUser() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async ({ username, role }: { username: string; role: Role | Role[] }) => { if (!actor) throw new Error("Backend not connected"); await actor.approveUser(username, role); }, onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }) });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async ({ username, role }: { username: string; role: Role | Role[] }) => { if (!actor) throw new Error("Backend not connected"); await actor.setUserRole(username, role); }, onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }) });
}

export function useRevokeAccess() {
  const qc = useQueryClient();
  const { actor } = useBackendActor();
  return useMutation({ retry: 3, retryDelay: 1000, mutationFn: async (username: string) => { if (!actor) throw new Error("Backend not connected"); await actor.revokeAccess(username); }, onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }) });
}

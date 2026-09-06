import type { Principal } from "@icp-sdk/core/principal";
import { Role, UserStatus } from "../backend";
import type { backendInterface } from "../backend";

// Visual QA mock for the Rossie backend. Used when VITE_USE_MOCK=true is set
// so the frontend can be exercised without a live canister.
// NOTE: The current useBackendActor hook does not yet read from this file;
// this mock is provided for future wiring and as documentation of the
// expected return shapes for visual testing.

const sampleLabours = [
  {
    id: 1n,
    name: "Ramesh Kumar",
    employeeId: "EMP-001",
    joinDate: "2024-01-15",
    isActive: true,
    createdAt: 1705276800000000000n,
  },
  {
    id: 2n,
    name: "Sita Devi",
    employeeId: "EMP-002",
    joinDate: "2024-03-02",
    isActive: true,
    createdAt: 1709337600000000000n,
  },
];

const sampleContracts = [
  {
    id: 1n,
    name: "Sunrise Textiles — Bed Batch A",
    multiplier: 1.0,
    contractAmount: 120000,
    machineExpenses: 8000,
    bedAmount: 45000,
    paperAmount: 30000,
    meshAmount: 15000,
    settled: false,
    createdAt: 1705276800000000000n,
    workColumns: [
      { id: "col-bed-1", workType: "bed", name: "Bed Stitching" },
      { id: "col-paper-1", workType: "paper", name: "Paper Cutting" },
    ],
  },
  {
    id: 2n,
    name: "Anand Mills — Paper Run 3",
    multiplier: 1.0,
    contractAmount: 88000,
    machineExpenses: 5000,
    bedAmount: 0,
    paperAmount: 60000,
    meshAmount: 0,
    settled: false,
    createdAt: 1709337600000000000n,
    workColumns: [{ id: "col-paper-2", workType: "paper", name: "Paper Folding" }],
  },
];

const sampleAdvances = [
  {
    id: 1n,
    labourId: 1n,
    contractId: 1n,
    amount: 2000,
    note: "Festival advance",
    createdAt: 1706400000000000000n,
  },
];

const sampleAttendance = [
  {
    labourId: 1n,
    contractId: 1n,
    columnId: "col-bed-1",
    value: { __kind__: "present" as const, present: null },
  },
];

export const mockBackend: backendInterface = {
  addAdvance: async (_contractId, labourId, amount, note) => ({
    __kind__: "ok" as const,
    ok: {
      id: BigInt(Date.now()),
      labourId,
      contractId: _contractId,
      amount,
      note,
      createdAt: BigInt(Date.now()) * 1_000_000n,
    },
  }),
  addContract: async (
    name,
    multiplier,
    contractAmount,
    machineExpenses,
    bedAmount,
    paperAmount,
    _meshAmount,
  ) => ({
    __kind__: "ok" as const,
    ok: {
      id: BigInt(Date.now()),
      name,
      multiplier,
      contractAmount,
      machineExpenses,
      bedAmount,
      paperAmount,
      meshAmount: _meshAmount ?? 0,
      settled: false,
      createdAt: BigInt(Date.now()) * 1_000_000n,
      workColumns: [],
    },
  }),
  addLabour: async (name, employeeId, joinDate) => ({
    __kind__: "ok" as const,
    ok: {
      id: BigInt(Date.now()),
      name,
      employeeId,
      joinDate,
      isActive: true,
      createdAt: BigInt(Date.now()) * 1_000_000n,
    },
  }),
  addWorkColumn: async (contractId, name, workType) => ({
    __kind__: "ok" as const,
    ok:
      sampleContracts.find((c) => c.id === contractId) ?? sampleContracts[0],
  }),
  approveUser: async () => {},
  batchSaveAttendance: async () => [true],
  createUser: async (_username, _password, _role) => true,
  login: async (creds) =>
    creds.username === "siwraaj" && creds.password === "74482"
      ? {
          status: UserStatus.approved,
          username: creds.username,
          role: Role.admin,
        }
      : null,
  logout: async () => {},
  deleteAdvance: async () => ({ __kind__: "ok" as const, ok: true }),
  deleteContract: async () => ({ __kind__: "ok" as const, ok: true }),
  execute: async () => ({ hasMore: false, rows: [] }),
  exportData: async () => "{}",
  getActiveLabours: async () => sampleLabours.filter((l) => l.isActive),
  getAdvances: async () => sampleAdvances,
  getAdvancesByContract: async (_contractId) =>
    sampleAdvances.filter((a) => a.contractId === _contractId),
  getAllAttendance: async () => sampleAttendance,
  getAttendance: async (contractId) =>
    sampleAttendance.filter((a) => a.contractId === contractId),
  getContracts: async () => sampleContracts,
  getLabours: async () => sampleLabours,
  getCallerRole: async () => Role.viewOnly,
  getCallerStatus: async () => UserStatus.approved,
  importData: async () => ({ __kind__: "ok" as const, ok: true }),
  listUsers: async () => [],
  revokeAccess: async () => {},
  setUserRole: async () => {},
  updateUserCredentials: async (_oldUsername, _newUsername, _newPassword) => true,
  markContractSettled: async (id, settled) => ({
    __kind__: "ok" as const,
    ok: { ...sampleContracts[0], id, settled },
  }),
  removeWorkColumn: async (contractId, _columnId) => ({
    __kind__: "ok" as const,
    ok: sampleContracts.find((c) => c.id === contractId) ?? sampleContracts[0],
  }),
  schema: async () => '{"entities":{}}',
  setAttendance: async () => ({ __kind__: "ok" as const, ok: true }),
  updateAdvance: async (id, amount, note) => ({
    __kind__: "ok" as const,
    ok: { ...sampleAdvances[0], id, amount, note },
  }),
  updateContract: async (
    id,
    name,
    multiplier,
    contractAmount,
    machineExpenses,
    bedAmount,
    paperAmount,
    meshAmount,
  ) => ({
    __kind__: "ok" as const,
    ok: {
      ...sampleContracts[0],
      id,
      name,
      multiplier,
      contractAmount,
      machineExpenses,
      bedAmount,
      paperAmount,
      meshAmount: meshAmount ?? 0,
    },
  }),
  updateLabour: async (id, name, employeeId, joinDate, isActive) => ({
    __kind__: "ok" as const,
    ok: {
      ...sampleLabours[0],
      id,
      name,
      employeeId,
      joinDate,
      isActive,
    },
  }),
  updateWorkColumn: async (contractId, _columnId, name) => ({
    __kind__: "ok" as const,
    ok: { ...sampleContracts[0], name },
  }),
};

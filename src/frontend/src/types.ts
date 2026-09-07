export type AppMode = "view" | "edit" | null;

export type Tab =
  | "contracts"
  | "attendance"
  | "advances"
  | "payments"
  | "labours"
  | "settled"
  | "admin";

/** The four RBAC roles assigned by an admin. Mirrors the backend Role enum. */
export type Role = "admin" | "attendanceOnly" | "contractOnly" | "viewOnly";

/** Approval lifecycle of a user account. Mirrors the backend UserStatus enum. */
export type UserStatus = "pending" | "approved" | "revoked";

/** A user as returned by the backend admin panel. Identity is username-keyed. */
export interface UserInfo {
  username: string;
  role: Role;
  roles?: Role[];
  status: UserStatus;
  name?: string;
  email?: string;
}

export const ALL_TABS: Tab[] = [
  "contracts",
  "attendance",
  "advances",
  "payments",
  "labours",
  "settled",
];

/** The tabs a given role is allowed to see. */
export function tabsForRole(role: Role): Tab[] {
  switch (role) {
    case "admin":
      return [...ALL_TABS, "admin"];
    case "attendanceOnly":
      return ["attendance"];
    case "contractOnly":
      return ["contracts"];
    case "viewOnly":
      return ["attendance"];
  }
}

/** Whether a role may perform writes within the tabs it can access. */
export function canEditForRole(role: Role): boolean {
  return role !== "viewOnly";
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "attendanceOnly":
      return "Attendance";
    case "contractOnly":
      return "Contract";
    case "viewOnly":
      return "View";
  }
}

export function roleBadgeClass(role: Role): string {
  switch (role) {
    case "admin":
      return "role-admin";
    case "attendanceOnly":
      return "role-attendance";
    case "contractOnly":
      return "role-contract";
    case "viewOnly":
      return "role-view";
  }
}

export interface Labour {
  id: bigint;
  name: string;
  employeeId: string;
  joinDate: string;
  isActive: boolean;
  createdAt: bigint;
}

export interface WorkColumn {
  id: string;
  name: string;
  workType: string;
}

/**
 * Stable sort of work columns by workType priority: bed < paper < mesh.
 * Unknown/other workTypes sort last. Within each group, the existing
 * relative order is preserved (Array.prototype.sort is stable in modern
 * engines). Backend storage order is left untouched — this is a
 * render-time sort only.
 */
const WORK_TYPE_PRIORITY: Record<string, number> = {
  bed: 0,
  paper: 1,
  mesh: 2,
};

export function sortWorkColumns<T extends WorkColumn>(columns: T[]): T[] {
  return [...columns].sort((a, b) => {
    const pa = WORK_TYPE_PRIORITY[a.workType] ?? 3;
    const pb = WORK_TYPE_PRIORITY[b.workType] ?? 3;
    return pa - pb;
  });
}

export interface Contract {
  id: bigint;
  name: string;
  multiplier: number;
  contractAmount: number;
  machineExpenses: number;
  bedAmount: number;
  paperAmount: number;
  meshAmount: number;
  workColumns: WorkColumn[];
  settled: boolean;
  createdAt: bigint;
}

export interface AttendanceRecord {
  contractId: bigint;
  labourId: bigint;
  columnId: string;
  value: AttendanceValue;
}

export type AttendanceValue =
  | { __kind__: "present"; present: null }
  | { __kind__: "absent"; absent: null }
  | { __kind__: "partial"; partial: number };

export interface Advance {
  id: bigint;
  contractId: bigint;
  labourId: bigint;
  amount: number;
  note: string;
  createdAt: bigint;
}

export const PARTIAL_VALUES = [0.33, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9] as const;

export function getAttendanceDisplay(value: AttendanceValue): number {
  if (value.__kind__ === "present") return 1;
  if (value.__kind__ === "absent") return 0;
  return value.partial;
}

export function getAttendanceLabel(value: AttendanceValue): string {
  if (value.__kind__ === "present") return "Present";
  if (value.__kind__ === "absent") return "Absent";
  return value.partial.toString();
}

export function getBadgeClass(value: AttendanceValue): string {
  if (value.__kind__ === "present") return "badge-present";
  if (value.__kind__ === "absent") return "badge-absent";
  return "badge-partial";
}

import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Labour {
    id: bigint;
    joinDate: string;
    name: string;
    createdAt: bigint;
    isActive: boolean;
    employeeId: string;
}
export interface Credentials {
    username: string;
    password: string;
}
export interface UserInfo {
    status: UserStatus;
    username: string;
    name?: string;
    role: Role;
    email?: string;
}
export type AttendanceValue = {
    __kind__: "present";
    present: null;
} | {
    __kind__: "absent";
    absent: null;
} | {
    __kind__: "partial";
    partial: number;
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface WorkColumn {
    id: string;
    workType: string;
    name: string;
}
export interface AttendanceRecord {
    value: AttendanceValue;
    labourId: bigint;
    contractId: bigint;
    columnId: string;
}
export interface AuthResult {
    status: UserStatus;
    username: string;
    role: Role;
}
export interface Advance {
    id: bigint;
    note: string;
    labourId: bigint;
    createdAt: bigint;
    amount: number;
    contractId: bigint;
}
export interface Contract {
    id: bigint;
    multiplier: number;
    settled: boolean;
    name: string;
    createdAt: bigint;
    bedAmount: number;
    paperAmount: number;
    machineExpenses: number;
    meshAmount: number;
    contractAmount: number;
    workColumns: Array<WorkColumn>;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum Role {
    admin = "admin",
    contractOnly = "contractOnly",
    attendanceOnly = "attendanceOnly",
    viewOnly = "viewOnly"
}
export enum UserStatus {
    revoked = "revoked",
    pending = "pending",
    approved = "approved"
}
export interface backendInterface {
    addAdvance(contractId: bigint, labourId: bigint, amount: number, note: string): Promise<{
        __kind__: "ok";
        ok: Advance;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addContract(name: string, multiplier: number, contractAmount: number, machineExpenses: number, bedAmount: number, paperAmount: number, meshAmount: number | null): Promise<{
        __kind__: "ok";
        ok: Contract;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addLabour(name: string, employeeId: string, joinDate: string): Promise<{
        __kind__: "ok";
        ok: Labour;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addWorkColumn(contractId: bigint, name: string, workType: string): Promise<{
        __kind__: "ok";
        ok: Contract;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveUser(username: string, role: Role): Promise<void>;
    batchSaveAttendance(updates: Array<[bigint, bigint, string, AttendanceValue]>): Promise<Array<boolean>>;
    createUser(username: string, password: string, role: Role): Promise<boolean>;
    deleteAdvance(id: bigint): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteContract(id: bigint): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    execute(qJson: string): Promise<Result>;
    exportData(): Promise<string>;
    getActiveLabours(): Promise<Array<Labour>>;
    getAdvances(): Promise<Array<Advance>>;
    getAdvancesByContract(contractId: bigint): Promise<Array<Advance>>;
    getAllAttendance(): Promise<Array<AttendanceRecord>>;
    getAttendance(contractId: bigint): Promise<Array<AttendanceRecord>>;
    getCallerRole(): Promise<Role | null>;
    getCallerStatus(): Promise<UserStatus>;
    getContracts(): Promise<Array<Contract>>;
    getLabours(): Promise<Array<Labour>>;
    importData(json: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    listUsers(): Promise<Array<UserInfo>>;
    login(creds: Credentials): Promise<AuthResult | null>;
    logout(): Promise<void>;
    markContractSettled(id: bigint, settled: boolean): Promise<{
        __kind__: "ok";
        ok: Contract;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeWorkColumn(contractId: bigint, columnId: string): Promise<{
        __kind__: "ok";
        ok: Contract;
    } | {
        __kind__: "err";
        err: string;
    }>;
    revokeAccess(username: string): Promise<void>;
    schema(): Promise<string>;
    setAttendance(contractId: bigint, labourId: bigint, columnId: string, value: AttendanceValue): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setUserRole(username: string, role: Role): Promise<void>;
    updateAdvance(id: bigint, amount: number, note: string): Promise<{
        __kind__: "ok";
        ok: Advance;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateContract(id: bigint, name: string, multiplier: number, contractAmount: number, machineExpenses: number, bedAmount: number, paperAmount: number, meshAmount: number | null): Promise<{
        __kind__: "ok";
        ok: Contract;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateLabour(id: bigint, name: string, employeeId: string, joinDate: string, isActive: boolean): Promise<{
        __kind__: "ok";
        ok: Labour;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateUserCredentials(oldUsername: string, newUsername: string, newPassword: string | null): Promise<boolean>;
    updateWorkColumn(contractId: bigint, columnId: string, name: string): Promise<{
        __kind__: "ok";
        ok: Contract;
    } | {
        __kind__: "err";
        err: string;
    }>;
}

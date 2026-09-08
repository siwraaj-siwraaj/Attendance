import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://sduxdklpycjrydqdtdtc.supabase.co";

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_x1R4z-ad3kh0y1G2ofsj8g_g_MXZhUY";

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

type Role = "admin" | "attendanceOnly" | "contractOnly" | "viewOnly";

const ok = <T>(value: T) => ({ __kind__: "ok" as const, ok: value });
const err = (message: string) => ({ __kind__: "err" as const, err: message });

function ns(value: string | null | undefined): bigint {
  if (!value) return 0n;
  return BigInt(new Date(value).getTime()) * 1_000_000n;
}

function attendanceValue(row: any) {
  if (row.value_type === "absent") return { __kind__: "absent" };
  if (row.value_type === "partial") {
    return { __kind__: "partial", value: Number(row.partial_value ?? 0) };
  }
  return { __kind__: "present" };
}

function mapLabour(row: any) {
  return {
    id: BigInt(row.id),
    name: row.name,
    employeeId: row.employee_id,
    joinDate: row.join_date ? String(row.join_date).slice(0, 10) : "",
    active: Boolean(row.is_active),
    createdAt: ns(row.created_at),
  };
}

function mapColumn(row: any) {
  const fallbackNames: Record<string, string> = {
    bed: "Bed",
    paper: "Paper",
    mesh: "Mesh",
  };

  return {
    id: row.id,
    contractId: BigInt(row.contract_id),
    name: String(row.name ?? "").trim() || fallbackNames[row.work_type] || row.work_type,
    workType: row.work_type,
  };
}

function mapContract(row: any, columns: any[] = []) {
  return {
    id: BigInt(row.id),
    name: row.name,
    multiplier: Number(row.multiplier),
    contractAmount: Number(row.contract_amount),
    machineExpenses: Number(row.machine_expenses),
    bedAmount: Number(row.bed_amount),
    paperAmount: Number(row.paper_amount),
    meshAmount: Number(row.mesh_amount),
    settled: Boolean(row.settled),
    createdAt: ns(row.created_at),
    workColumns: columns.filter(
      (c) => String(c.contract_id) === String(row.id)
    ).map(mapColumn),
  };
}

function mapAdvance(row: any) {
  return {
    id: BigInt(row.id),
    contractId: BigInt(row.contract_id),
    labourId: BigInt(row.labour_id),
    amount: Number(row.amount),
    note: row.note ?? "",
    createdAt: ns(row.created_at),
    cleared: Boolean(row.cleared),
  };
}

function mapAttendance(row: any) {
  return {
    contractId: BigInt(row.contract_id),
    labourId: BigInt(row.labour_id),
    columnId: row.column_id,
    value: attendanceValue(row),
    markedAt: ns(row.created_at),
  };
}

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function rest(
  table: string,
  options: {
    method?: string;
    query?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const token = await accessToken();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${options.query ?? ""}`,
    {
      method: options.method ?? "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token ?? SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers ?? {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }
  );

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data?.message
        ? data.message
        : `Supabase request failed (${response.status})`
    );
  }

  return data;
}

async function functionCall(name: string, body: any) {
  const token = await accessToken();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token ?? SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data?.error
        ? data.error
        : `Function ${name} failed (${response.status})`
    );
  }

  return data;
}

export function createSupabaseActor() {
  return {
    async login(credentials: { username: string; password: string }) {
      try {
        const data = await functionCall("rossie-login", credentials);

        if (!data?.session) return null;

        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        return data.user;
      } catch {
        return null;
      }
    },

    async logout() {
      await supabase.auth.signOut();
    },

    async getCallerStatus() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return "pending";

      const rows = await rest("profiles", {
        query: `?select=status&id=eq.${data.user.id}`,
      });

      return rows?.[0]?.status ?? "pending";
    },

    async getCallerRole(): Promise<Role | null> {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;

      const rows = await rest("profiles", {
        query: `?select=role&id=eq.${data.user.id}`,
      });

      return rows?.[0]?.role ?? null;
    },

    async getCallerRoles(): Promise<Role[]> {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return [];

      const rows = await rest("profiles", {
        query: `?select=role,roles&id=eq.${data.user.id}`,
      });

      return rows?.[0]?.roles ?? (rows?.[0]?.role ? [rows[0].role] : []);
    },

    async getLabours() {
      const rows = await rest("labours", {
        query: "?select=*&order=id.asc",
      });
      return rows.map(mapLabour);
    },

    async getActiveLabours() {
      const rows = await rest("labours", {
        query: "?select=*&is_active=eq.true&order=id.asc",
      });
      return rows.map(mapLabour);
    },

    async addLabour(name: string, employeeId: string, joinDate: string) {
      try {
        const rows = await rest("labours", {
          method: "POST",
          headers: {
            Prefer: "return=representation",
          },
          body: {
            name,
            employee_id: employeeId,
            join_date: new Date(joinDate).toISOString(),
            is_active: true,
          },
        });
        return ok(mapLabour(rows[0]));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async updateLabour(
      id: bigint,
      name: string,
      employeeId: string,
      joinDate: string,
      active: boolean
    ) {
      try {
        const rows = await rest("labours", {
          method: "PATCH",
          query: `?id=eq.${id}`,
          body: {
            name,
            employee_id: employeeId,
            join_date: new Date(joinDate).toISOString(),
            is_active: active,
          },
        });
        return ok(mapLabour(rows[0]));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async getContracts() {
      const rows = await rest("contracts", {
        query: "?select=*&order=id.asc",
      });

      const columns = await rest("work_columns", {
        query: "?select=*&order=id.asc",
      });

      return rows.map((row: any) => mapContract(row, columns));
    },

    async addContract(
      name: string,
      multiplier: number,
      contractAmount: number,
      machineExpenses: number,
      bedAmount: number,
      paperAmount: number,
      meshAmount: number | null
    ) {
      try {
        const rows = await rest("contracts", {
          method: "POST",
          headers: {
            Prefer: "return=representation",
          },
          body: {
            name,
            multiplier,
            contract_amount: contractAmount,
            machine_expenses: machineExpenses,
            bed_amount: bedAmount,
            paper_amount: paperAmount,
            mesh_amount: meshAmount ?? 0,
            settled: false,
          },
        });

        return ok(mapContract(rows[0], []));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async updateContract(
      id: bigint,
      name: string,
      multiplier: number,
      contractAmount: number,
      machineExpenses: number,
      bedAmount: number,
      paperAmount: number,
      meshAmount: number | null
    ) {
      try {
        const rows = await rest("contracts", {
          method: "PATCH",
          query: `?id=eq.${id}`,
          body: {
            name,
            multiplier,
            contract_amount: contractAmount,
            machine_expenses: machineExpenses,
            bed_amount: bedAmount,
            paper_amount: paperAmount,
            mesh_amount: meshAmount ?? 0,
          },
        });

        const columns = await rest("work_columns", {
          query: `?contract_id=eq.${id}&select=*`,
        });

        return ok(mapContract(rows[0], columns));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async deleteContract(id: bigint) {
      try {
        await rest("contracts", {
          method: "DELETE",
          query: `?id=eq.${id}`,
        });
        return ok(true);
      } catch (e: any) {
        return err(e.message);
      }
    },

    async markContractSettled(id: bigint, settled: boolean) {
      try {
        await rest("contracts", {
          method: "PATCH",
          query: `?id=eq.${id}`,
          body: { settled },
        });
        return ok(true);
      } catch (e: any) {
        return err(e.message);
      }
    },

    async addWorkColumn(
      contractId: bigint,
      name: string,
      workType: string
    ) {
      try {
        const fallbackNames: Record<string, string> = {
          bed: "Bed",
          paper: "Paper",
          mesh: "Mesh",
        };

        const columnName =
          String(name ?? "").trim() ||
          fallbackNames[String(workType).toLowerCase()] ||
          String(workType);

        const rows = await rest("work_columns", {
          method: "POST",
          query: "?select=*",
          body: {
            id: crypto.randomUUID(),
            contract_id: contractId.toString(),
            name: columnName,
          },
        });

        return ok(mapColumn(rows[0]));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async updateWorkColumn(
      _contractId: bigint,
      columnId: string,
      name: string
    ) {
      try {
        const rows = await rest("work_columns", {
          method: "PATCH",
          query: `?id=eq.${encodeURIComponent(columnId)}`,
          body: {
            name,
          },
        });

        return ok(mapColumn(rows[0]));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async removeWorkColumn(contractId: bigint, columnId: string) {
      try {
        await rest("work_columns", {
          method: "DELETE",
          query: `?id=eq.${encodeURIComponent(columnId)}`,
        });

        return ok(true);
      } catch (e: any) {
        return err(e.message);
      }
    },


    async getAllAttendance() {
      const rows = await rest("attendance", {
        query: "?select=*&order=id.asc",
      });
      return rows.map(mapAttendance);
    },

    async getAttendance(contractId: bigint) {
      const rows = await rest("attendance", {
        query: `?contract_id=eq.${contractId}&select=*`,
      });
      return rows.map(mapAttendance);
    },

    async setAttendance(
      contractId: bigint,
      labourId: bigint,
      columnId: string,
      value: any
    ) {
      try {
        let valueType = "present";
        let partialValue: number | null = null;

        if (value?.__kind__ === "absent") {
          valueType = "absent";
        } else if (value?.__kind__ === "partial") {
          valueType = "partial";
          partialValue = Number((value as any)?.partial ?? 0);
        }

        const rows = await rest("attendance", {
          method: "POST",
          query: "?on_conflict=contract_id,labour_id,column_id&select=*",
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: {
            contract_id: contractId.toString(),
            labour_id: labourId.toString(),
            column_id: columnId,
            value_type: valueType,
            partial_value: partialValue,
          },
        });

        return ok(rows?.[0] ? mapAttendance(rows[0]) : true);
      } catch (e: any) {
        return err(e.message);
      }
    },

    async batchSaveAttendance(
      updates: Array<[bigint, bigint, string, any]>
    ) {
      const results: boolean[] = [];

      for (const [contractId, labourId, columnId, value] of updates) {
        const result = await this.setAttendance(
          contractId,
          labourId,
          columnId,
          value
        );

        results.push(result.__kind__ === "ok");
      }

      return results;
    },

    async getAdvances() {
      const rows = await rest("advances", {
        query: "?select=*&order=id.asc",
      });
      return rows.map(mapAdvance);
    },

    async getAdvancesByContract(contractId: bigint) {
      const rows = await rest("advances", {
        query: `?contract_id=eq.${contractId}&select=*&order=id.asc`,
      });
      return rows.map(mapAdvance);
    },

    async addAdvance(
      contractId: bigint,
      labourId: bigint,
      amount: number,
      note: string
    ) {
      try {
        const rows = await rest("advances", {
          method: "POST",
          headers: {
            Prefer: "return=representation",
          },
          body: {
            contract_id: contractId.toString(),
            labour_id: labourId.toString(),
            amount,
            note,
            cleared: false,
          },
        });

        return ok(mapAdvance(rows[0]));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async updateAdvance(
      id: bigint,
      amount: number,
      note: string,
      cleared: boolean
    ) {
      try {
        const rows = await rest("advances", {
          method: "PATCH",
          query: `?id=eq.${id}`,
          body: {
            amount,
            note,
            cleared,
          },
        });

        return ok(mapAdvance(rows[0]));
      } catch (e: any) {
        return err(e.message);
      }
    },

    async deleteAdvance(id: bigint) {
      try {
        await rest("advances", {
          method: "DELETE",
          query: `?id=eq.${id}`,
        });

        return ok(true);
      } catch (e: any) {
        return err(e.message);
      }
    },


    async listUsers() {
      const data = await functionCall("rossie-admin", { action: "list" });
      return data.users ?? [];
    },

    async createUser(
      username: string,
      password: string,
      role: Role | Role[]
    ) {
      try {
        const data = await functionCall("rossie-admin", {
          action: "create",
          username,
          password,
          roles: Array.isArray(role) ? role : [role],
        });
        return Boolean(data?.created);
      } catch {
        return false;
      }
    },

    async approveUser(username: string, role: Role | Role[]) {
      await functionCall("rossie-admin", {
        action: "approve",
        username,
        role,
      });
    },

    async setUserRole(username: string, role: Role | Role[]) {
      await functionCall("rossie-admin", {
        action: "role",
        username,
        role,
      });
    },

    async revokeAccess(username: string) {
      await functionCall("rossie-admin", {
        action: "revoke",
        username,
      });
    },

    async updateUserCredentials(
      username: string,
      newUsername: string | null,
      newPassword: string | null
    ) {
      const data = await functionCall("rossie-admin", {
        action: "credentials",
        username,
        newUsername,
        newPassword,
      });
      return Boolean(data?.updated);
    },

    async exportData() {
      const [contracts, labours, advances, attendance, columns] =
        await Promise.all([
          rest("contracts", { query: "?select=*&order=id.asc" }),
          rest("labours", { query: "?select=*&order=id.asc" }),
          rest("advances", { query: "?select=*&order=id.asc" }),
          rest("attendance", { query: "?select=*&order=id.asc" }),
          rest("work_columns", { query: "?select=*&order=id.asc" }),
        ]);

      const contractColumns = columns.reduce(
        (result: any, column: any) => {
          const contractId = String(column.contract_id);

          if (!result[contractId]) {
            result[contractId] = [];
          }

          result[contractId].push({
            id: column.id,
            contractId: BigInt(column.contract_id),
            name: column.name,
            workType: column.work_type,
          });

          return result;
        },
        {}
      );

      return JSON.stringify({
        contracts: contracts.map((row: any) => ({
          ...mapContract(row, contractColumns[String(row.id)] ?? []),
        })),
        labours: labours.map(mapLabour),
        advances: advances.map(mapAdvance),
        attendance: attendance.map(mapAttendance),
      }, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      );
    },

    async importData(_json: string) {
      throw new Error(
        "Import is not available in the first Supabase migration version."
      );
    },

    async execute(_queryJson: string) {
      throw new Error("OQL is not available in the Supabase backend.");
    },

    async schema() {
      return "Supabase backend";
    },
  };
}

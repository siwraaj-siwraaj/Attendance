import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function functionCall(name: string, body?: unknown) {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

async function rest(table: string, options: { query?: string; method?: string; body?: unknown } = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return [];
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${options.query ?? ""}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.body ? { Prefer: "return=representation" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      typeof data === "object" && data?.error
        ? data.error
        : `Function ${name} failed (${response.status})`,
    );
  }
  return response.json();
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

    async getCallerRole(): Promise<any | null> {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      const rows = await rest("profiles", {
        query: `?select=role&id=eq.${data.user.id}`,
      });
      return rows?.[0]?.role ?? null;
    },

    async getCallerRoles(): Promise<any[]> {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return [];
      const rows = await rest("profiles", {
        query: `?select=role,roles&id=eq.${data.user.id}`,
      });
      return rows?.[0]?.roles ?? (rows?.[0]?.role ? [rows[0].role] : []);
    },

    async addWorkColumn(contractId: bigint, name: string, workType: string) {
      // IMPORTANT: preserve the user-entered custom column name.
      // The previous implementation ignored `name`, which made the
      // Custom/Add Column action appear to do nothing or create the wrong name.
      return await functionCall("rossie-add-work-column", {
        contractId: String(contractId),
        name,
        workType,
      });
    },
  };
}

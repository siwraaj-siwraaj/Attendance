import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Role, UserStatus } from "../backend";
import type { AppMode, Tab } from "../types";
import { canEditForRole, tabsForRole } from "../types";
import { useBackendActor } from "./useBackend";

interface AuthContextType {
  /** True while the backend actor is being resolved. No stored session is
   *  restored — the backend session is in-memory, so a fresh page load is
   *  always signed out. */
  isInitializing: boolean;
  /** True when the user has successfully signed in with a username/password. */
  isAuthenticated: boolean;
  /** Sign in with a username/password. Resolves true on success, false when
   *  the credentials are invalid (keeps the user on the login page). */
  login: (username: string, password: string) => Promise<boolean>;
  /** Sign out and return to the login screen. */
  logout: () => void;
  /** The caller's approval status (pending / approved / revoked), or null before login. */
  status: UserStatus | null;
  /** The caller's assigned role, or null when not approved. */
  role: Role | null;
  /** All roles assigned to the current user. */
  roles: Role[];
  /** Derived app mode: "edit" for Admin, "view" for all other approved roles, null otherwise. */
  mode: AppMode;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  /** The tabs the current role is allowed to see. */
  allowedTabs: Tab[];
  /** Whether the current role may perform writes within its visible tabs. */
  canEdit: boolean;
  isAdmin: boolean;
  /** The last contract selected in the Attendance tab — persists across tab switches. */
  attendanceContractId: bigint | null;
  setAttendanceContractId: (id: bigint | null) => void;
  /** Re-fetch the signed-in user's status + role (e.g. after an admin approves them). */
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { actor } = useBackendActor();
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTabState] = useState<Tab>("attendance");
  const [attendanceContractId, setAttendanceContractId] = useState<
    bigint | null
  >(null);

  const isAuthenticated = username !== null;

  // Sign in with a username/password. The backend resolves the caller's
  // identity by username (not Principal) and returns an AuthResult on success
  // or null on invalid credentials.
  const login = useCallback(
    async (usernameInput: string, password: string): Promise<boolean> => {
      if (!actor) return false;
      const result = await actor.login({ username: usernameInput, password });
      if (!result) return false;
      setUsername(result.username);
      setStatus(result.status);
      setRole(result.role);
      setRoles(result.roles ?? [result.role]);
      return true;
    },
    [actor],
  );

  // Re-fetch the signed-in user's status + role (e.g. after an admin approves
  // this user while they are signed in).
  const refreshAuth = useCallback(() => {
    if (!actor || !username) return;
    void (async () => {
      try {
        const s = await actor.getCallerStatus();
        setStatus(s);
        if (s === UserStatus.approved) {
          const r = await actor.getCallerRole();
          setRole(r);
          const rs = await actor.getCallerRoles();
          setRoles(rs.length ? rs : (r ? [r] : []));
        } else {
          setRole(null);
        }
      } catch {
        // Transient network/actor errors — retry on next refresh.
      }
    })();
  }, [actor, username]);

  // Sign out: clear the backend session and reset local auth state.
  const logout = useCallback(() => {
    if (actor) void actor.logout();
    setUsername(null);
    setStatus(null);
    setRole(null);
    setRoles([]);
  }, [actor]);

  const mode: AppMode = useMemo(() => {
    if (!isAuthenticated) return null;
    if (status !== UserStatus.approved) return null;
    return roles.includes(Role.admin) ? "edit" : "view";
  }, [isAuthenticated, status, roles]);

  const allowedTabs = useMemo(() => {
    const result = new Set<Tab>();
    for (const r of roles) {
      for (const tab of tabsForRole(r)) result.add(tab);
    }
    return [...result];
  }, [roles]);

  const canEdit = useMemo(
    () => roles.some((r) => canEditForRole(r)),
    [roles],
  );

  const isAdmin = roles.includes(Role.admin);

  // Keep the active tab within the role's allowed set.
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTabState(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  const setActiveTab = useCallback((t: Tab) => setActiveTabState(t), []);

  const value: AuthContextType = {
    isInitializing: false,
    isAuthenticated,
    login,
    logout,
    status,
    role,
    roles,
    mode,
    activeTab,
    setActiveTab,
    allowedTabs,
    canEdit,
    isAdmin,
    attendanceContractId,
    setAttendanceContractId,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

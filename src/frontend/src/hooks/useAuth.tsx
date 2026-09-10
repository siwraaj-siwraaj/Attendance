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
import {
  clearBiometricCredentials,
  getSavedCredentials,
  saveBiometricCredentials,
} from "./nativeBiometric";
import { useBackendActor } from "./useBackend";

const REMEMBER_ME_KEY = "rossie.rememberMe";

interface AuthContextType {
  /** True while a remembered secure session is being restored. */
  isInitializing: boolean;
  /** True when the user has successfully signed in with a username/password. */
  isAuthenticated: boolean;
  /** Sign in with a username/password, optionally remembering the secure login. */
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  /** Sign out and clear any remembered login. */
  logout: () => void;
  status: UserStatus | null;
  role: Role | null;
  roles: Role[];
  mode: AppMode;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  allowedTabs: Tab[];
  canEdit: boolean;
  isAdmin: boolean;
  attendanceContractId: bigint | null;
  setAttendanceContractId: (id: bigint | null) => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { actor } = useBackendActor();
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTabState] = useState<Tab>("contracts");
  const [attendanceContractId, setAttendanceContractId] = useState<
    bigint | null
  >(null);

  const isAuthenticated = username !== null;

  const applyLoginResult = useCallback((result: any) => {
    if (!result) return;
    setUsername(result.username);
    setStatus(result.status);
    setRole(result.role);
    setRoles((result as { roles?: Role[]; role: Role }).roles ?? [result.role]);
  }, []);

  // Restore an explicitly remembered login from the OS secure credential store.
  // This runs before AppContent can render LoginPage, preventing a login flash.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!actor) return;

      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
      if (!rememberMe) {
        if (!cancelled) setIsInitializing(false);
        return;
      }

      try {
        const credentials = await getSavedCredentials();
        if (!credentials || cancelled) {
          if (!cancelled) setIsInitializing(false);
          return;
        }

        const result = await actor.login(credentials);
        if (!cancelled) {
          if (result) applyLoginResult(result);
          else {
            localStorage.removeItem(REMEMBER_ME_KEY);
            await clearBiometricCredentials();
          }
          setIsInitializing(false);
        }
      } catch {
        if (!cancelled) setIsInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actor, applyLoginResult]);

  const login = useCallback(
    async (
      usernameInput: string,
      password: string,
      rememberMe = false,
    ): Promise<boolean> => {
      if (!actor) return false;
      const result = await actor.login({ username: usernameInput, password });
      if (!result) return false;

      applyLoginResult(result);

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
        await saveBiometricCredentials(usernameInput.trim(), password);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        await clearBiometricCredentials();
      }

      return true;
    },
    [actor, applyLoginResult],
  );

  const refreshAuth = useCallback(() => {
    if (!actor || !username) return;
    void (async () => {
      try {
        const s = await actor.getCallerStatus();
        setStatus(s);
        if (s === UserStatus.approved) {
          const r = (await actor.getCallerRole()) as Role | null;
          setRole(r);
          const rs = (await actor.getCallerRoles()) as Role[];
          setRoles(rs.length ? rs : r ? [r] : []);
        } else {
          setRole(null);
        }
      } catch {
        // Transient network/actor errors — retry on next refresh.
      }
    })();
  }, [actor, username]);

  const logout = useCallback(() => {
    if (actor) void actor.logout();
    localStorage.removeItem(REMEMBER_ME_KEY);
    void clearBiometricCredentials();
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

  const canEdit = useMemo(() => {
    if (roles.includes(Role.admin)) return true;
    if (activeTab === "attendance" && roles.includes(Role.attendanceOnly)) return true;
    if (activeTab === "contracts" && roles.includes(Role.contractOnly)) return true;
    return false;
  }, [roles, activeTab]);

  const isAdmin = roles.includes(Role.admin);

  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTabState(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  const setActiveTab = useCallback((t: Tab) => setActiveTabState(t), []);

  const value: AuthContextType = {
    isInitializing,
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

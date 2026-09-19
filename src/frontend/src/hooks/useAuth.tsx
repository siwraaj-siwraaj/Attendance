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
import { tabsForRole } from "../types";
import {
  clearBiometricCredentials,
  getSavedCredentials,
  saveBiometricCredentials,
} from "./nativeBiometric";
import { useBackendActor } from "./useBackend";
import { registerPushTokenForCurrentUser, deletePushToken } from "./pushNotifications";

const REMEMBER_ME_KEY = "rossie.rememberMe";
const RESTORE_TIMEOUT_MS = 10000;

interface AuthContextType {
  isInitializing: boolean;
  isAuthenticated: boolean;
  username: string | null;
  name: string | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  registerUser: (username: string, password: string) => Promise<boolean>;
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
  loginNotice: { type: "pending"; name: string; phone: string; message: string; requestToken?: string } | null;
  getRegistrationStatus: (username: string, requestToken: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { actor } = useBackendActor();
  const [username, setUsername] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loginNotice, setLoginNotice] = useState<{ type: "pending"; name: string; phone: string; message: string; requestToken?: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTabState] = useState<Tab>("home");
  const [attendanceContractId, setAttendanceContractId] = useState<bigint | null>(null);

  const isAuthenticated = username !== null;

  const registerCurrentDeviceForPush = useCallback(async () => {
    if (!actor) return;
    const token = await registerPushTokenForCurrentUser();
    if (token) {
      try { await actor.registerPushToken(token); } catch { /* Push setup is optional until Firebase is configured. */ }
    }
  }, [actor]);

  const applyLoginResult = useCallback((result: any) => {
    if (!result) return;
    setUsername(result.username);
    setName(result.name ?? null);
    setStatus(result.status);
    setRole(result.role);
    setRoles((result as { roles?: Role[]; role: Role }).roles ?? [result.role]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finishInitialization = () => {
      if (!cancelled) setIsInitializing(false);
    };

    if (!actor) {
      timeoutId = setTimeout(finishInitialization, 1500);
      return () => {
        cancelled = true;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    const restore = async () => {
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
      if (!rememberMe) {
        finishInitialization();
        return;
      }

      try {
        const credentials = await Promise.race([
          getSavedCredentials(),
          new Promise<null>((resolve) => {
            timeoutId = setTimeout(() => resolve(null), RESTORE_TIMEOUT_MS);
          }),
        ]);

        if (!credentials || cancelled) {
          finishInitialization();
          return;
        }

        const result = await Promise.race([
          actor.login(credentials),
          new Promise<null>((resolve) => {
            timeoutId = setTimeout(() => resolve(null), RESTORE_TIMEOUT_MS);
          }),
        ]);

        if (cancelled) return;

        if (result) {
          applyLoginResult(result);
          void registerCurrentDeviceForPush();
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          await clearBiometricCredentials();
        }
      } catch {
        if (!cancelled) localStorage.removeItem(REMEMBER_ME_KEY);
      } finally {
        finishInitialization();
      }
    };

    void restore();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [actor, applyLoginResult, registerCurrentDeviceForPush]);

  const login = useCallback(
    async (usernameInput: string, password: string, rememberMe = false): Promise<boolean> => {
      if (!actor) return false;
      setLoginNotice(null);
      const result = await actor.login({ username: usernameInput, password });
      if (!result) return false;
      if ((result as any).requestPending) {
        setLoginNotice({
          type: "pending",
          name: String((result as any).name ?? ""),
          phone: String((result as any).username ?? usernameInput).trim(),
          message: String((result as any).message ?? "Login request sent to admin"),
          requestToken: (result as any).requestToken,
        });
        return false;
      }

      applyLoginResult(result);
      void registerCurrentDeviceForPush();

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

  const registerUser = useCallback(
    async (usernameInput: string, password: string): Promise<boolean> => {
      if (!actor) return false;
      setLoginNotice(null);
      try {
        const result = await actor.registerUser({ username: usernameInput, password });
        if (!result) return false;
        if ((result as any).requestPending) {
          setLoginNotice({
            type: "pending",
            name: String((result as any).name ?? ""),
            phone: String((result as any).username ?? usernameInput).trim(),
            message: String((result as any).message ?? "Login request sent to admin"),
            requestToken: (result as any).requestToken,
          });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [actor],
  );

  const getRegistrationStatus = useCallback(
    async (usernameInput: string, requestToken: string) => {
      if (!actor) return null;
      return actor.getRegistrationStatus(usernameInput, requestToken);
    },
    [actor],
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
    void deletePushToken();
    if (actor) void actor.logout();
    setLoginNotice(null);
    localStorage.removeItem(REMEMBER_ME_KEY);
    void clearBiometricCredentials();
    setUsername(null);
    setName(null);
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
    username,
    name,
    login,
    registerUser,
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
    loginNotice,
    getRegistrationStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

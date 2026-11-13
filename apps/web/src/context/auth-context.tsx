/* eslint-disable react-refresh/only-export-components */
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ApiError, setAccessToken, setRefreshHandler } from "@/lib/api";
import type { AuthUser, PatientProfile } from "@/lib/auth";
import {
  createPatientSession,
  getPatientMe,
  loginStaff,
  logoutSession,
  refreshSession,
} from "@/lib/auth-api";

interface AuthState {
  status: "loading" | "anonymous" | "authenticated";
  user: AuthUser | null;
  patientProfile: PatientProfile | null;
}

interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string) => Promise<AuthUser>;
  startPatientSession: (fullName: string, phone: string) => Promise<PatientProfile>;
  logout: (opts?: { silent?: boolean }) => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromPatient(profile: PatientProfile): AuthUser {
  return {
    id: `patient:${profile.id}`,
    role: "PATIENT",
    name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    isActive: true,
    patient: profile,
    adminProfile: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, patientProfile: null });
  const bootstrapped = useRef(false);

  const applySession = useCallback((accessToken: string, user: AuthUser | null, profile: PatientProfile | null) => {
    setAccessToken(accessToken);
    const resolvedProfile = profile ?? user?.patient ?? null;
    const resolvedUser = user ?? (resolvedProfile ? userFromPatient(resolvedProfile) : null);
    if (resolvedUser && resolvedProfile && !resolvedUser.patient) {
      resolvedUser.patient = resolvedProfile;
    }
    setState({ status: "authenticated", user: resolvedUser, patientProfile: resolvedProfile });
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setState({ status: "anonymous", user: null, patientProfile: null });
    queryClient.clear();
  }, [queryClient]);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const refreshed = await refreshSession();
      const user = refreshed.user;
      const profile = user.role === "PATIENT" ? (user.patient ?? (await getPatientMe(refreshed.accessToken))) : null;
      applySession(refreshed.accessToken, user, profile);
      return refreshed.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    setRefreshHandler(doRefresh);
    return () => setRefreshHandler(null);
  }, [doRefresh]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void (async () => {
      try {
        const refreshed = await refreshSession();
        const user = refreshed.user;
        let profile = user.patient ?? null;
        if (user.role === "PATIENT" && !profile) {
          profile = await getPatientMe(refreshed.accessToken);
        }
        applySession(refreshed.accessToken, user, profile);
      } catch {
        clearSession();
      }
    })();
  }, [applySession, clearSession]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const result = await loginStaff(identifier, password);
      applySession(result.accessToken, result.user, result.user.patient ?? null);
      return result.user;
    },
    [applySession],
  );

  const startPatientSession = useCallback(
    async (fullName: string, phone: string) => {
      const result = await createPatientSession(fullName, phone);
      const user = userFromPatient(result.profile!);
      applySession(result.accessToken, user, result.profile!);
      if (!result.profile?.phoneVerified) {
        toast.info("Mobile number not verified yet", {
          description: "You can continue booking now. OTP verification can be added later.",
        });
      }
      return result.profile!;
    },
    [applySession],
  );

  const logout = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        await logoutSession();
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401) && !opts?.silent) {
          // best effort
        }
      } finally {
        clearSession();
      }
    },
    [clearSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      startPatientSession,
      logout,
      hasRole: (...roles: string[]) => !!state.user && roles.includes(state.user.role),
    }),
    [state, login, startPatientSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { api } from "./api";
import type { AuthUser, PatientProfile, SessionPayload } from "./auth";

export interface LoginResponse {
  data: { accessToken: string; user: AuthUser };
}

export interface RefreshResponse {
  data: { accessToken: string; user: AuthUser };
}

export interface PatientSessionResponse {
  data: {
    accessToken: string;
    profile: PatientProfile;
    verification: { phoneVerified: boolean; method: string };
  };
}

export interface MeStaffResponse {
  data: { user: AuthUser };
}

export interface MePatientResponse {
  data: { profile: PatientProfile };
}

export async function loginStaff(identifier: string, password: string): Promise<LoginResponse["data"]> {
  const res = await api.post<LoginResponse>("/auth/login", { identifier, password }, { skipAuth: true });
  return res.data;
}

export async function refreshSession(): Promise<RefreshResponse["data"]> {
  const res = await api.post<RefreshResponse>("/auth/refresh", undefined, { skipAuth: true });
  return res.data;
}

export async function logoutSession(): Promise<void> {
  await api.post("/auth/logout", undefined, { skipAuth: true });
}

export async function getStaffMe(token?: string | null): Promise<AuthUser> {
  const res = await api.get<MeStaffResponse>("/auth/me", { token });
  return res.data.user;
}

export async function createPatientSession(fullName: string, phone: string): Promise<SessionPayload> {
  const res = await api.post<PatientSessionResponse>("/patients/session", { fullName, phone }, { skipAuth: true });
  return res.data;
}

export async function getPatientMe(token?: string | null): Promise<PatientProfile> {
  const res = await api.get<MePatientResponse>("/patients/me", { token });
  return res.data.profile;
}

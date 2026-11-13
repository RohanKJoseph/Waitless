import type { Role } from "@waitless/shared";

export interface PatientProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  phoneVerified: boolean;
}

export interface AdminProfile {
  designation: string;
  staffCode: string;
}

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  patient: PatientProfile | null;
  adminProfile: AdminProfile | null;
}

export interface SessionPayload {
  accessToken: string;
  user?: AuthUser;
  profile?: PatientProfile;
  verification?: { phoneVerified: boolean; method: string };
}

import { api } from "./api";

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { doctors: number };
}

export interface Doctor {
  id: string;
  departmentId: string;
  fullName: string;
  designation: string;
  avgConsultMinutes: number;
  roomId: string | null;
  isActive: boolean;
  department?: Department;
  room?: { id: string; code: string; name: string } | null;
}

export async function listDepartments(includeInactive = true): Promise<Department[]> {
  const res = await api.get<{ data: { departments: Department[] } }>(
    `/departments?includeInactive=${includeInactive ? "true" : "false"}`,
  );
  return res.data.departments;
}

export async function createDepartment(input: { name: string; code: string; description?: string; location?: string }) {
  const res = await api.post<{ data: { department: Department } }>("/departments", input);
  return res.data.department;
}

export async function updateDepartment(id: string, input: Partial<{ name: string; code: string; description: string | null; location: string | null; isActive: boolean }>) {
  const res = await api.patch<{ data: { department: Department } }>(`/departments/${id}`, input);
  return res.data.department;
}

export async function deleteDepartment(id: string) {
  const res = await api.delete<{ data: { department: Department } }>(`/departments/${id}`);
  return res.data.department;
}

export async function listDoctors(params?: { departmentId?: string; q?: string; includeInactive?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.departmentId) qs.set("departmentId", params.departmentId);
  if (params?.q) qs.set("q", params.q);
  qs.set("includeInactive", params?.includeInactive === false ? "false" : "true");
  const res = await api.get<{ data: { doctors: Doctor[]; pagination: { page: number; total: number } } }>(`/doctors?${qs.toString()}`);
  return res.data;
}

export async function createDoctor(input: { departmentId: string; fullName: string; designation: string; avgConsultMinutes: number; roomId?: string | null }) {
  const res = await api.post<{ data: { doctor: Doctor } }>("/doctors", input);
  return res.data.doctor;
}

export async function updateDoctor(id: string, input: Partial<{ departmentId: string; fullName: string; designation: string; avgConsultMinutes: number; roomId: string | null; isActive: boolean }>) {
  const res = await api.patch<{ data: { doctor: Doctor } }>(`/doctors/${id}`, input);
  return res.data.doctor;
}

export async function deleteDoctor(id: string) {
  const res = await api.delete<{ data: { doctor: Doctor } }>(`/doctors/${id}`);
  return res.data.doctor;
}

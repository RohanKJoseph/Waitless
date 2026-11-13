import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/errors";

export async function listDoctors(opts: {
  departmentId?: string;
  q?: string;
  includeInactive?: boolean;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.DoctorWhereInput = {};
  if (opts.departmentId) where.departmentId = opts.departmentId;
  if (opts.activeOnly) where.isActive = true;
  else if (!opts.includeInactive) where.isActive = true;

  if (opts.q) {
    where.OR = [
      { fullName: { contains: opts.q, mode: "insensitive" } },
      { designation: { contains: opts.q, mode: "insensitive" } },
      { room: { code: { contains: opts.q, mode: "insensitive" } } },
      { department: { name: { contains: opts.q, mode: "insensitive" } } },
    ];
  }

  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 20;
  const [items, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: { department: true, room: true },
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.doctor.count({ where }),
  ]);

  return {
    doctors: items,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function getDoctorById(id: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { department: true, room: true, schedules: true },
  });
  if (!doctor) throw AppError.notFound("Doctor not found");
  return doctor;
}

export async function createDoctor(data: {
  departmentId: string;
  fullName: string;
  designation: string;
  avgConsultMinutes?: number;
  roomId?: string | null;
  isActive?: boolean;
}) {
  const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
  if (!dept) throw AppError.notFound("Department not found");

  if (data.roomId) {
    const roomTaken = await prisma.doctor.findUnique({ where: { roomId: data.roomId } });
    if (roomTaken) throw AppError.conflict("CONFLICT", "This room is already assigned to another doctor");
  }

  return prisma.doctor.create({
    data: {
      departmentId: data.departmentId,
      fullName: data.fullName,
      designation: data.designation,
      avgConsultMinutes: data.avgConsultMinutes ?? 12,
      roomId: data.roomId ?? null,
      isActive: data.isActive ?? true,
    },
    include: { department: true, room: true },
  });
}

export async function updateDoctor(id: string, data: Record<string, unknown>) {
  const existing = await getDoctorById(id);

  if (data.departmentId && data.departmentId !== existing.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId as string } });
    if (!dept) throw AppError.notFound("Department not found");
  }

  if (Object.prototype.hasOwnProperty.call(data, "roomId")) {
    const roomId = data.roomId as string | null | undefined;
    if (roomId) {
      const roomTaken = await prisma.doctor.findFirst({ where: { roomId, id: { not: id } } });
      if (roomTaken) throw AppError.conflict("CONFLICT", "This room is already assigned to another doctor");
    }
  }

  return prisma.doctor.update({
    where: { id },
    data,
    include: { department: true, room: true },
  });
}

export async function deactivateDoctor(id: string) {
  await getDoctorById(id);
  const blocking = await prisma.appointment.count({
    where: {
      doctorId: id,
      status: { in: ["BOOKED", "WAITING", "NOTIFIED", "CALLED", "IN_CONSULTATION", "DELAYED"] },
    },
  });
  if (blocking > 0) {
    throw AppError.conflict("CONFLICT", "Cannot deactivate doctor while they have active appointments", {
      activeAppointments: blocking,
    });
  }
  return prisma.doctor.update({ where: { id }, data: { isActive: false }, include: { department: true, room: true } });
}

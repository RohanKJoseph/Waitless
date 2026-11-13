import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/errors";

const ACTIVE_BLOCKING_STATUSES = [
  "BOOKED",
  "WAITING",
  "NOTIFIED",
  "CALLED",
  "IN_CONSULTATION",
  "DELAYED",
] as const;

export async function listDepartments(opts: { includeInactive?: boolean; activeOnly?: boolean; q?: string }) {
  const where: Prisma.DepartmentWhereInput = {};
  if (opts.activeOnly) where.isActive = true;
  else if (opts.includeInactive) {
    // no isActive filter
  } else {
    where.isActive = true;
  }

  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q, mode: "insensitive" } },
      { code: { contains: opts.q, mode: "insensitive" } },
      { location: { contains: opts.q, mode: "insensitive" } },
    ];
  }

  return prisma.department.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { doctors: { where: { isActive: true } } } },
    },
  });
}

export async function getDepartmentById(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { doctors: true } } },
  });
  if (!dept) throw AppError.notFound("Department not found");
  return dept;
}

export async function createDepartment(data: { name: string; code: string; description?: string | null; location?: string | null }) {
  const existing = await prisma.department.findFirst({
    where: { OR: [{ name: data.name }, { code: data.code }] },
  });
  if (existing) {
    throw AppError.conflict("CONFLICT", "A department with this name or code already exists");
  }
  return prisma.department.create({ data });
}

export async function updateDepartment(id: string, data: Record<string, unknown>) {
  await getDepartmentById(id);
  if (data.code || data.name) {
    const conflict = await prisma.department.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(data.name ? [{ name: data.name as string }] : []),
          ...(data.code ? [{ code: data.code as string }] : []),
        ],
      },
    });
    if (conflict) throw AppError.conflict("CONFLICT", "A department with this name or code already exists");
  }
  return prisma.department.update({ where: { id }, data });
}

export async function softDeleteDepartment(id: string) {
  await getDepartmentById(id);
  const blocking = await prisma.appointment.count({
    where: {
      departmentId: id,
      status: { in: [...ACTIVE_BLOCKING_STATUSES] },
    },
  });
  if (blocking > 0) {
    throw AppError.conflict(
      "CONFLICT",
      "Cannot deactivate department while it has active appointments",
      { activeAppointments: blocking },
    );
  }
  return prisma.department.update({ where: { id }, data: { isActive: false } });
}

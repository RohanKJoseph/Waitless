import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/errors";
import { normalizePhone, safeName } from "../../utils/phone";
import { issueSession } from "../auth/auth.service";
import { getPatientAuthProvider } from "./patient-auth.provider";

export async function createOrGetPatientSession(
  fullNameInput: string,
  phoneInput: string,
  req: Request,
  res: Response,
) {
  const phone = normalizePhone(phoneInput);
  const fullName = safeName(fullNameInput);
  const provider = getPatientAuthProvider();
  const verification = await provider.beginSession(phone);

  const existing = await prisma.patient.findUnique({
    where: { phone },
    include: { user: true },
  });

  let patientId: string;
  let userId: string;

  if (existing) {
    const updatedPatient = await prisma.patient.update({
      where: { id: existing.id },
      data: { fullName },
      include: { user: true },
    });
    let user = updatedPatient.user;
    if (!user) {
      user = await prisma.user.create({
        data: {
          role: "PATIENT",
          name: fullName,
          phone,
          patient: { connect: { id: updatedPatient.id } },
        },
      });
    } else {
      user = await prisma.user.update({ where: { id: user.id }, data: { name: fullName } });
    }
    await prisma.patient.update({ where: { id: updatedPatient.id }, data: { userId: user.id } }).catch(() => {});
    patientId = updatedPatient.id;
    userId = user.id;
  } else {
    const created = await prisma.user.create({
      data: {
        role: "PATIENT",
        name: fullName,
        phone,
        patient: {
          create: {
            fullName,
            phone,
            phoneVerified: verification.phoneVerified,
            notificationPrefs: { create: {} },
          },
        },
      },
      include: { patient: true },
    });
    if (!created.patient) throw AppError.internal("Failed to create patient profile");
    patientId = created.patient.id;
    userId = created.id;
  }

  const session = await issueSession({ id: userId, role: "PATIENT", patientId }, req, res);
  const profile = await getPatientProfileForUser(userId);

  return {
    ...session,
    profile,
    verification: {
      phoneVerified: profile.phoneVerified,
      method: verification.kind,
    },
  };
}

export async function getPatientProfileForUser(userId: string) {
  const patient = await prisma.patient.findFirst({
    where: { userId },
  });
  if (!patient) throw AppError.notFound("Patient profile not found");
  return {
    id: patient.id,
    fullName: patient.fullName,
    phone: patient.phone,
    email: patient.email,
    phoneVerified: patient.phoneVerified,
  };
}

export async function updatePatientProfile(userId: string, data: { fullName?: string; email?: string | null }) {
  const patient = await prisma.patient.findFirst({ where: { userId } });
  if (!patient) throw AppError.notFound("Patient profile not found");

  const nextName = data.fullName ? safeName(data.fullName) : undefined;
  const updated = await prisma.patient.update({
    where: { id: patient.id },
    data: {
      ...(nextName ? { fullName: nextName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(nextName ? { user: { update: { name: nextName } } } : {}),
    },
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    phone: updated.phone,
    email: updated.email,
    phoneVerified: updated.phoneVerified,
  };
}

export async function listPatientsForAdmin(query: { q?: string; page: number; pageSize: number }) {
  const where = query.q
    ? {
        OR: [
          { fullName: { contains: query.q, mode: "insensitive" as const } },
          { phone: { contains: query.q } },
          { email: { contains: query.q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { appointments: true } } },
    }),
    prisma.patient.count({ where }),
  ]);
  return { patients: items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

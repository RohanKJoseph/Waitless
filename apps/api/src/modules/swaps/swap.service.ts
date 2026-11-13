import type { AppointmentStatus, Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { socketEmitter } from "../../sockets/emitter";
import { AppError } from "../../utils/errors";

const SWAPPABLE: AppointmentStatus[] = ["BOOKED", "WAITING", "NOTIFIED"];

async function getPatientByUser(userId: string) {
  const p = await prisma.patient.findFirst({ where: { userId } });
  if (!p) throw AppError.notFound("Patient profile not found");
  return p;
}

function maskName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map((p) => p[0]?.toUpperCase() + ".").join(" ") || "Patient";
}

export async function listSwaps(auth: { userId: string; role: string }, role: "incoming" | "outgoing" | "all") {
  if (auth.role === "ADMIN" || auth.role === "STAFF") {
    return prisma.swapRequest.findMany({
      include: {
        requesterAppointment: { include: { doctor: true, patient: true } },
        targetAppointment: { include: { doctor: true, patient: true } },
        requesterPatient: true,
        targetPatient: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  const patient = await getPatientByUser(auth.userId);
  const where: Prisma.SwapRequestWhereInput = {};
  if (role === "incoming") where.targetPatientId = patient.id;
  else if (role === "outgoing") where.requesterPatientId = patient.id;
  else where.OR = [{ targetPatientId: patient.id }, { requesterPatientId: patient.id }];
  return prisma.swapRequest.findMany({
    where,
    include: {
      requesterAppointment: { include: { doctor: { include: { department: true } }, patient: true } },
      targetAppointment: { include: { doctor: { include: { department: true } }, patient: true } },
      requesterPatient: true,
      targetPatient: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function eligibleForSwap(auth: { userId: string; role: string }, appointmentId: string) {
  if (auth.role !== "PATIENT") throw AppError.forbidden();
  const patient = await getPatientByUser(auth.userId);
  const mine = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { doctor: true } });
  if (!mine) throw AppError.notFound("Appointment not found");
  if (mine.patientId !== patient.id) throw AppError.forbidden("Not your appointment");
  if (!SWAPPABLE.includes(mine.status)) throw AppError.conflict("CONFLICT", "Appointment is not eligible for swap");

  const candidates = await prisma.appointment.findMany({
    where: {
      doctorId: mine.doctorId,
      serviceDay: mine.serviceDay,
      patientId: { not: patient.id },
      status: { in: SWAPPABLE },
      swapsAsRequester: { none: { status: "PENDING" } },
      swapsAsTarget: { none: { status: "PENDING" } },
    },
    include: { patient: true },
    orderBy: { slotStart: "asc" },
    take: 30,
  });

  return candidates.map((a) => ({
    appointmentId: a.id,
    tokenNumber: a.tokenNumber,
    slotStart: a.slotStart,
    patientInitials: maskName(a.patient.fullName),
  }));
}

export async function createSwapRequest(auth: { userId: string; role: string }, input: { requesterAppointmentId: string; targetAppointmentId: string; message?: string | null }) {
  if (auth.role !== "PATIENT") throw AppError.forbidden();
  const patient = await getPatientByUser(auth.userId);
  const [reqAppt, tgtAppt] = await Promise.all([
    prisma.appointment.findUnique({ where: { id: input.requesterAppointmentId }, include: { queueEntry: true } }),
    prisma.appointment.findUnique({ where: { id: input.targetAppointmentId }, include: { queueEntry: true } }),
  ]);
  if (!reqAppt || !tgtAppt) throw AppError.notFound("Appointment not found");
  if (reqAppt.patientId !== patient.id) throw AppError.forbidden("Not your appointment");
  if (reqAppt.doctorId !== tgtAppt.doctorId || reqAppt.serviceDay !== tgtAppt.serviceDay) {
    throw AppError.conflict("CONFLICT", "Swaps are only allowed for the same doctor and day");
  }
  if (!SWAPPABLE.includes(reqAppt.status) || !SWAPPABLE.includes(tgtAppt.status)) {
    throw AppError.conflict("CONFLICT", "One or both appointments are not eligible for swap");
  }
  const earlier = reqAppt.slotStart < tgtAppt.slotStart ? reqAppt.slotStart : tgtAppt.slotStart;
  if (earlier.getTime() - Date.now() < env.SWAP_CUTOFF_MINUTES * 60_000) {
    throw AppError.conflict("CONFLICT", "Swap cutoff time has passed");
  }
  const pendingCount = await prisma.swapRequest.count({
    where: { status: "PENDING", OR: [{ requesterAppointmentId: reqAppt.id }, { targetAppointmentId: reqAppt.id }, { requesterAppointmentId: tgtAppt.id }, { targetAppointmentId: tgtAppt.id }] },
  });
  if (pendingCount > 0) throw AppError.conflict("CONFLICT", "One of these appointments already has a pending swap");

  const expiresAt = new Date(Date.now() + env.SWAP_EXPIRY_MINUTES * 60_000);
  const swap = await prisma.swapRequest.create({
    data: {
      requesterAppointmentId: reqAppt.id,
      targetAppointmentId: tgtAppt.id,
      requesterPatientId: reqAppt.patientId,
      targetPatientId: tgtAppt.patientId,
      message: input.message ?? null,
      expiresAt,
    },
    include: { requesterAppointment: { include: { doctor: true } }, targetAppointment: true, requesterPatient: true, targetPatient: true },
  });
  socketEmitter.appointmentUpdated(tgtAppt.patientId, { swapRequestId: swap.id, type: "SWAP_REQUESTED" });
  return swap;
}

export async function respondSwap(auth: { userId: string; role: string }, id: string, action: "ACCEPT" | "REJECT") {
  if (auth.role !== "PATIENT") throw AppError.forbidden();
  const patient = await getPatientByUser(auth.userId);
  const swap = await prisma.swapRequest.findUnique({
    where: { id },
    include: { requesterAppointment: { include: { queueEntry: true } }, targetAppointment: { include: { queueEntry: true } } },
  });
  if (!swap) throw AppError.notFound("Swap request not found");
  if (swap.targetPatientId !== patient.id) throw AppError.forbidden("Not your swap request");
  if (swap.status !== "PENDING") throw AppError.conflict("CONFLICT", "Swap request is no longer pending");
  if (swap.expiresAt.getTime() < Date.now()) {
    await prisma.swapRequest.update({ where: { id }, data: { status: "EXPIRED" } });
    throw AppError.conflict("CONFLICT", "Swap request has expired");
  }

  if (action === "REJECT") {
    const updated = await prisma.swapRequest.update({ where: { id }, data: { status: "REJECTED", respondedAt: new Date(), respondedByUserId: auth.userId } });
    socketEmitter.appointmentUpdated(swap.requesterPatientId, { swapRequestId: id, type: "SWAP_REJECTED" });
    return updated;
  }

  // ACCEPT - execute swap transactionally
  const result = await prisma.$transaction(async (tx) => {
    const fresh = await tx.swapRequest.findUnique({
      where: { id },
      include: { requesterAppointment: { include: { queueEntry: true } }, targetAppointment: { include: { queueEntry: true } } },
    });
    if (!fresh || fresh.status !== "PENDING") throw AppError.conflict("CONFLICT", "Swap request is no longer pending");
    const a = fresh.requesterAppointment;
    const b = fresh.targetAppointment;
    if (!SWAPPABLE.includes(a.status) || !SWAPPABLE.includes(b.status)) throw AppError.conflict("CONFLICT", "Appointments are no longer eligible");

    // swap slot/token on appointments
    await tx.appointment.update({ where: { id: a.id }, data: { slotStart: b.slotStart, slotEnd: b.slotEnd, tokenNumber: b.tokenNumber } });
    await tx.appointment.update({ where: { id: b.id }, data: { slotStart: a.slotStart, slotEnd: a.slotEnd, tokenNumber: a.tokenNumber } });

    // swap queue positions if exist
    if (a.queueEntry && b.queueEntry) {
      const posA = a.queueEntry.position;
      const posB = b.queueEntry.position;
      await tx.queueEntry.update({ where: { id: a.queueEntry.id }, data: { position: posB } });
      await tx.queueEntry.update({ where: { id: b.queueEntry.id }, data: { position: posA } });
    }

    const updated = await tx.swapRequest.update({
      where: { id },
      data: { status: "ACCEPTED", respondedAt: new Date(), respondedByUserId: auth.userId },
      include: { requesterAppointment: { include: { doctor: true } }, targetAppointment: { include: { doctor: true } }, requesterPatient: true, targetPatient: true },
    });
    await tx.auditLog.create({
      data: { actorUserId: auth.userId, action: "SWAP_ACCEPTED", entity: "SwapRequest", entityId: id, after: { requesterAppointmentId: a.id, targetAppointmentId: b.id } as Prisma.InputJsonValue },
    });
    return updated;
  });

  socketEmitter.queueUpdated(result.requesterAppointment.doctorId, { doctorId: result.requesterAppointment.doctorId, serviceDay: result.requesterAppointment.serviceDay });
  socketEmitter.appointmentUpdated(swap.requesterPatientId, { swapRequestId: id, type: "SWAP_ACCEPTED" });
  socketEmitter.appointmentUpdated(swap.targetPatientId, { swapRequestId: id, type: "SWAP_ACCEPTED" });
  return result;
}

export async function cancelSwap(auth: { userId: string; role: string }, id: string) {
  const swap = await prisma.swapRequest.findUnique({ where: { id } });
  if (!swap) throw AppError.notFound("Swap request not found");
  if (auth.role === "PATIENT") {
    const patient = await getPatientByUser(auth.userId);
    if (swap.requesterPatientId !== patient.id) throw AppError.forbidden("Not your swap request");
  }
  if (swap.status !== "PENDING") throw AppError.conflict("CONFLICT", "Swap request is no longer pending");
  return prisma.swapRequest.update({ where: { id }, data: { status: "CANCELLED", respondedAt: new Date(), respondedByUserId: auth.userId } });
}

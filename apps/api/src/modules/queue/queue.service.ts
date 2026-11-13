import type { AppointmentStatus, Prisma } from "@prisma/client";
import { assertTransition, countAhead, toDayKey } from "@waitless/shared";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/errors";

const QUEUE_STATUSES: AppointmentStatus[] = ["BOOKED", "WAITING", "NOTIFIED", "CALLED", "IN_CONSULTATION", "DELAYED", "SKIPPED"];
const ACTIVE_ORDER: AppointmentStatus[] = ["IN_CONSULTATION", "CALLED", "DELAYED", "NOTIFIED", "WAITING", "BOOKED", "SKIPPED"];

function todayKey() {
  return toDayKey(new Date(), env.HOSPITAL_TIMEZONE);
}

async function recomputePositions(tx: Prisma.TransactionClient, doctorId: string, serviceDay: string) {
  const entries = await tx.queueEntry.findMany({
    where: { doctorId, serviceDay, status: { in: QUEUE_STATUSES } },
    include: { appointment: true },
    orderBy: [
      { status: "asc" }, // will adjust in memory
      { position: "asc" },
      { appointment: { slotStart: "asc" } },
      { appointment: { tokenNumber: "asc" } },
    ],
  });
  const rank = (s: AppointmentStatus) => {
    const idx = ACTIVE_ORDER.indexOf(s);
    return idx === -1 ? 99 : idx;
  };
  entries.sort((a, b) => {
    const ra = rank(a.status), rb = rank(b.status);
    if (ra !== rb) return ra - rb;
    if (a.position !== b.position) return a.position - b.position;
    const sa = a.appointment.slotStart.getTime(), sb = b.appointment.slotStart.getTime();
    if (sa !== sb) return sa - sb;
    return a.appointment.tokenNumber - b.appointment.tokenNumber;
  });
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const pos = i + 1;
    const waitMins = entries.slice(0, i).reduce((sum, e) => {
      if (["COMPLETED", "SKIPPED", "CANCELLED", "NO_SHOW"].includes(e.status)) return sum;
      return sum + env.DEFAULT_CONSULT_MINUTES;
    }, 0);
    const est = new Date(Date.now() + waitMins * 60_000);
    if (entry.position !== pos || entry.estimatedStartAt?.getTime() !== est.getTime()) {
      await tx.queueEntry.update({ where: { id: entry.id }, data: { position: pos, estimatedStartAt: est } });
    }
  }
  return entries.length;
}

export async function ensureDayQueue(doctorId: string, date = todayKey()) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw AppError.notFound("Doctor not found");

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      serviceDay: date,
      status: { in: ["BOOKED", "WAITING", "NOTIFIED", "CALLED", "IN_CONSULTATION", "DELAYED", "SKIPPED"] },
    },
    include: { queueEntry: true },
    orderBy: [{ slotStart: "asc" }, { tokenNumber: "asc" }],
  });

  await prisma.$transaction(async (tx) => {
    let pos = 1;
    for (const appt of appointments) {
      if (appt.queueEntry) {
        pos++;
        continue;
      }
      const status: AppointmentStatus = appt.status === "BOOKED" ? "WAITING" : (appt.status as AppointmentStatus);
      await tx.queueEntry.create({
        data: {
          appointmentId: appt.id,
          doctorId,
          serviceDay: date,
          position: pos++,
          status,
          estimatedStartAt: new Date(Date.now() + (pos - 2) * env.DEFAULT_CONSULT_MINUTES * 60_000),
        },
      });
      if (appt.status === "BOOKED") {
        await tx.appointment.update({ where: { id: appt.id }, data: { status: "WAITING" } });
      }
    }
    await recomputePositions(tx, doctorId, date);
  });
}

export async function getQueue(doctorId: string, date = todayKey()) {
  await ensureDayQueue(doctorId, date);
  const [entries, doctor] = await Promise.all([
    prisma.queueEntry.findMany({
      where: { doctorId, serviceDay: date },
      include: {
        appointment: {
          include: { patient: true, department: true, doctor: { include: { room: true } } },
        },
        consultation: true,
      },
      orderBy: [{ position: "asc" }],
    }),
    prisma.doctor.findUnique({ where: { id: doctorId }, include: { department: true, room: true } }),
  ]);
  if (!doctor) throw AppError.notFound("Doctor not found");

  const current = entries.find((e) => ["CALLED", "IN_CONSULTATION"].includes(e.status)) ?? null;
  const stats = {
    waiting: entries.filter((e) => ["WAITING", "NOTIFIED", "DELAYED", "BOOKED"].includes(e.status)).length,
    called: entries.filter((e) => e.status === "CALLED").length,
    inConsultation: entries.filter((e) => e.status === "IN_CONSULTATION").length,
    completed: entries.filter((e) => e.status === "COMPLETED").length,
    skipped: entries.filter((e) => e.status === "SKIPPED").length,
    avgConsultMinutes: doctor.avgConsultMinutes,
    patientsAhead: countAhead(entries.filter((e) => !["COMPLETED", "SKIPPED", "CANCELLED", "NO_SHOW"].includes(e.status))),
  };
  return { doctor, date, entries, currentPatient: current, stats };
}

async function getEntry(id: string) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id },
    include: { appointment: { include: { patient: true, doctor: true } }, consultation: true },
  });
  if (!entry) throw AppError.notFound("Queue entry not found");
  return entry;
}

export async function callPatient(entryId: string, actorUserId: string) {
  const entry = await getEntry(entryId);
  const from = entry.status;
  assertTransition(from, "CALLED");
  const now = new Date();
  const graceDeadlineAt = new Date(now.getTime() + env.GRACE_MINUTES * 60_000);
  const updated = await prisma.$transaction(async (tx) => {
    const qe = await tx.queueEntry.update({
      where: { id: entryId },
      data: { status: "CALLED", calledAt: now, graceDeadlineAt },
      include: { appointment: { include: { patient: true, department: true, doctor: { include: { room: true } } } }, consultation: true },
    });
    await tx.appointment.update({ where: { id: entry.appointmentId }, data: { status: "CALLED" } });
    await tx.auditLog.create({ data: { actorUserId, action: "QUEUE_CALLED", entity: "QueueEntry", entityId: entryId, before: { status: from } as Prisma.InputJsonValue, after: { status: "CALLED" } as Prisma.InputJsonValue } });
    await recomputePositions(tx, entry.doctorId, entry.serviceDay);
    return qe;
  });
  return updated;
}

export async function startConsultation(entryId: string, actorUserId: string) {
  const entry = await getEntry(entryId);
  const from = entry.status;
  assertTransition(from, "IN_CONSULTATION");
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.queueEntry.update({
      where: { id: entryId },
      data: { status: "IN_CONSULTATION" },
    });
    await tx.appointment.update({ where: { id: entry.appointmentId }, data: { status: "IN_CONSULTATION" } });
    await tx.consultation.upsert({
      where: { queueEntryId: entryId },
      update: { startedAt: now, endedAt: null, endSource: null, durationSeconds: null, startedByUserId: actorUserId },
      create: { queueEntryId: entryId, startedAt: now, startedByUserId: actorUserId },
    });
    await tx.auditLog.create({ data: { actorUserId, action: "QUEUE_STARTED", entity: "QueueEntry", entityId: entryId, before: { status: from } as Prisma.InputJsonValue, after: { status: "IN_CONSULTATION" } as Prisma.InputJsonValue } });
    await recomputePositions(tx, entry.doctorId, entry.serviceDay);
    return tx.queueEntry.findUniqueOrThrow({ where: { id: entryId }, include: { appointment: { include: { patient: true, department: true, doctor: { include: { room: true } } } }, consultation: true } });
  });
}

export async function completeConsultation(entryId: string, actorUserId: string) {
  const entry = await getEntry(entryId);
  const from = entry.status;
  assertTransition(from, "COMPLETED");
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const consult = await tx.consultation.findUnique({ where: { queueEntryId: entryId } });
    const startedAt = consult?.startedAt ?? entry.calledAt ?? now;
    const durationSeconds = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));
    await tx.consultation.upsert({
      where: { queueEntryId: entryId },
      update: { endedAt: now, endSource: "STAFF", durationSeconds },
      create: { queueEntryId: entryId, startedAt, endedAt: now, endSource: "STAFF", durationSeconds, startedByUserId: actorUserId },
    });
    await tx.queueEntry.update({ where: { id: entryId }, data: { status: "COMPLETED", completedAt: now } });
    await tx.appointment.update({ where: { id: entry.appointmentId }, data: { status: "COMPLETED" } });
    await tx.auditLog.create({ data: { actorUserId, action: "QUEUE_COMPLETED", entity: "QueueEntry", entityId: entryId, before: { status: from } as Prisma.InputJsonValue, after: { status: "COMPLETED", durationSeconds } as Prisma.InputJsonValue } });
    await recomputePositions(tx, entry.doctorId, entry.serviceDay);
    return tx.queueEntry.findUniqueOrThrow({ where: { id: entryId }, include: { appointment: { include: { patient: true, department: true, doctor: { include: { room: true } } } }, consultation: true } });
  });
}

export async function skipPatient(entryId: string, actorUserId: string, reason?: string) {
  const entry = await getEntry(entryId);
  const from = entry.status;
  assertTransition(from, "SKIPPED");
  return prisma.$transaction(async (tx) => {
    await tx.queueEntry.update({ where: { id: entryId }, data: { status: "SKIPPED", skippedReason: reason ?? null } });
    await tx.appointment.update({ where: { id: entry.appointmentId }, data: { status: "SKIPPED" } });
    await tx.auditLog.create({ data: { actorUserId, action: "QUEUE_SKIPPED", entity: "QueueEntry", entityId: entryId, before: { status: from } as Prisma.InputJsonValue, after: { status: "SKIPPED", reason: reason ?? null } as Prisma.InputJsonValue } });
    await recomputePositions(tx, entry.doctorId, entry.serviceDay);
    return tx.queueEntry.findUniqueOrThrow({ where: { id: entryId }, include: { appointment: { include: { patient: true, department: true, doctor: { include: { room: true } } } }, consultation: true } });
  });
}

export async function markArrived(entryId: string, actorUserId: string) {
  const entry = await getEntry(entryId);
  // if skipped, allow requeue to WAITING (SKIPPED -> CALLED not right for arrive; use WAITING via state? SKIPPED can go to CALLED per state machine, but arrive means back in queue)
  if (entry.status === "SKIPPED") {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.queueEntry.update({ where: { id: entryId }, data: { status: "WAITING", skippedReason: null } });
      await tx.appointment.update({ where: { id: entry.appointmentId }, data: { status: "WAITING" } });
      await tx.auditLog.create({ data: { actorUserId, action: "QUEUE_REQUEUED", entity: "QueueEntry", entityId: entryId, before: { status: "SKIPPED" } as Prisma.InputJsonValue, after: { status: "WAITING" } as Prisma.InputJsonValue } });
      await recomputePositions(tx, entry.doctorId, entry.serviceDay);
      return tx.queueEntry.findUniqueOrThrow({ where: { id: entryId }, include: { appointment: { include: { patient: true, department: true, doctor: { include: { room: true } } } }, consultation: true } });
    });
    return updated;
  }
  // no-op for others for now
  return getEntry(entryId);
}

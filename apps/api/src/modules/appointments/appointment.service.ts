import { Prisma, type AppointmentStatus } from "@prisma/client";
import { canCancel, toDayKey, zonedDateTimeToUtc } from "@waitless/shared";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/errors";
import { normalizePhone, safeName } from "../../utils/phone";

const ACTIVE_STATUSES = ["BOOKED", "WAITING", "NOTIFIED", "CALLED", "IN_CONSULTATION", "DELAYED"] as const;

type AuthCtx = { userId: string; role: "ADMIN" | "STAFF" | "PATIENT"; patientId?: string | null };

async function getPatientByUser(userId: string) {
  const patient = await prisma.patient.findFirst({ where: { userId } });
  if (!patient) throw AppError.notFound("Patient profile not found");
  return patient;
}

async function ensureSlotBookable(tx: Prisma.TransactionClient, doctorId: string, slotStart: Date, serviceDay: string) {
  const doctor = await tx.doctor.findUnique({ where: { id: doctorId }, include: { department: true } });
  if (!doctor) throw AppError.notFound("Doctor not found");
  if (!doctor.isActive) throw AppError.conflict("CONFLICT", "Doctor is not active");

  // Validate slot exists in availability for that day (simple check against schedules/exceptions via same logic as availability)
  const day = serviceDay;
  const weekday = new Date(`${day}T00:00:00.000Z`).getUTCDay();
  const schedules = await tx.doctorSchedule.findMany({ where: { doctorId, dayOfWeek: weekday, isActive: true } });
  const exception = await tx.scheduleException.findUnique({ where: { doctorId_date: { doctorId, date: new Date(`${day}T00:00:00.000Z`) } } });

  let windows = schedules.map((s) => ({ startMinute: s.startMinute, endMinute: s.endMinute, slotMinutes: s.slotMinutes }));
  if (exception) {
    if (exception.isClosed) windows = [];
    else if (exception.startMinute != null && exception.endMinute != null) {
      windows = [{ startMinute: exception.startMinute, endMinute: exception.endMinute, slotMinutes: schedules[0]?.slotMinutes ?? 15 }];
    }
  }
  const slotMinute = (() => {
    // derive minute-of-day in hospital tz
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: env.HOSPITAL_TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false });
    const parts = fmt.formatToParts(slotStart);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return h * 60 + m;
  })();

  const matchWindow = windows.find((w) => {
    if (slotMinute < w.startMinute || slotMinute >= w.endMinute) return false;
    return (slotMinute - w.startMinute) % w.slotMinutes === 0 && slotMinute + w.slotMinutes <= w.endMinute;
  });
  if (!matchWindow) throw AppError.badRequest("Selected slot is not available for this doctor");

  const slotEnd = zonedDateTimeToUtc(day, slotMinute + matchWindow.slotMinutes, env.HOSPITAL_TIMEZONE);

  const conflict = await tx.appointment.findFirst({
    where: { doctorId, slotStart, status: { in: [...ACTIVE_STATUSES] } },
    select: { id: true },
  });
  if (conflict) throw AppError.conflict("SLOT_TAKEN", "That time slot is no longer available");

  if (slotStart.getTime() <= Date.now()) {
    throw AppError.badRequest("Cannot book a slot in the past");
  }

  return { doctor, slotEnd, serviceDay: day, departmentId: doctor.departmentId };
}

async function allocateToken(tx: Prisma.TransactionClient, doctorId: string, serviceDay: string) {
  const agg = await tx.appointment.aggregate({
    where: { doctorId, serviceDay },
    _max: { tokenNumber: true },
  });
  return (agg._max.tokenNumber ?? 0) + 1;
}

export async function createAppointment(auth: AuthCtx, input: { doctorId: string; slotStart: string; notes?: string | null; source?: "QR" | "REMOTE" }) {
  if (auth.role !== "PATIENT" || !auth.patientId) throw AppError.forbidden("Only patients can book appointments");
  const slotStart = new Date(input.slotStart);
  if (Number.isNaN(slotStart.getTime())) throw AppError.badRequest("Invalid slotStart");
  const serviceDay = toDayKey(slotStart, env.HOSPITAL_TIMEZONE);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const { doctor, slotEnd, departmentId } = await ensureSlotBookable(tx, input.doctorId, slotStart, serviceDay);
        const tokenNumber = await allocateToken(tx, doctor.id, serviceDay);
        const appointment = await tx.appointment.create({
          data: {
            patientId: auth.patientId!,
            doctorId: doctor.id,
            departmentId,
            slotStart,
            slotEnd,
            serviceDay,
            tokenNumber,
            status: "BOOKED",
            source: input.source ?? "REMOTE",
            notes: input.notes ?? null,
            bookedByUserId: auth.userId,
          },
          include: {
            doctor: { include: { department: true, room: true } },
            patient: true,
            department: true,
          },
        });
        // basic in-app notification record (Phase 7 will make this robust/scheduled)
        await tx.notification.create({
          data: {
            patientId: appointment.patientId,
            userId: auth.userId,
            appointmentId: appointment.id,
            type: "BOOKING_CONFIRMED",
            channel: "IN_APP",
            title: "Appointment booked",
            body: `Your appointment with ${doctor.fullName} is confirmed for ${serviceDay} (token #${tokenNumber}).`,
            status: "SENT",
            sentAt: new Date(),
            dedupeKey: `booking:${appointment.id}`,
          },
        }).catch(() => {});
        return appointment;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) {
        continue;
      }
      throw err;
    }
  }
  throw AppError.conflict("CONFLICT", "Could not allocate a booking, please try again");
}

export async function createWalkIn(auth: AuthCtx, input: { doctorId: string; slotStart: string; patient: { fullName: string; phone: string }; notes?: string | null }) {
  if (auth.role !== "ADMIN" && auth.role !== "STAFF") throw AppError.forbidden("Only staff can register walk-ins");
  const slotStart = new Date(input.slotStart);
  if (Number.isNaN(slotStart.getTime())) throw AppError.badRequest("Invalid slotStart");
  const serviceDay = toDayKey(slotStart, env.HOSPITAL_TIMEZONE);
  const phone = normalizePhone(input.patient.phone);
  const fullName = safeName(input.patient.fullName);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        let patient = await tx.patient.findUnique({ where: { phone } });
        if (!patient) {
          const user = await tx.user.create({ data: { role: "PATIENT", name: fullName, phone } });
          patient = await tx.patient.create({
            data: { userId: user.id, fullName, phone, notificationPrefs: { create: {} } },
          });
        } else if (patient.fullName !== fullName) {
          patient = await tx.patient.update({ where: { id: patient.id }, data: { fullName } });
        }

        const { doctor, slotEnd, departmentId } = await ensureSlotBookable(tx, input.doctorId, slotStart, serviceDay);
        const tokenNumber = await allocateToken(tx, doctor.id, serviceDay);
        const appointment = await tx.appointment.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            departmentId,
            slotStart,
            slotEnd,
            serviceDay,
            tokenNumber,
            status: "BOOKED",
            source: "WALK_IN",
            notes: input.notes ?? null,
            bookedByUserId: auth.userId,
          },
          include: {
            doctor: { include: { department: true, room: true } },
            patient: true,
            department: true,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action: "APPOINTMENT_CREATED",
            entity: "Appointment",
            entityId: appointment.id,
            after: { source: "WALK_IN", tokenNumber, serviceDay } as unknown as Prisma.InputJsonValue,
          },
        });
        return appointment;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) continue;
      throw err;
    }
  }
  throw AppError.conflict("CONFLICT", "Could not allocate a booking, please try again");
}

export async function listAppointments(auth: AuthCtx, query: { date?: string; doctorId?: string; patientId?: string; status?: string; q?: string; page: number; pageSize: number }) {
  const where: Prisma.AppointmentWhereInput = {};
  if (auth.role === "PATIENT") {
    const patient = await getPatientByUser(auth.userId);
    where.patientId = patient.id;
  } else if (query.patientId) {
    where.patientId = query.patientId;
  }
  if (query.date) where.serviceDay = query.date;
  if (query.doctorId) where.doctorId = query.doctorId;
  if (query.status) where.status = query.status as AppointmentStatus;
  if (query.q) {
    const or: Prisma.AppointmentWhereInput[] = [
      { patient: { fullName: { contains: query.q, mode: "insensitive" } } },
      { patient: { phone: { contains: query.q } } },
      { doctor: { fullName: { contains: query.q, mode: "insensitive" } } },
    ];
    const asNum = Number(query.q);
    if (Number.isInteger(asNum)) or.push({ tokenNumber: asNum });
    where.OR = or;
  }

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { doctor: { include: { department: true, room: true } }, department: true, patient: true, queueEntry: true },
      orderBy: [{ slotStart: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.appointment.count({ where }),
  ]);
  return { appointments: items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

export async function getAppointmentById(auth: AuthCtx, id: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { doctor: { include: { department: true, room: true } }, department: true, patient: true, queueEntry: true },
  });
  if (!appt) throw AppError.notFound("Appointment not found");
  if (auth.role === "PATIENT") {
    const patient = await getPatientByUser(auth.userId);
    if (appt.patientId !== patient.id) throw AppError.forbidden("You can only access your own appointments");
  }
  return appt;
}

export async function cancelAppointment(auth: AuthCtx, id: string, reason?: string) {
  const appt = await getAppointmentById(auth, id);
  if (!canCancel(appt.status)) {
    throw AppError.conflict("INVALID_TRANSITION", "This appointment can no longer be cancelled");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.appointment.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason ?? null },
      include: { doctor: { include: { department: true, room: true } }, department: true, patient: true, queueEntry: true },
    });
    if (next.queueEntry) {
      await tx.queueEntry.delete({ where: { id: next.queueEntry.id } }).catch(() => {});
    }
    await tx.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action: "APPOINTMENT_CANCELLED",
        entity: "Appointment",
        entityId: id,
        before: { status: appt.status } as Prisma.InputJsonValue,
        after: { status: "CANCELLED", reason: reason ?? null } as Prisma.InputJsonValue,
      },
    });
    return next;
  });
  return updated;
}

export async function rescheduleAppointment(auth: AuthCtx, id: string, slotStartIso: string, reason?: string) {
  if (auth.role !== "ADMIN" && auth.role !== "STAFF") throw AppError.forbidden("Only staff can reschedule appointments");
  const appt = await getAppointmentById(auth, id);
  if (!canCancel(appt.status)) throw AppError.conflict("INVALID_TRANSITION", "This appointment cannot be rescheduled");
  const slotStart = new Date(slotStartIso);
  if (Number.isNaN(slotStart.getTime())) throw AppError.badRequest("Invalid slotStart");
  const serviceDay = toDayKey(slotStart, env.HOSPITAL_TIMEZONE);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const { slotEnd, departmentId } = await ensureSlotBookable(tx, appt.doctorId, slotStart, serviceDay);
        // new token for new day/slot context
        const tokenNumber = await allocateToken(tx, appt.doctorId, serviceDay);
        const updated = await tx.appointment.update({
          where: { id },
          data: { slotStart, slotEnd, serviceDay, tokenNumber, departmentId, notes: reason ? `${appt.notes ? appt.notes + "\n" : ""}Rescheduled: ${reason}` : appt.notes },
          include: { doctor: { include: { department: true, room: true } }, department: true, patient: true, queueEntry: true },
        });
        await tx.auditLog.create({
          data: { actorUserId: auth.userId, action: "APPOINTMENT_RESCHEDULED", entity: "Appointment", entityId: id, before: { slotStart: appt.slotStart.toISOString(), serviceDay: appt.serviceDay } as Prisma.InputJsonValue, after: { slotStart: slotStart.toISOString(), serviceDay } as Prisma.InputJsonValue },
        });
        return updated;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) continue;
      throw err;
    }
  }
  throw AppError.conflict("CONFLICT", "Could not reschedule appointment");
}

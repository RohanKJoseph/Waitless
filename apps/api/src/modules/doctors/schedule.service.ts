import { dayOfWeek, generateSlotsForWindows, zonedDateTimeToUtc, type ScheduleWindow } from "@waitless/shared";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/errors";
import { getDoctorById } from "./doctor.service";

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

async function assertNoOverlap(doctorId: string, weekday: number, startMinute: number, endMinute: number, excludeId?: string) {
  const existing = await prisma.doctorSchedule.findMany({
    where: { doctorId, dayOfWeek: weekday, isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, startMinute: true, endMinute: true },
  });
  for (const row of existing) {
    if (overlaps(startMinute, endMinute, row.startMinute, row.endMinute)) {
      throw AppError.conflict("CONFLICT", "Schedule window overlaps an existing window for this day", {
        conflictingScheduleId: row.id,
      });
    }
  }
}

export async function listSchedules(doctorId: string) {
  await getDoctorById(doctorId);
  return prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
}

export async function createSchedule(doctorId: string, data: { dayOfWeek: number; startMinute: number; endMinute: number; slotMinutes: number; isActive?: boolean }) {
  await getDoctorById(doctorId);
  await assertNoOverlap(doctorId, data.dayOfWeek, data.startMinute, data.endMinute);
  return prisma.doctorSchedule.create({
    data: {
      doctorId,
      dayOfWeek: data.dayOfWeek,
      startMinute: data.startMinute,
      endMinute: data.endMinute,
      slotMinutes: data.slotMinutes,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateSchedule(doctorId: string, scheduleId: string, data: Partial<{ dayOfWeek: number; startMinute: number; endMinute: number; slotMinutes: number; isActive: boolean }>) {
  await getDoctorById(doctorId);
  const existing = await prisma.doctorSchedule.findFirst({ where: { id: scheduleId, doctorId } });
  if (!existing) throw AppError.notFound("Schedule not found");

  const next = {
    dayOfWeek: data.dayOfWeek ?? existing.dayOfWeek,
    startMinute: data.startMinute ?? existing.startMinute,
    endMinute: data.endMinute ?? existing.endMinute,
    slotMinutes: data.slotMinutes ?? existing.slotMinutes,
    isActive: data.isActive ?? existing.isActive,
  };
  if (next.endMinute <= next.startMinute) throw AppError.badRequest("endMinute must be after startMinute");
  if (next.isActive) await assertNoOverlap(doctorId, next.dayOfWeek, next.startMinute, next.endMinute, scheduleId);

  return prisma.doctorSchedule.update({ where: { id: scheduleId }, data: next });
}

export async function deleteSchedule(doctorId: string, scheduleId: string) {
  const existing = await prisma.doctorSchedule.findFirst({ where: { id: scheduleId, doctorId } });
  if (!existing) throw AppError.notFound("Schedule not found");
  await prisma.doctorSchedule.delete({ where: { id: scheduleId } });
  return { deleted: true };
}

export async function listExceptions(doctorId: string) {
  await getDoctorById(doctorId);
  return prisma.scheduleException.findMany({ where: { doctorId }, orderBy: { date: "desc" } });
}

export async function upsertException(doctorId: string, data: { date: string; isClosed: boolean; startMinute?: number | null; endMinute?: number | null; note?: string | null }) {
  await getDoctorById(doctorId);
  const date = new Date(`${data.date}T00:00:00.000Z`);
  return prisma.scheduleException.upsert({
    where: { doctorId_date: { doctorId, date } },
    update: {
      isClosed: data.isClosed,
      startMinute: data.isClosed ? null : data.startMinute ?? null,
      endMinute: data.isClosed ? null : data.endMinute ?? null,
      note: data.note ?? null,
    },
    create: {
      doctorId,
      date,
      isClosed: data.isClosed,
      startMinute: data.isClosed ? null : data.startMinute ?? null,
      endMinute: data.isClosed ? null : data.endMinute ?? null,
      note: data.note ?? null,
    },
  });
}

export async function deleteException(doctorId: string, exceptionId: string) {
  const existing = await prisma.scheduleException.findFirst({ where: { id: exceptionId, doctorId } });
  if (!existing) throw AppError.notFound("Schedule exception not found");
  await prisma.scheduleException.delete({ where: { id: exceptionId } });
  return { deleted: true };
}

export async function getAvailability(doctorId: string, dateKey: string) {
  await getDoctorById(doctorId);
  const weekday = dayOfWeek(dateKey);
  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorId, dayOfWeek: weekday, isActive: true },
  });
  const exception = await prisma.scheduleException.findUnique({
    where: { doctorId_date: { doctorId, date: new Date(`${dateKey}T00:00:00.000Z`) } },
  });

  let windows: ScheduleWindow[] = schedules.map((s) => ({ startMinute: s.startMinute, endMinute: s.endMinute, slotMinutes: s.slotMinutes }));
  if (exception) {
    if (exception.isClosed) {
      windows = [];
    } else if (exception.startMinute != null && exception.endMinute != null) {
      windows = [{ startMinute: exception.startMinute, endMinute: exception.endMinute, slotMinutes: schedules[0]?.slotMinutes ?? 15 }];
    }
  }

  let slots: ReturnType<typeof generateSlotsForWindows> = [];
  if (windows.length) {
    try {
      slots = generateSlotsForWindows(windows);
    } catch {
      slots = [];
    }
  }

  const taken = await prisma.appointment.findMany({
    where: {
      doctorId,
      serviceDay: dateKey,
      status: { in: ["BOOKED", "WAITING", "NOTIFIED", "CALLED", "IN_CONSULTATION", "DELAYED"] },
    },
    select: { slotStart: true },
  });
  const takenSet = new Set(taken.map((a) => a.slotStart.toISOString()));
  const now = new Date();

  return {
    doctorId,
    date: dateKey,
    timezone: env.HOSPITAL_TIMEZONE,
    isOnDuty: slots.length > 0 && !exception?.isClosed,
    exception: exception ? { isClosed: exception.isClosed, note: exception.note } : null,
    slots: slots.map((slot) => {
      const start = zonedDateTimeToUtc(dateKey, slot.startMinute, env.HOSPITAL_TIMEZONE);
      const end = zonedDateTimeToUtc(dateKey, slot.endMinute, env.HOSPITAL_TIMEZONE);
      const isBooked = takenSet.has(start.toISOString());
      return {
        start: start.toISOString(),
        end: end.toISOString(),
        label: slot.label,
        rangeLabel: slot.rangeLabel,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        isBooked,
        isPast: start.getTime() <= now.getTime(),
      };
    }),
  };
}

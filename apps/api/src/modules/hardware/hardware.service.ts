import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/errors";

export async function ingestHardwareEvent(input: { roomId: string; type: "OCCUPIED" | "VACANT" | "HEARTBEAT"; ts?: string | number; seq?: string | number; payload?: Record<string, unknown> }) {
  const room = await prisma.room.findUnique({ where: { code: input.roomId } }) ?? await prisma.room.findUnique({ where: { id: input.roomId } });
  if (!room) throw AppError.notFound("Room not found");

  const occurredAt = input.ts ? new Date(input.ts) : new Date();
  const seq = input.seq ?? Date.now();
  const dedupeKey = `${room.code}:${seq}:${input.type}`;
  try {
    const event = await prisma.hardwareEvent.create({
      data: {
        roomId: room.id,
        doctorId: (await prisma.doctor.findFirst({ where: { roomId: room.id }, select: { id: true } }))?.id ?? null,
        type: input.type,
        occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
        payload: input.payload ? (input.payload as Prisma.InputJsonValue) : Prisma.JsonNull,
        dedupeKey,
        processedAt: new Date(),
        result: "RECORDED",
      },
    });
    await prisma.room.update({ where: { id: room.id }, data: { lastSeenAt: new Date() } });
    return { event, duplicate: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { event: null, duplicate: true };
    }
    throw err;
  }
}

export async function listRecentHardwareEvents(roomCode?: string) {
  const where = roomCode ? { room: { code: roomCode } } : {};
  return prisma.hardwareEvent.findMany({ where, include: { room: true, doctor: true }, orderBy: { receivedAt: "desc" }, take: 20 });
}

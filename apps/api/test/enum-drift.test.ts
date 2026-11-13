import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_STATUSES,
  BOOKING_SOURCES,
  CONSULTATION_END_SOURCES,
  HARDWARE_EVENT_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  ROLES,
  SWAP_STATUSES,
} from "@waitless/shared";

/**
 * Guards against the most annoying class of bug in this codebase: the client
 * and the database disagreeing about a status value. Parses Prisma's enums
 * without needing a database connection.
 */
const schema = readFileSync(resolve(import.meta.dirname, "../prisma/schema.prisma"), "utf8");

function prismaEnum(name: string): string[] {
  const match = new RegExp(`enum\\s+${name}\\s*\\{([^}]*)\\}`, "m").exec(schema);
  if (!match?.[1]) throw new Error(`Enum ${name} not found in schema.prisma`);
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("//"))
    .map((line) => line.split(/\s+/)[0] as string);
}

describe("prisma enums match @waitless/shared", () => {
  it.each([
    ["Role", ROLES],
    ["AppointmentStatus", APPOINTMENT_STATUSES],
    ["BookingSource", BOOKING_SOURCES],
    ["NotificationType", NOTIFICATION_TYPES],
    ["NotificationChannel", NOTIFICATION_CHANNELS],
    ["NotificationStatus", NOTIFICATION_STATUSES],
    ["SwapStatus", SWAP_STATUSES],
    ["HardwareEventType", HARDWARE_EVENT_TYPES],
    ["ConsultationEndSource", CONSULTATION_END_SOURCES],
  ])("%s", (name, expected) => {
    expect(prismaEnum(name)).toEqual([...expected]);
  });
});

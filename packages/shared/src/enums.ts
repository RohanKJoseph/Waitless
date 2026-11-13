import { z } from "zod";

/**
 * Domain enums — the single source of truth.
 *
 * These arrays are duplicated as Prisma enums in
 * `apps/api/prisma/schema.prisma`. A drift test in the API package parses the
 * schema file and fails if the two disagree, so do not add a value here without
 * updating the schema (and vice versa).
 */

export const ROLES = ["ADMIN", "STAFF", "PATIENT"] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = (typeof ROLES)[number];

export const APPOINTMENT_STATUSES = [
  "BOOKED",
  "WAITING",
  "NOTIFIED",
  "CALLED",
  "IN_CONSULTATION",
  "COMPLETED",
  "DELAYED",
  "SKIPPED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const AppointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

export const TERMINAL_APPOINTMENT_STATUSES = [
  "COMPLETED",
  "CANCELLED",
  "SKIPPED",
  "NO_SHOW",
] as const satisfies readonly AppointmentStatus[];
export type TerminalAppointmentStatus = (typeof TERMINAL_APPOINTMENT_STATUSES)[number];

export const ACTIVE_QUEUE_STATUSES = [
  "BOOKED",
  "WAITING",
  "NOTIFIED",
  "CALLED",
  "DELAYED",
  "IN_CONSULTATION",
] as const satisfies readonly AppointmentStatus[];

export const BOOKING_SOURCES = ["QR", "REMOTE", "WALK_IN"] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];
export const BookingSourceSchema = z.enum(BOOKING_SOURCES);

export const NOTIFICATION_TYPES = [
  "BOOKING_CONFIRMED",
  "READY_30_MIN",
  "NEXT_IN_QUEUE",
  "DELAY_WARNING",
  "SKIPPED",
  "QUEUE_UPDATED",
  "SWAP_REQUESTED",
  "SWAP_ACCEPTED",
  "SWAP_REJECTED",
  "SWAP_EXPIRED",
  "APPOINTMENT_CANCELLED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export const NOTIFICATION_CHANNELS = ["IN_APP", "WEB_PUSH", "SMS", "EMAIL"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export const NotificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);

export const NOTIFICATION_STATUSES = [
  "PENDING",
  "SCHEDULED",
  "SENT",
  "FAILED",
  "CANCELLED",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
export const NotificationStatusSchema = z.enum(NOTIFICATION_STATUSES);

export const SWAP_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"] as const;
export type SwapStatus = (typeof SWAP_STATUSES)[number];
export const SwapStatusSchema = z.enum(SWAP_STATUSES);

export const HARDWARE_EVENT_TYPES = ["OCCUPIED", "VACANT", "HEARTBEAT"] as const;
export type HardwareEventType = (typeof HARDWARE_EVENT_TYPES)[number];
export const HardwareEventTypeSchema = z.enum(HARDWARE_EVENT_TYPES);

export const CONSULTATION_END_SOURCES = ["STAFF", "SENSOR", "TIMEOUT", "SYSTEM"] as const;
export type ConsultationEndSource = (typeof CONSULTATION_END_SOURCES)[number];
export const ConsultationEndSourceSchema = z.enum(CONSULTATION_END_SOURCES);

export const SKIP_POLICIES = ["end", "drop"] as const;
export type SkipPolicy = (typeof SKIP_POLICIES)[number];
export const SkipPolicySchema = z.enum(SKIP_POLICIES);

export const AUDIT_ACTIONS = [
  "APPOINTMENT_CREATED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_RESCHEDULED",
  "APPOINTMENT_CHECKED_IN",
  "QUEUE_CALLED",
  "QUEUE_STARTED",
  "QUEUE_COMPLETED",
  "QUEUE_SKIPPED",
  "QUEUE_REQUEUED",
  "QUEUE_REORDERED",
  "SWAP_ACCEPTED",
  "SWAP_REJECTED",
  "SWAP_EXPIRED",
  "DOCTOR_CREATED",
  "DOCTOR_UPDATED",
  "DOCTOR_DEACTIVATED",
  "DEPARTMENT_CREATED",
  "DEPARTMENT_UPDATED",
  "DEPARTMENT_DEACTIVATED",
  "SCHEDULE_UPDATED",
  "STAFF_LOGIN",
  "PATIENT_SIGNED_IN",
  "HARDWARE_OVERRIDE",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export const AuditActionSchema = z.enum(AUDIT_ACTIONS);

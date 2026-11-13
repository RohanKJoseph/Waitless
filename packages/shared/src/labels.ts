import type {
  AppointmentStatus,
  NotificationType,
  Role,
  SwapStatus,
  BookingSource,
} from "./enums";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "muted";

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
  /** Shown to the patient. Keep it human, never expose internal jargon. */
  patientHint: string;
}

export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  BOOKED: {
    label: "Booked",
    tone: "info",
    patientHint: "Your appointment is confirmed. Arrive 10 minutes early.",
  },
  WAITING: {
    label: "Waiting",
    tone: "info",
    patientHint: "You are checked in and in the queue.",
  },
  NOTIFIED: {
    label: "Notified",
    tone: "warning",
    patientHint: "We have alerted you. Please stay nearby.",
  },
  CALLED: {
    label: "Called",
    tone: "warning",
    patientHint: "You are being called. Please go to the doctor's room.",
  },
  IN_CONSULTATION: {
    label: "In consultation",
    tone: "success",
    patientHint: "The doctor is seeing you.",
  },
  COMPLETED: {
    label: "Completed",
    tone: "success",
    patientHint: "Consultation finished. Take care!",
  },
  DELAYED: {
    label: "Delayed",
    tone: "danger",
    patientHint: "You have not reached the desk. Please check in now.",
  },
  SKIPPED: {
    label: "Skipped",
    tone: "danger",
    patientHint: "Your turn was skipped. Contact the front desk.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "muted",
    patientHint: "This appointment was cancelled.",
  },
  NO_SHOW: {
    label: "No show",
    tone: "muted",
    patientHint: "You did not arrive in time.",
  },
};

export const ROLE_META: Record<Role, { label: string }> = {
  ADMIN: { label: "Administrator" },
  STAFF: { label: "Front desk" },
  PATIENT: { label: "Patient" },
};

export const SWAP_STATUS_META: Record<SwapStatus, StatusMeta> = {
  PENDING: {
    label: "Pending",
    tone: "warning",
    patientHint: "Waiting for the other patient to respond.",
  },
  ACCEPTED: {
    label: "Accepted",
    tone: "success",
    patientHint: "Swapped. Check your updated appointment time.",
  },
  REJECTED: {
    label: "Rejected",
    tone: "muted",
    patientHint: "The other patient declined.",
  },
  EXPIRED: {
    label: "Expired",
    tone: "muted",
    patientHint: "The request expired before a response.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "muted",
    patientHint: "The request was cancelled.",
  },
};

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  QR: "QR scan",
  REMOTE: "Remote",
  WALK_IN: "Walk-in",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  BOOKING_CONFIRMED: "Appointment confirmed",
  READY_30_MIN: "Get ready — 30 minutes",
  NEXT_IN_QUEUE: "You're next",
  DELAY_WARNING: "Please check in",
  SKIPPED: "Turn skipped",
  QUEUE_UPDATED: "Queue updated",
  SWAP_REQUESTED: "Swap request",
  SWAP_ACCEPTED: "Swap accepted",
  SWAP_REJECTED: "Swap declined",
  SWAP_EXPIRED: "Swap expired",
  APPOINTMENT_CANCELLED: "Appointment cancelled",
};

import type { AppointmentStatus } from "./enums";

/**
 * The only legal status transitions in the system.
 *
 * Rules:
 *  - The backend is the sole authority; the web client requests *actions*
 *    (`call`, `complete`, `skip`) and never sets a status directly.
 *  - A transition not listed here is rejected with `INVALID_TRANSITION` (409).
 *  - `NOTIFIED` is a side-state of waiting (an alert was sent) and is never a
 *    dead end.
 */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  BOOKED: ["WAITING", "CANCELLED", "NO_SHOW"],
  WAITING: ["NOTIFIED", "CALLED", "DELAYED", "CANCELLED", "NO_SHOW"],
  NOTIFIED: ["CALLED", "DELAYED", "SKIPPED", "CANCELLED"],
  CALLED: ["IN_CONSULTATION", "DELAYED", "SKIPPED", "WAITING"],
  DELAYED: ["CALLED", "WAITING", "SKIPPED", "CANCELLED"],
  IN_CONSULTATION: ["COMPLETED"],
  COMPLETED: [],
  SKIPPED: ["CALLED"],
  CANCELLED: [],
  NO_SHOW: [],
};

/** Statuses a patient can still cancel from (mirrors the plan, section 15). */
export const CANCELLABLE_STATUSES = [
  "BOOKED",
  "WAITING",
  "NOTIFIED",
  "DELAYED",
] as const satisfies readonly AppointmentStatus[];

/** Statuses that occupy a queue position. */
export const QUEUE_BLOCKING_STATUSES = [
  "WAITING",
  "NOTIFIED",
  "CALLED",
  "DELAYED",
  "IN_CONSULTATION",
] as const satisfies readonly AppointmentStatus[];

export class TransitionError extends Error {
  readonly code = "INVALID_TRANSITION" as const;
  readonly from: AppointmentStatus;
  readonly to: AppointmentStatus;

  constructor(from: AppointmentStatus, to: AppointmentStatus) {
    super(`Illegal appointment transition: ${from} -> ${to}`);
    this.name = "TransitionError";
    this.from = from;
    this.to = to;
  }
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  if (from === to) return false;
  return APPOINTMENT_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!canTransition(from, to)) throw new TransitionError(from, to);
}

export function canCancel(status: AppointmentStatus): boolean {
  return (CANCELLABLE_STATUSES as readonly AppointmentStatus[]).includes(status);
}

export function isTerminal(status: AppointmentStatus): boolean {
  return APPOINTMENT_TRANSITIONS[status].length === 0;
}

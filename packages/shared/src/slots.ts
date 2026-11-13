import { minutesToTime } from "./time";

export interface ScheduleWindow {
  /** Minutes from midnight, hospital-local. */
  startMinute: number;
  /** Minutes from midnight, hospital-local. Exclusive. */
  endMinute: number;
  slotMinutes: number;
}

export interface SlotRange {
  startMinute: number;
  endMinute: number;
  /** "09:00" — for display. */
  label: string;
  /** "09:00 – 09:15" — for summaries and notifications. */
  rangeLabel: string;
}

/**
 * Pure slot generator. Used by the availability endpoint, the admin schedule
 * preview and the nightly queue seeding job, so it must stay dependency-free
 * and deterministic.
 *
 * Trailing partial slots are dropped: a 09:00–09:50 window with 15-minute
 * slots yields 09:00, 09:15, 09:30 (not a 5-minute stub at 09:45).
 */
export function generateSlots(
  startMinute: number,
  endMinute: number,
  slotMinutes: number,
): SlotRange[] {
  if (!Number.isInteger(startMinute) || !Number.isInteger(endMinute)) {
    throw new Error("Schedule bounds must be whole minutes");
  }
  if (!Number.isInteger(slotMinutes) || slotMinutes < 1 || slotMinutes > 240) {
    throw new Error("slotMinutes must be an integer between 1 and 240");
  }
  if (endMinute <= startMinute) {
    throw new Error("endMinute must be greater than startMinute");
  }

  const slots: SlotRange[] = [];
  for (let start = startMinute; start + slotMinutes <= endMinute; start += slotMinutes) {
    const end = start + slotMinutes;
    slots.push({
      startMinute: start,
      endMinute: end,
      label: minutesToTime(start),
      rangeLabel: `${minutesToTime(start)} – ${minutesToTime(end)}`,
    });
  }
  return slots;
}

/**
 * Generates slots for a doctor's day, which may contain a morning and an
 * evening window. Overlapping windows are rejected rather than silently merged.
 */
export function generateSlotsForWindows(windows: readonly ScheduleWindow[]): SlotRange[] {
  const sorted = [...windows].sort((a, b) => a.startMinute - b.startMinute);
  const slots: SlotRange[] = [];

  let previousEnd = -1;
  for (const window of sorted) {
    if (window.startMinute < previousEnd) {
      throw new Error("Schedule windows overlap");
    }
    previousEnd = window.endMinute;
    for (const slot of generateSlots(window.startMinute, window.endMinute, window.slotMinutes)) {
      if (!slots.some((existing) => existing.startMinute === slot.startMinute)) {
        slots.push(slot);
      }
    }
  }

  return slots.sort((a, b) => a.startMinute - b.startMinute);
}

/** Total bookable slots for a day. */
export function countSlots(windows: readonly ScheduleWindow[]): number {
  return generateSlotsForWindows(windows).length;
}

import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TRANSITIONS,
  assertTransition,
  canCancel,
  canTransition,
  isTerminal,
  TransitionError,
} from "../src";

const ALLOWED: Array<[string, string]> = [
  ["BOOKED", "WAITING"],
  ["BOOKED", "CANCELLED"],
  ["BOOKED", "NO_SHOW"],
  ["WAITING", "NOTIFIED"],
  ["WAITING", "CALLED"],
  ["WAITING", "DELAYED"],
  ["WAITING", "CANCELLED"],
  ["WAITING", "NO_SHOW"],
  ["NOTIFIED", "CALLED"],
  ["NOTIFIED", "DELAYED"],
  ["NOTIFIED", "SKIPPED"],
  ["NOTIFIED", "CANCELLED"],
  ["CALLED", "IN_CONSULTATION"],
  ["CALLED", "DELAYED"],
  ["CALLED", "SKIPPED"],
  ["CALLED", "WAITING"],
  ["DELAYED", "CALLED"],
  ["DELAYED", "WAITING"],
  ["DELAYED", "SKIPPED"],
  ["DELAYED", "CANCELLED"],
  ["IN_CONSULTATION", "COMPLETED"],
  ["SKIPPED", "CALLED"],
];

describe("appointment state machine", () => {
  it.each(ALLOWED)("allows %s -> %s", (from, to) => {
    expect(canTransition(from as never, to as never)).toBe(true);
    expect(() => assertTransition(from as never, to as never)).not.toThrow();
  });

  it("rejects every transition that is not in the table", () => {
    const allowed = new Set(ALLOWED.map(([from, to]) => `${from}->${to}`));
    for (const from of APPOINTMENT_STATUSES) {
      for (const to of APPOINTMENT_STATUSES) {
        if (allowed.has(`${from}->${to}`)) continue;
        expect(canTransition(from, to)).toBe(false);
        expect(() => assertTransition(from, to)).toThrow(TransitionError);
      }
    }
  });

  it("rejects self transitions", () => {
    for (const status of APPOINTMENT_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("treats COMPLETED, CANCELLED, NO_SHOW as terminal", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("NO_SHOW")).toBe(true);
    expect(isTerminal("SKIPPED")).toBe(false);
    expect(isTerminal("IN_CONSULTATION")).toBe(false);
  });

  it("never allows a completed appointment to change", () => {
    expect(APPOINTMENT_TRANSITIONS.COMPLETED).toEqual([]);
    expect(APPOINTMENT_TRANSITIONS.CANCELLED).toEqual([]);
    expect(APPOINTMENT_TRANSITIONS.NO_SHOW).toEqual([]);
  });

  it("only allows cancellation before the patient is in the room", () => {
    expect(canCancel("BOOKED")).toBe(true);
    expect(canCancel("WAITING")).toBe(true);
    expect(canCancel("NOTIFIED")).toBe(true);
    expect(canCancel("DELAYED")).toBe(true);
    expect(canCancel("CALLED")).toBe(false);
    expect(canCancel("IN_CONSULTATION")).toBe(false);
    expect(canCancel("COMPLETED")).toBe(false);
  });
});

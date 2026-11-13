import { describe, expect, it } from "vitest";
import {
  addDaysToDayKey,
  dayOfWeek,
  endOfDayUtc,
  formatTimeOfDay,
  minutesToTime,
  startOfDayUtc,
  timeToMinutes,
  toDayKey,
  zonedDateTimeToUtc,
} from "../src";

const KOLKATA = "Asia/Kolkata";
const NEW_YORK = "America/New_York";

describe("minute <-> time", () => {
  it("round-trips", () => {
    for (const minutes of [0, 1, 59, 60, 570, 719, 1439]) {
      expect(timeToMinutes(minutesToTime(minutes))).toBe(minutes);
    }
  });

  it("rejects malformed times", () => {
    expect(() => timeToMinutes("24:00")).toThrow();
    expect(() => timeToMinutes("9")).toThrow();
    expect(() => timeToMinutes("09:75")).toThrow();
  });
});

describe("zonedDateTimeToUtc", () => {
  it("converts an IST wall clock to UTC", () => {
    // 09:00 IST == 03:30 UTC
    expect(zonedDateTimeToUtc("2026-11-13", 540, KOLKATA).toISOString()).toBe(
      "2026-11-13T03:30:00.000Z",
    );
  });

  it("handles the New York DST change in November", () => {
    // Before DST ends (Nov 1 2026, 02:00 local): 09:00 EDT == 13:00 UTC
    expect(zonedDateTimeToUtc("2026-10-30", 540, NEW_YORK).toISOString()).toBe(
      "2026-10-30T13:00:00.000Z",
    );
    // After DST ends: 09:00 EST == 14:00 UTC
    expect(zonedDateTimeToUtc("2026-11-13", 540, NEW_YORK).toISOString()).toBe(
      "2026-11-13T14:00:00.000Z",
    );
  });

  it("never drifts when round-tripped back to the local day and time", () => {
    const instant = zonedDateTimeToUtc("2026-03-08", 90, NEW_YORK);
    expect(toDayKey(instant, NEW_YORK)).toBe("2026-03-08");
    expect(formatTimeOfDay(instant, NEW_YORK)).toBe("01:30");
  });

  it("produces inclusive day boundaries that do not overlap", () => {
    const end = endOfDayUtc("2026-11-13", KOLKATA);
    const nextStart = startOfDayUtc("2026-11-14", KOLKATA);
    expect(end.getTime()).toBeLessThan(nextStart.getTime());
    expect(nextStart.getTime() - end.getTime()).toBe(1);
  });
});

describe("day key helpers", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDaysToDayKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDayKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("returns the ISO weekday", () => {
    expect(dayOfWeek("2026-11-13")).toBe(5); // Friday
    expect(dayOfWeek("2026-11-15")).toBe(0); // Sunday
  });
});

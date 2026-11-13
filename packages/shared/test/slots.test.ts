import { describe, expect, it } from "vitest";
import { countSlots, generateSlots, generateSlotsForWindows } from "../src";

describe("generateSlots", () => {
  it("generates contiguous slots for a normal window", () => {
    const slots = generateSlots(540, 720, 15);
    expect(slots).toHaveLength(12);
    expect(slots[0]).toMatchObject({ startMinute: 540, endMinute: 555, label: "09:00" });
    expect(slots.at(-1)).toMatchObject({ startMinute: 705, endMinute: 720, label: "11:45" });
  });

  it("drops a trailing partial slot", () => {
    const slots = generateSlots(540, 590, 15);
    expect(slots.map((slot) => slot.label)).toEqual(["09:00", "09:15", "09:30"]);
  });

  it("supports a single slot window", () => {
    expect(generateSlots(540, 555, 15)).toHaveLength(1);
  });

  it("returns nothing when the window is shorter than one slot", () => {
    expect(generateSlots(540, 545, 15)).toEqual([]);
  });

  it("rejects invalid windows", () => {
    expect(() => generateSlots(600, 540, 15)).toThrow();
    expect(() => generateSlots(540, 720, 0)).toThrow();
    expect(() => generateSlots(540, 720, 1.5)).toThrow();
    expect(() => generateSlots(540, 720, 500)).toThrow();
  });
});

describe("generateSlotsForWindows", () => {
  it("merges a morning and an evening clinic in order", () => {
    const slots = generateSlotsForWindows([
      { startMinute: 1020, endMinute: 1140, slotMinutes: 20 },
      { startMinute: 540, endMinute: 660, slotMinutes: 20 },
    ]);
    expect(slots.map((slot) => slot.label)).toEqual([
      "09:00",
      "09:20",
      "09:40",
      "10:00",
      "10:20",
      "10:40",
      "17:00",
      "17:20",
      "17:40",
      "18:00",
      "18:20",
      "18:40",
    ]);
    expect(countSlots([
      { startMinute: 1020, endMinute: 1140, slotMinutes: 20 },
      { startMinute: 540, endMinute: 660, slotMinutes: 20 },
    ])).toBe(12);
  });

  it("rejects overlapping windows", () => {
    expect(() =>
      generateSlotsForWindows([
        { startMinute: 540, endMinute: 660, slotMinutes: 15 },
        { startMinute: 600, endMinute: 720, slotMinutes: 15 },
      ]),
    ).toThrow(/overlap/i);
  });
});

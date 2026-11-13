/**
 * Timezone-correct helpers for turning "13 Nov 2026 at 09:30 in Asia/Kolkata"
 * into a UTC `Date`. The server is the only clock that matters; clients never
 * send pre-computed UTC instants for bookings.
 */

const DAY_MS = 86_400_000;

export const MINUTES_PER_DAY = 24 * 60;

/** "09:30" | "9:30" -> 570. Throws on malformed input. */
export function timeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) throw new Error(`Invalid time "${time}", expected HH:mm`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Invalid time "${time}"`);
  return hours * 60 + minutes;
}

/** 570 -> "09:30". */
export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** ISO weekday index used by the DB: Sunday = 0 ... Saturday = 6. */
export function dayOfWeek(dayKey: string): number {
  const [year, month, day] = parseDayKey(dayKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function parseDayKey(dayKey: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) throw new Error(`Invalid day key "${dayKey}", expected YYYY-MM-DD`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function toDayKey(date: Date, timeZone: string): string {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function addDaysToDayKey(dayKey: string, days: number): string {
  const [year, month, day] = parseDayKey(dayKey);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Milliseconds that `timeZone` is ahead of UTC at the given instant. */
export function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Converts a local wall-clock time in `timeZone` to a UTC `Date`.
 * Resolves the offset twice so it is correct across DST boundaries.
 */
export function zonedDateTimeToUtc(dayKey: string, minutes: number, timeZone: string): Date {
  const [year, month, day] = parseDayKey(dayKey);
  const naiveUtc = Date.UTC(year, month - 1, day, 0, minutes, 0, 0);
  const firstGuess = naiveUtc - timeZoneOffsetMs(new Date(naiveUtc), timeZone);
  const corrected = naiveUtc - timeZoneOffsetMs(new Date(firstGuess), timeZone);
  return new Date(corrected);
}

export function startOfDayUtc(dayKey: string, timeZone: string): Date {
  return zonedDateTimeToUtc(dayKey, 0, timeZone);
}

export function endOfDayUtc(dayKey: string, timeZone: string): Date {
  return new Date(startOfDayUtc(dayKey, timeZone).getTime() + DAY_MS - 1);
}

/** "Friday, 13 November 2026" style label for notifications and emails. */
export function formatDayKey(
  dayKey: string,
  timeZone: string,
  locale = "en-IN",
  options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" },
): string {
  const [year, month, day] = parseDayKey(dayKey);
  // Noon avoids any chance of the date shifting across a zone boundary.
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(
    new Date(Date.UTC(year, month - 1, day, 12)),
  );
}

/** "09:30" in the hospital's timezone, for a stored UTC instant. */
export function formatTimeOfDay(date: Date, timeZone: string, locale = "en-IN"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  // Intl returns hour "24" for midnight in some runtimes.
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

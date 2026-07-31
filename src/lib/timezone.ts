/**
 * The whole company operates on Thailand time, and staff/managers always
 * expect check-in times, "today", and pay periods to line up with the
 * Bangkok wall clock — regardless of what timezone the server happens to
 * run in.
 *
 * This matters because Vercel's serverless functions always run in UTC
 * (this can't be changed), so any code that used the JS runtime's "local"
 * time (e.g. `date.getHours()`, `date.setHours(0,0,0,0)`, or
 * `new Date(year, month, day)`) would silently compute UTC time in
 * production while looking correct in local dev on a machine already set
 * to Thailand time. Anything time-of-day or calendar-day sensitive should
 * go through the helpers below instead.
 *
 * Thailand has a fixed UTC+7 offset with no daylight saving time, so a
 * static offset is safe here without needing a full timezone database.
 */
export const APP_TIMEZONE = "Asia/Bangkok";
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface DateParts {
  year: number;
  month: number; // 1-indexed
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Reads the Bangkok wall-clock components of a given instant. */
export function getBangkokParts(d: Date): DateParts {
  const shifted = new Date(d.getTime() + BANGKOK_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

/** Builds the UTC instant corresponding to the given Bangkok wall-clock time. */
export function bangkokDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms) - BANGKOK_OFFSET_MS);
}

/** Midnight (00:00:00.000) Bangkok time on the calendar day containing `d`. */
export function startOfBangkokDay(d: Date): Date {
  const { year, month, day } = getBangkokParts(d);
  return bangkokDate(year, month, day, 0, 0, 0, 0);
}

/** The last millisecond (23:59:59.999) Bangkok time on the calendar day containing `d`. */
export function endOfBangkokDay(d: Date): Date {
  const { year, month, day } = getBangkokParts(d);
  return bangkokDate(year, month, day, 23, 59, 59, 999);
}

/**
 * Parses a naive "YYYY-MM-DDTHH:mm" string (exactly what `<input
 * type="datetime-local">` submits, with no timezone info attached) as a
 * Bangkok wall-clock time and returns the correct UTC instant as an ISO
 * string. Without this, sending the raw string straight to a `timestamptz`
 * column lets Postgres interpret it as UTC (its default session timezone),
 * silently shifting a manager-approved correction time by 7 hours.
 */
export function parseBangkokLocalDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  return bangkokDate(year, month, day, hour, minute).toISOString();
}

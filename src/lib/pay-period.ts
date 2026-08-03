import { bangkokDate, endOfBangkokDay, getBangkokParts, startOfBangkokDay } from "@/lib/timezone";

export type PayPeriodType = "monthly" | "fortnight";

/** First day of a fortnightly pay cycle (adjust in Supabase/settings later if needed) */
const FORTNIGHT_ANCHOR = bangkokDate(2024, 1, 1); // 1 Jan 2024, Bangkok time

export interface PayPeriod {
  type: PayPeriodType;
  start: Date;
  end: Date;
  label: string;
  /** Compact English-only label for tight spaces like a `<select>`. */
  shortLabel: string;
  key: string;
}

// Day boundaries below are all anchored to the Bangkok calendar day, not
// the server's own clock (see src/lib/timezone.ts).
const startOfDay = startOfBangkokDay;
const endOfDay = endOfBangkokDay;

function formatPeriodLabel(start: Date, end: Date): string {
  const en = (d: Date) =>
    d.toLocaleDateString("en-AU", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const thai = (d: Date) =>
    d.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "long",
      year: "numeric",
      calendar: "gregory",
    });
  return `${en(start)} – ${en(end)} / ${thai(start)} – ${thai(end)}`;
}

/** Short "27 Jul – 9 Aug 2026" style label — year shown once, English only. */
function formatShortPeriodLabel(start: Date, end: Date): string {
  const startParts = getBangkokParts(start);
  const endParts = getBangkokParts(end);
  const sameYear = startParts.year === endParts.year;
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("en-AU", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: withYear ? "numeric" : undefined,
    });
  return `${fmt(start, !sameYear)} – ${fmt(end, true)}`;
}

export function getMonthlyPeriod(year: number, month: number): PayPeriod {
  const start = bangkokDate(year, month, 1);
  // `bangkokDate(year, month + 1, 0)` is "day 0 of next month", i.e. the
  // last day of `month` (Date.UTC normalizes the day-0 rollback for us).
  const end = endOfBangkokDay(bangkokDate(year, month + 1, 0));
  return {
    type: "monthly",
    start,
    end,
    label:
      start.toLocaleDateString("en-AU", {
        timeZone: "Asia/Bangkok",
        month: "long",
        year: "numeric",
      }) +
      " / " +
      start.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        month: "long",
        year: "numeric",
        calendar: "gregory",
      }),
    shortLabel: start.toLocaleDateString("en-AU", {
      timeZone: "Asia/Bangkok",
      month: "long",
      year: "numeric",
    }),
    key: `${year}-${String(month).padStart(2, "0")}`,
  };
}

export function getFortnightContaining(date: Date): PayPeriod {
  const anchor = startOfDay(FORTNIGHT_ANCHOR);
  const target = startOfDay(date);
  const msPerFortnight = 14 * 24 * 60 * 60 * 1000;
  const index = Math.floor((target.getTime() - anchor.getTime()) / msPerFortnight);
  const start = new Date(anchor.getTime() + index * msPerFortnight);
  const end = endOfDay(new Date(start.getTime() + 13 * 24 * 60 * 60 * 1000));
  const { year, month, day } = getBangkokParts(start);
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    type: "fortnight",
    start,
    end,
    label: formatPeriodLabel(start, end),
    shortLabel: formatShortPeriodLabel(start, end),
    key,
  };
}

export function getFortnightByStart(startStr: string): PayPeriod {
  const [y, m, d] = startStr.split("-").map(Number);
  const start = bangkokDate(y, m, d);
  const end = endOfDay(new Date(start.getTime() + 13 * 24 * 60 * 60 * 1000));
  return {
    type: "fortnight",
    start,
    end,
    label: formatPeriodLabel(start, end),
    shortLabel: formatShortPeriodLabel(start, end),
    key: startStr,
  };
}

export function listRecentFortnights(count = 8): PayPeriod[] {
  const current = getFortnightContaining(new Date());
  const msPerFortnight = 14 * 24 * 60 * 60 * 1000;
  const periods: PayPeriod[] = [];

  for (let i = 0; i < count; i++) {
    const start = new Date(current.start.getTime() - i * msPerFortnight);
    const end = endOfDay(new Date(start.getTime() + 13 * 24 * 60 * 60 * 1000));
    const { year, month, day } = getBangkokParts(start);
    periods.push({
      type: "fortnight",
      start,
      end,
      label: formatPeriodLabel(start, end),
      shortLabel: formatShortPeriodLabel(start, end),
      key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
  }

  return periods;
}

export function resolvePayPeriod(
  type: PayPeriodType,
  params: { month?: string; start?: string }
): PayPeriod {
  const now = new Date();

  if (type === "fortnight") {
    if (params.start) return getFortnightByStart(params.start);
    return getFortnightContaining(now);
  }

  const nowParts = getBangkokParts(now);
  const [year, month] = (params.month ?? `${nowParts.year}-${nowParts.month}`)
    .split("-")
    .map(Number);
  return getMonthlyPeriod(year, month);
}

/** Legacy fallback only: hours beyond this per shift counted as OT before staff-declared split existed. */
const LEGACY_OVERTIME_THRESHOLD_HOURS = 8;

export interface PayrollSummaryRow {
  id: string;
  name: string;
  department: string | null;
  employmentType: "full_time" | "part_time" | null;
  daysWorked: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  pendingOvertimeHours: number;
  incompleteShifts: number;
}

export interface AttendanceForPayroll {
  id: string;
  staff_id: string;
  check_in_at: string;
  check_out_at: string | null;
  normal_hours?: number | null;
  overtime_hours?: number | null;
  overtime_status?: string | null;
  profiles?: {
    full_name: string;
    department: string | null;
    employment_type?: "full_time" | "part_time" | null;
  };
}

export interface ShiftHourSplit {
  total: number;
  /** Hours that count as normal/regular for payroll. */
  normal: number;
  /** Approved OT hours only (payable as OT). */
  overtime: number;
  /** Staff-claimed OT still waiting for manager approval. */
  pendingOvertime: number;
  /** Raw OT hours the staff member declared (any status). */
  declaredOvertime: number;
  overtimeStatus: "none" | "pending" | "approved" | "rejected";
}

/**
 * Prefer staff-declared Normal/OT. For payroll, only *approved* OT counts as
 * overtime — pending claims are held aside, and rejected OT is paid as normal.
 */
export function getShiftHourSplit(record: {
  check_in_at: string;
  check_out_at: string | null;
  normal_hours?: number | null;
  overtime_hours?: number | null;
  overtime_status?: string | null;
}): ShiftHourSplit | null {
  if (!record.check_out_at) return null;

  const total = Math.max(
    0,
    (new Date(record.check_out_at).getTime() - new Date(record.check_in_at).getTime()) /
      3600000
  );

  if (record.normal_hours != null && record.overtime_hours != null) {
    const declaredNormal = Number(record.normal_hours);
    const declaredOt = Number(record.overtime_hours);
    const status = (record.overtime_status ??
      (declaredOt > 0 ? "pending" : "none")) as ShiftHourSplit["overtimeStatus"];

    if (status === "approved") {
      return {
        total,
        normal: declaredNormal,
        overtime: declaredOt,
        pendingOvertime: 0,
        declaredOvertime: declaredOt,
        overtimeStatus: status,
      };
    }

    if (status === "pending") {
      return {
        total,
        normal: declaredNormal,
        overtime: 0,
        pendingOvertime: declaredOt,
        declaredOvertime: declaredOt,
        overtimeStatus: status,
      };
    }

    if (status === "rejected") {
      // Time was still worked — pay it as normal, just not as OT.
      return {
        total,
        normal: declaredNormal + declaredOt,
        overtime: 0,
        pendingOvertime: 0,
        declaredOvertime: declaredOt,
        overtimeStatus: status,
      };
    }

    return {
      total,
      normal: declaredNormal,
      overtime: 0,
      pendingOvertime: 0,
      declaredOvertime: declaredOt,
      overtimeStatus: "none",
    };
  }

  // Legacy records: keep the old auto 8-hour split so existing payroll isn't wiped.
  const legacyOt = Math.max(0, total - LEGACY_OVERTIME_THRESHOLD_HOURS);
  return {
    total,
    normal: Math.min(total, LEGACY_OVERTIME_THRESHOLD_HOURS),
    overtime: legacyOt,
    pendingOvertime: 0,
    declaredOvertime: legacyOt,
    overtimeStatus: legacyOt > 0 ? "approved" : "none",
  };
}

export function buildPayrollSummary(
  records: AttendanceForPayroll[],
  unknownLabel: string
): PayrollSummaryRow[] {
  const byStaff = new Map<string, PayrollSummaryRow>();
  // Unique Bangkok calendar days with at least one completed shift.
  // Morning + afternoon check-in/out on the same day still count as 1 day
  // (full-time are paid by day). Casual pay still uses summed hours below.
  const daysByStaff = new Map<string, Set<string>>();

  for (const record of records) {
    const name = record.profiles?.full_name ?? unknownLabel;
    const department = record.profiles?.department ?? null;
    const employmentType = record.profiles?.employment_type ?? null;
    const row =
      byStaff.get(record.staff_id) ?? {
        id: record.staff_id,
        name,
        department,
        employmentType,
        daysWorked: 0,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        pendingOvertimeHours: 0,
        incompleteShifts: 0,
      };

    if (!record.check_out_at) {
      row.incompleteShifts += 1;
      byStaff.set(record.staff_id, row);
      continue;
    }

    const split = getShiftHourSplit(record)!;
    const { year, month, day } = getBangkokParts(new Date(record.check_in_at));
    const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const days = daysByStaff.get(record.staff_id) ?? new Set<string>();
    days.add(dayKey);
    daysByStaff.set(record.staff_id, days);

    row.daysWorked = days.size;
    row.totalHours += split.total;
    row.regularHours += split.normal;
    row.overtimeHours += split.overtime;
    row.pendingOvertimeHours += split.pendingOvertime;
    byStaff.set(record.staff_id, row);
  }

  return Array.from(byStaff.values()).sort((a, b) => b.totalHours - a.totalHours);
}

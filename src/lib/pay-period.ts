import { bangkokDate, endOfBangkokDay, getBangkokParts, startOfBangkokDay } from "@/lib/timezone";

export type PayPeriodType = "monthly" | "fortnight";

/** First day of a fortnightly pay cycle (adjust in Supabase/settings later if needed) */
const FORTNIGHT_ANCHOR = bangkokDate(2024, 1, 1); // 1 Jan 2024, Bangkok time

export interface PayPeriod {
  type: PayPeriodType;
  start: Date;
  end: Date;
  label: string;
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

/** Hours beyond this threshold per shift count as overtime. */
const OVERTIME_THRESHOLD_HOURS = 8;

export interface PayrollSummaryRow {
  id: string;
  name: string;
  department: string | null;
  employmentType: "full_time" | "part_time" | null;
  daysWorked: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  incompleteShifts: number;
}

export interface AttendanceForPayroll {
  id: string;
  staff_id: string;
  check_in_at: string;
  check_out_at: string | null;
  profiles?: {
    full_name: string;
    department: string | null;
    employment_type?: "full_time" | "part_time" | null;
  };
}

export function buildPayrollSummary(
  records: AttendanceForPayroll[],
  unknownLabel: string
): PayrollSummaryRow[] {
  const byStaff = new Map<string, PayrollSummaryRow>();

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
        incompleteShifts: 0,
      };

    if (!record.check_out_at) {
      row.incompleteShifts += 1;
      byStaff.set(record.staff_id, row);
      continue;
    }

    const hours = Math.max(
      0,
      (new Date(record.check_out_at).getTime() - new Date(record.check_in_at).getTime()) /
        3600000
    );
    row.daysWorked += 1;
    row.totalHours += hours;
    row.regularHours += Math.min(hours, OVERTIME_THRESHOLD_HOURS);
    row.overtimeHours += Math.max(0, hours - OVERTIME_THRESHOLD_HOURS);
    byStaff.set(record.staff_id, row);
  }

  return Array.from(byStaff.values()).sort((a, b) => b.totalHours - a.totalHours);
}

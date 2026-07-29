export type PayPeriodType = "monthly" | "fortnight";

/** First day of a fortnightly pay cycle (adjust in Supabase/settings later if needed) */
const FORTNIGHT_ANCHOR = new Date(2024, 0, 1); // 1 Jan 2024

export interface PayPeriod {
  type: PayPeriodType;
  start: Date;
  end: Date;
  label: string;
  key: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatPeriodLabel(start: Date, end: Date): string {
  const en = (d: Date) =>
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const thai = (d: Date) =>
    d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  return `${en(start)} – ${en(end)} / ${thai(start)} – ${thai(end)}`;
}

export function getMonthlyPeriod(year: number, month: number): PayPeriod {
  const start = startOfDay(new Date(year, month - 1, 1));
  const end = endOfDay(new Date(year, month, 0));
  return {
    type: "monthly",
    start,
    end,
    label: start.toLocaleDateString("en-AU", { month: "long", year: "numeric" }) +
      " / " +
      start.toLocaleDateString("th-TH", { month: "long", year: "numeric" }),
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
  const key = start.toISOString().slice(0, 10);
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
  const start = startOfDay(new Date(y, m - 1, d));
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
    periods.push({
      type: "fortnight",
      start,
      end,
      label: formatPeriodLabel(start, end),
      key: start.toISOString().slice(0, 10),
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

  const [year, month] = (params.month ?? `${now.getFullYear()}-${now.getMonth() + 1}`)
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
  profiles?: { full_name: string; department: string | null };
}

export function buildPayrollSummary(
  records: AttendanceForPayroll[],
  unknownLabel: string
): PayrollSummaryRow[] {
  const byStaff = new Map<string, PayrollSummaryRow>();

  for (const record of records) {
    const name = record.profiles?.full_name ?? unknownLabel;
    const department = record.profiles?.department ?? null;
    const row =
      byStaff.get(record.staff_id) ?? {
        id: record.staff_id,
        name,
        department,
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

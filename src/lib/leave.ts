import type { LeaveRequest, LeaveType } from "@/types/database";

/** Annual entitlement per staff member, per calendar year, at full-time hours. */
export const LEAVE_ENTITLEMENT: Record<LeaveType, number> = {
  sick: 30,
  annual: 7,
};

/** Weekly hours a staff member must work to receive the full entitlement above. */
export const FULL_TIME_WEEKLY_HOURS = 48;

export interface LeaveBalance {
  type: LeaveType;
  entitlement: number;
  used: number;
  remaining: number;
}

/**
 * Sums approved leave days taken within the given calendar year, per type,
 * and returns the remaining balance against each type's annual entitlement.
 * Part-time staff (weeklyHours below the full-time standard) get a
 * proportional entitlement, e.g. someone working half the hours gets half
 * the sick/annual days.
 */
export function calculateLeaveBalances(
  requests: Pick<LeaveRequest, "leave_type" | "start_date" | "days" | "status">[],
  weeklyHours: number = FULL_TIME_WEEKLY_HOURS,
  year: number = new Date().getFullYear()
): LeaveBalance[] {
  const used: Record<LeaveType, number> = { sick: 0, annual: 0 };

  for (const req of requests) {
    if (req.status !== "approved") continue;
    if (new Date(req.start_date).getFullYear() !== year) continue;
    used[req.leave_type] += req.days;
  }

  const ratio = Math.max(
    0,
    Math.min(1, (weeklyHours || FULL_TIME_WEEKLY_HOURS) / FULL_TIME_WEEKLY_HOURS)
  );

  return (Object.keys(LEAVE_ENTITLEMENT) as LeaveType[]).map((type) => {
    const entitlement = Math.round(LEAVE_ENTITLEMENT[type] * ratio * 2) / 2;
    const usedDays = used[type];
    return {
      type,
      entitlement,
      used: usedDays,
      remaining: Math.max(0, entitlement - usedDays),
    };
  });
}

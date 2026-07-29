import type { LeaveRequest, LeaveType } from "@/types/database";

/** Annual entitlement per staff member, per calendar year. */
export const LEAVE_ENTITLEMENT: Record<LeaveType, number> = {
  sick: 30,
  annual: 7,
};

export interface LeaveBalance {
  type: LeaveType;
  entitlement: number;
  used: number;
  remaining: number;
}

/**
 * Sums approved leave days taken within the given calendar year, per type,
 * and returns the remaining balance against each type's annual entitlement.
 */
export function calculateLeaveBalances(
  requests: Pick<LeaveRequest, "leave_type" | "start_date" | "days" | "status">[],
  year: number = new Date().getFullYear()
): LeaveBalance[] {
  const used: Record<LeaveType, number> = { sick: 0, annual: 0 };

  for (const req of requests) {
    if (req.status !== "approved") continue;
    if (new Date(req.start_date).getFullYear() !== year) continue;
    used[req.leave_type] += req.days;
  }

  return (Object.keys(LEAVE_ENTITLEMENT) as LeaveType[]).map((type) => {
    const entitlement = LEAVE_ENTITLEMENT[type];
    const usedDays = used[type];
    return {
      type,
      entitlement,
      used: usedDays,
      remaining: Math.max(0, entitlement - usedDays),
    };
  });
}

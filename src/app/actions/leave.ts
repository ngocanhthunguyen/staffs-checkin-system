"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { th } from "@/lib/i18n";
import { calculateLeaveBalances } from "@/lib/leave";
import type { LeaveType } from "@/types/database";

export async function requestLeave(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  const leaveType = formData.get("leave_type") as LeaveType;
  const startDate = formData.get("start_date") as string;
  const days = Number(formData.get("days"));
  const reason = (formData.get("reason") as string)?.trim() || null;

  if (!leaveType || !startDate) return { error: th.attendanceReasonRequired };
  if (!Number.isFinite(days) || days <= 0) return { error: th.invalidLeaveDays };

  const { data: requester } = await supabase
    .from("profiles")
    .select("weekly_hours, employment_type")
    .eq("id", user.id)
    .single();

  // Casual staff don't have a finalized leave entitlement yet, so their
  // requests always go through for admin to review case-by-case instead of
  // being auto-blocked against a balance we haven't agreed on.
  const isCasual = requester?.employment_type === "part_time";

  if (!isCasual) {
    const year = new Date(startDate).getFullYear();
    const { data: existing } = await supabase
      .from("leave_requests")
      .select("leave_type, start_date, days, status")
      .eq("staff_id", user.id);

    const balances = calculateLeaveBalances(existing ?? [], requester?.weekly_hours, year);
    const balance = balances.find((b) => b.type === leaveType);

    if (balance && days > balance.remaining) {
      return { error: th.notEnoughLeaveBalance };
    }
  }

  const { error } = await supabase.from("leave_requests").insert({
    staff_id: user.id,
    leave_type: leaveType,
    start_date: startDate,
    days,
    reason,
  });

  if (error) return { error: error.message };

  revalidatePath("/leave");
  return { success: true };
}

export async function reviewLeaveRequest(
  requestId: string,
  status: "approved" | "rejected",
  reviewNotes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return { error: th.unauthorized };
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes ?? null,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/leave");
  return { success: true };
}

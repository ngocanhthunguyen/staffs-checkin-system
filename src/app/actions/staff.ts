"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { th } from "@/lib/i18n";
import type { EmploymentType } from "@/types/database";

export async function updateStaffEmployment(
  staffId: string,
  employmentType: EmploymentType,
  weeklyHours: number
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

  if (employmentType !== "full_time" && employmentType !== "part_time") {
    return { error: th.invalidWeeklyHours };
  }

  if (!Number.isFinite(weeklyHours) || weeklyHours <= 0 || weeklyHours > 80) {
    return { error: th.invalidWeeklyHours };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ employment_type: employmentType, weekly_hours: weeklyHours })
    .eq("id", staffId);

  if (error) return { error: error.message };

  revalidatePath(`/team/${staffId}`);
  revalidatePath("/team");
  revalidatePath("/leave");
  return { success: true };
}

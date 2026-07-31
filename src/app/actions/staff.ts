"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { th } from "@/lib/i18n";
import type { EmploymentType, UserRole } from "@/types/database";

const VALID_ROLES: UserRole[] = ["staff", "manager", "admin"];

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

/**
 * Promotes/demotes a teammate's role. Restricted to admins only (not managers)
 * so a manager can't grant themselves or a peer admin access. This must go
 * through the user's own authenticated session — direct edits via the
 * Supabase Table Editor/SQL editor are blocked by the
 * `profiles_prevent_escalation` trigger, which can't tell a legitimate admin
 * apart from anyone else poking the table outside the app.
 */
export async function updateStaffRole(staffId: string, role: UserRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  if (staffId === user.id) return { error: th.cannotChangeOwnRole };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: th.unauthorized };
  }

  if (!VALID_ROLES.includes(role)) {
    return { error: th.unauthorized };
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", staffId);

  if (error) return { error: error.message };

  revalidatePath(`/team/${staffId}`);
  revalidatePath("/team");
  return { success: true };
}

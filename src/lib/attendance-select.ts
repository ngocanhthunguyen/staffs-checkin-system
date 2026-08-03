import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffProfileEmbed = {
  full_name: string;
  department: string | null;
  role?: string;
  employment_type?: string | null;
};

/**
 * After migration 010 added `overtime_reviewed_by → profiles`, PostgREST sees
 * two FKs from attendance → profiles and rejects embeds like `profiles(...)`.
 * Load attendance with `select("*")` (no embed), then attach staff this way.
 */
export async function attachStaffProfiles<T extends { staff_id: string }>(
  supabase: SupabaseClient,
  rows: T[] | null | undefined
): Promise<(T & { profiles: StaffProfileEmbed | null })[]> {
  if (!rows?.length) return [];

  const staffIds = [...new Set(rows.map((r) => r.staff_id))];
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, department, role, employment_type")
    .in("id", staffIds);

  if (error) {
    console.error("Failed to load staff profiles for attendance:", error.message);
  }

  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        full_name: p.full_name as string,
        department: (p.department as string | null) ?? null,
        role: p.role as string | undefined,
        employment_type: (p.employment_type as string | null) ?? null,
      },
    ])
  );

  return rows.map((row) => ({
    ...row,
    profiles: byId.get(row.staff_id) ?? null,
  }));
}

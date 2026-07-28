import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CheckInPanel } from "@/components/check-in-panel";
import type { Attendance, Profile, Site } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  let site: Site | null = null;
  if (profile.site_id) {
    const { data } = await supabase.from("sites").select("*").eq("id", profile.site_id).single();
    site = data;
  }

  const { data: openAttendance } = await supabase
    .from("attendance")
    .select("*")
    .eq("staff_id", user.id)
    .is("check_out_at", null)
    .maybeSingle();

  return (
    <AppShell profile={profile as Profile}>
      <CheckInPanel openAttendance={openAttendance as Attendance | null} site={site} />
    </AppShell>
  );
}

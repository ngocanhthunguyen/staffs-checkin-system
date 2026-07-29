import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { roleLabel, th } from "@/lib/i18n";
import type { Profile } from "@/types/database";

export default async function TeamPage() {
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

  if (!profile || !["manager", "admin"].includes(profile.role)) {
    redirect("/");
  }

  const { data: staff } = await supabase
    .from("profiles")
    .select("*, sites(name)")
    .order("full_name");

  const roleColors: Record<string, string> = {
    staff: "bg-slate-100 text-slate-700",
    manager: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
  };

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">{th.teamTitle}</h1>
          <p className="text-sm text-slate-500">
            {staff?.length ?? 0} {th.members}
          </p>
        </div>

        <div className="space-y-2">
          {(staff ?? []).map((member) => (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30"
            >
              <div>
                <p className="font-medium">{member.full_name}</p>
                <p className="text-xs text-slate-500">
                  {member.email}
                  {member.department && ` · ${member.department}`}
                </p>
                {(member.sites as { name: string } | null)?.name ? (
                  <p className="text-xs text-slate-400">
                    {(member.sites as { name: string }).name}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-amber-600">{th.noSiteWarning}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[member.role]}`}
                  >
                    {roleLabel(member.role)}
                  </span>
                  {!member.is_active && (
                    <span className="text-xs text-red-500">{th.inactive}</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p className="font-medium">{th.promoteManager}</p>
          <p className="mt-1 text-blue-700">{th.promoteManagerHint}</p>
        </div>
      </div>
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatTime, getHoursBetween } from "@/lib/utils";
import { th } from "@/lib/i18n";
import type { Attendance, Profile } from "@/types/database";
import { Users, UserCheck, UserX } from "lucide-react";

export default async function DashboardPage() {
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: allStaff } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("*, profiles(full_name, department)")
    .gte("check_in_at", todayStart.toISOString())
    .order("check_in_at", { ascending: false });

  const checkedIn = (todayAttendance ?? []).filter((a) => !a.check_out_at);
  const checkedOut = (todayAttendance ?? []).filter((a) => a.check_out_at);
  const staffIdsToday = new Set((todayAttendance ?? []).map((a) => a.staff_id));
  const notCheckedIn = (allStaff ?? []).filter((s) => !staffIdsToday.has(s.id));

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">{th.todayDashboard}</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("th-TH", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={UserCheck} label={th.checkedInCount} value={checkedIn.length} color="green" />
          <StatCard icon={UserX} label={th.checkedOutCount} value={checkedOut.length} color="slate" />
          <StatCard icon={Users} label={th.notInYet} value={notCheckedIn.length} color="amber" />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.currentlyIn} ({checkedIn.length})
          </h2>
          <div className="space-y-2">
            {checkedIn.length === 0 ? (
              <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                {th.noOneCheckedIn}
              </p>
            ) : (
              checkedIn.map((record) => (
                <StaffRow key={record.id} record={record as Attendance} status="in" />
              ))
            )}
          </div>
        </section>

        {notCheckedIn.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {th.notCheckedInList} ({notCheckedIn.length})
            </h2>
            <div className="space-y-2">
              {notCheckedIn.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{staff.full_name}</p>
                    {staff.department && (
                      <p className="text-xs text-slate-500">{staff.department}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    {th.absent}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "green" | "slate" | "amber";
}) {
  const colors = {
    green: "bg-green-50 text-green-700",
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <Icon className="mb-1 h-4 w-4" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function StaffRow({
  record,
  status,
}: {
  record: Attendance & { profiles?: { full_name: string; department: string | null } };
  status: "in" | "out";
}) {
  const hours = getHoursBetween(record.check_in_at, record.check_out_at);

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="font-medium">{record.profiles?.full_name ?? th.unknown}</p>
        <p className="text-xs text-slate-500">
          {th.inTime} {formatTime(record.check_in_at)}
          {record.check_out_at && ` · ${th.outTime} ${formatTime(record.check_out_at)}`}
          {" · "}
          {hours.toFixed(1)} {th.hours}
        </p>
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status === "in"
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {status === "in" ? th.checkIn : th.checkOut}
      </span>
    </div>
  );
}

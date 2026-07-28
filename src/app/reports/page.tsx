import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatDate, formatTime, getHoursBetween } from "@/lib/utils";
import { th } from "@/lib/i18n";
import type { Attendance, Profile } from "@/types/database";
import { ReportsExport } from "@/components/reports-export";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
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

  const params = await searchParams;
  const now = new Date();
  const [year, month] = (params.month ?? `${now.getFullYear()}-${now.getMonth() + 1}`)
    .split("-")
    .map(Number);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const { data: records } = await supabase
    .from("attendance")
    .select("*, profiles(full_name, department)")
    .gte("check_in_at", startDate.toISOString())
    .lte("check_in_at", endDate.toISOString())
    .order("check_in_at", { ascending: true });

  const summary = new Map<
    string,
    { name: string; department: string | null; days: number; hours: number }
  >();

  for (const record of records ?? []) {
    const staffId = record.staff_id;
    const name = record.profiles?.full_name ?? th.unknown;
    const department = record.profiles?.department ?? null;
    const hours = getHoursBetween(record.check_in_at, record.check_out_at);

    const existing = summary.get(staffId) ?? { name, department, days: 0, hours: 0 };
    existing.days += 1;
    existing.hours += hours;
    summary.set(staffId, existing);
  }

  const monthLabel = startDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{th.monthlyReport}</h1>
            <p className="text-sm text-slate-500">{monthLabel}</p>
          </div>
          <ReportsExport
            month={params.month ?? `${now.getFullYear()}-${now.getMonth() + 1}`}
            summary={Array.from(summary.entries()).map(([id, data]) => ({
              id,
              ...data,
            }))}
            records={(records ?? []) as Attendance[]}
          />
        </div>

        <form className="flex gap-2">
          <input
            type="month"
            name="month"
            defaultValue={params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`}
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {th.go}
          </button>
        </form>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.summaryByStaff}
          </h2>
          <div className="space-y-2">
            {summary.size === 0 ? (
              <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                {th.noRecordsThisMonth}
              </p>
            ) : (
              Array.from(summary.entries())
                .sort((a, b) => b[1].hours - a[1].hours)
                .map(([id, data]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{data.name}</p>
                      {data.department && (
                        <p className="text-xs text-slate-500">{data.department}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        {data.hours.toFixed(1)} {th.hours}
                      </p>
                      <p className="text-xs text-slate-500">
                        {data.days} {th.days}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.allRecords}
          </h2>
          <div className="space-y-2">
            {(records ?? []).map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex justify-between">
                  <p className="font-medium">{record.profiles?.full_name}</p>
                  <p className="text-slate-500">{formatDate(record.check_in_at)}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {formatTime(record.check_in_at)} →{" "}
                  {record.check_out_at ? formatTime(record.check_out_at) : th.stillIn} ·{" "}
                  {getHoursBetween(record.check_in_at, record.check_out_at).toFixed(1)} {th.hours}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

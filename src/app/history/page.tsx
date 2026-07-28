import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatDate, formatTime, getHoursBetween } from "@/lib/utils";
import { th } from "@/lib/i18n";
import { getFortnightContaining } from "@/lib/pay-period";
import type { Profile } from "@/types/database";

export default async function HistoryPage() {
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

  const payPeriod = getFortnightContaining(new Date());

  const { data: periodRecords } = await supabase
    .from("attendance")
    .select("*")
    .eq("staff_id", user.id)
    .gte("check_in_at", payPeriod.start.toISOString())
    .lte("check_in_at", payPeriod.end.toISOString())
    .order("check_in_at", { ascending: false });

  const payableHours = (periodRecords ?? []).reduce((sum, r) => {
    if (!r.check_out_at) return sum;
    return sum + getHoursBetween(r.check_in_at, r.check_out_at);
  }, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: records } = await supabase
    .from("attendance")
    .select("*")
    .eq("staff_id", user.id)
    .gte("check_in_at", thirtyDaysAgo.toISOString())
    .order("check_in_at", { ascending: false });

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">{th.myHistory}</h1>
          <p className="text-sm text-slate-500">{th.last30Days}</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-700">{th.myPayPeriodHours}</p>
          <p className="text-sm text-blue-600">{payPeriod.label}</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {payableHours.toFixed(1)} {th.hours}
          </p>
        </div>

        <div className="space-y-2">
          {(records ?? []).length === 0 ? (
            <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
              {th.noRecords}
            </p>
          ) : (
            (records ?? []).map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{formatDate(record.check_in_at)}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      record.check_out_at
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {record.check_out_at ? th.complete : th.open}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {formatTime(record.check_in_at)} →{" "}
                  {record.check_out_at ? formatTime(record.check_out_at) : "—"} ·{" "}
                  {record.check_out_at
                    ? `${getHoursBetween(record.check_in_at, record.check_out_at).toFixed(1)} ${th.hours}`
                    : th.incompleteShifts}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

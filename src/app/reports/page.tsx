import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PayPeriodFilter } from "@/components/pay-period-filter";
import {
  buildPayrollSummary,
  getFortnightContaining,
  getShiftHourSplit,
  listRecentFortnights,
  resolvePayPeriod,
  type PayPeriodType,
} from "@/lib/pay-period";
import { formatDate, formatTime } from "@/lib/utils";
import { employmentLabel, th } from "@/lib/i18n";
import type { Attendance, Profile } from "@/types/database";
import { ReportsExport } from "@/components/reports-export";
import { getBangkokParts } from "@/lib/timezone";
import { attachStaffProfiles } from "@/lib/attendance-select";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; month?: string; start?: string }>;
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
  const type: PayPeriodType =
    params.type === "fortnight" ? "fortnight" : "monthly";
  // Bangkok's "today", not the server's own UTC clock — see lib/timezone.ts.
  const todayParts = getBangkokParts(new Date());
  const defaultMonth = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}`;
  const period = resolvePayPeriod(type, {
    month: params.month ?? defaultMonth,
    start: params.start,
  });

  const fortnightOptions = listRecentFortnights(12).map((p) => ({
    key: p.key,
    label: p.shortLabel,
  }));
  const currentFortnightKey = getFortnightContaining(new Date()).key;

  const { data: rawRecords, error: recordsError } = await supabase
    .from("attendance")
    .select("*")
    .gte("check_in_at", period.start.toISOString())
    .lte("check_in_at", period.end.toISOString())
    .order("check_in_at", { ascending: true });

  if (recordsError) {
    console.error("Reports attendance query failed:", recordsError.message);
  }

  const allRecords = await attachStaffProfiles(supabase, rawRecords);

  // Admins don't check in/out and aren't paid hourly, so exclude them from
  // payroll summaries and exports to avoid confusion when running payroll.
  const records = allRecords.filter((r) => r.profiles?.role !== "admin");

  const summary = buildPayrollSummary(records, th.unknown);
  const totalPayableHours = summary.reduce((s, r) => s + r.totalHours, 0);
  const totalOvertimeHours = summary.reduce((s, r) => s + r.overtimeHours, 0);
  const totalPendingOt = summary.reduce((s, r) => s + r.pendingOvertimeHours, 0);
  const totalIncomplete = summary.reduce((s, r) => s + r.incompleteShifts, 0);

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{th.payrollReport}</h1>
            <p className="text-sm text-slate-500">{period.label}</p>
          </div>
          <ReportsExport
            period={period}
            summary={summary}
            records={(records ?? []) as Attendance[]}
          />
        </div>

        <PayPeriodFilter
          type={type}
          month={params.month ?? defaultMonth}
          fortnightStart={
            period.type === "fortnight" ? period.key : currentFortnightKey
          }
          fortnightOptions={fortnightOptions}
        />

        {recordsError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {th.dashboardLoadError}: {recordsError.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-blue-700">{th.totalPayableHours}</p>
            <p className="text-2xl font-bold text-blue-900">
              {totalPayableHours.toFixed(1)} {th.hours}
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 p-4">
            <p className="text-xs text-purple-700">{th.overtimeHours}</p>
            <p className="text-2xl font-bold text-purple-900">
              {totalOvertimeHours.toFixed(1)} {th.hours}
            </p>
          </div>
          {totalPendingOt > 0 && (
            <div className="rounded-xl bg-violet-50 p-4">
              <p className="text-xs text-violet-700">{th.pendingOtHours}</p>
              <p className="text-2xl font-bold text-violet-900">
                {totalPendingOt.toFixed(1)} {th.hours}
              </p>
            </div>
          )}
          <div className={`rounded-xl bg-amber-50 p-4 ${totalPendingOt > 0 ? "" : "col-span-2"}`}>
            <p className="text-xs text-amber-700">{th.incompleteShifts}</p>
            <p className="text-2xl font-bold text-amber-900">{totalIncomplete}</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">{th.overtimeHint}</p>

        {totalIncomplete > 0 && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{th.incompleteWarning}</p>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.summaryByStaff}
          </h2>
          <div className="space-y-2">
            {summary.length === 0 ? (
              <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                {th.noRecordsThisMonth}
              </p>
            ) : (
              summary.map((data) => (
                <div
                  key={data.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{data.name}</p>
                    <p className="text-xs text-slate-500">
                      {data.department && `${data.department} · `}
                      {employmentLabel(data.employmentType)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {data.employmentType === "part_time" ? th.paidByHour : th.paidByDay}
                    </p>
                    {data.incompleteShifts > 0 && (
                      <p className="text-xs text-amber-600">
                        {data.incompleteShifts} {th.incompleteShifts}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {data.employmentType === "part_time" ? (
                      <>
                        <p className="font-semibold text-blue-600">
                          {data.totalHours.toFixed(1)} {th.hours}
                        </p>
                        <p className="text-xs text-slate-500">
                          {data.daysWorked} {th.daysWorked}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-blue-600">
                          {data.daysWorked} {th.daysWorked}
                        </p>
                        <p className="text-xs text-slate-500">
                          {data.totalHours.toFixed(1)} {th.hours}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-slate-500">
                      {th.normalHoursShort} {data.regularHours.toFixed(1)}
                      {" · "}
                      {th.otHoursShort} {data.overtimeHours.toFixed(1)}
                      {data.pendingOvertimeHours > 0 && (
                        <span className="text-purple-600">
                          {" · "}
                          {th.pendingOtHours} {data.pendingOvertimeHours.toFixed(1)}
                        </span>
                      )}
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
            {(records ?? []).map((record) => {
              const complete = !!record.check_out_at;
              const split = getShiftHourSplit(record);

              return (
                <div
                  key={record.id}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    complete
                      ? "border-slate-200 bg-white"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{record.profiles?.full_name}</p>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(record.check_in_at)}
                </p>
                <p className="text-xs text-slate-500">
                    {formatTime(record.check_in_at)} →{" "}
                    {record.check_out_at ? formatTime(record.check_out_at) : th.stillIn}
                    {complete && split
                      ? ` · ${split.total.toFixed(1)} ${th.hours}`
                      : ` · ${th.incompleteShifts}`}
                  </p>
                  {complete && split && (
                    <p className="text-xs text-slate-500">
                      {th.normalHoursShort} {split.normal.toFixed(1)} {th.hours}
                      {" · "}
                      <span className="text-purple-600">
                        {th.otHoursShort} {split.declaredOvertime.toFixed(1)} {th.hours}
                      </span>
                      {split.overtimeStatus === "pending" && (
                        <span className="ml-1 text-amber-600">({th.otPendingApproval})</span>
                      )}
                      {split.overtimeStatus === "approved" && (
                        <span className="ml-1 text-green-600">({th.otApproved})</span>
                      )}
                      {split.overtimeStatus === "rejected" && (
                        <span className="ml-1 text-red-600">({th.otRejected})</span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

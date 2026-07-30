import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { StaffEmploymentForm } from "@/components/staff-employment-form";
import { calculateLeaveBalances } from "@/lib/leave";
import { buildPayrollSummary, getMonthlyPeriod } from "@/lib/pay-period";
import { employmentLabel, roleLabel, statusLabel, th } from "@/lib/i18n";
import type { Profile } from "@/types/database";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: staffMember } = await supabase
    .from("profiles")
    .select("*, sites(name)")
    .eq("id", id)
    .single();

  if (!staffMember) notFound();

  const now = new Date();
  const period = getMonthlyPeriod(now.getFullYear(), now.getMonth() + 1);

  const { data: monthRecords } = await supabase
    .from("attendance")
    .select("*, profiles(full_name, department)")
    .eq("staff_id", id)
    .gte("check_in_at", period.start.toISOString())
    .lte("check_in_at", period.end.toISOString());

  const [workSummary] = buildPayrollSummary(monthRecords ?? [], th.unknown);

  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("staff_id", id)
    .order("created_at", { ascending: false });

  const balances = calculateLeaveBalances(leaveRequests ?? [], staffMember.weekly_hours);
  const isCasual = staffMember.employment_type === "part_time";

  const roleColors: Record<string, string> = {
    staff: "bg-slate-100 text-slate-700",
    manager: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
  };

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <Link
          href="/team"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {th.backToTeam}
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{staffMember.full_name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[staffMember.role]}`}
            >
              {roleLabel(staffMember.role)}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {staffMember.email}
            {staffMember.department && ` · ${staffMember.department}`}
            {` · ${employmentLabel(staffMember.employment_type)}`}
            {` · ${isCasual ? th.paidByHour : th.paidByDay}`}
          </p>
          {(staffMember.sites as { name: string } | null)?.name && (
            <p className="text-xs text-slate-400">
              {(staffMember.sites as { name: string }).name}
            </p>
          )}
          {!staffMember.is_active && (
            <p className="mt-1 text-xs font-medium text-red-500">{th.inactive}</p>
          )}
        </div>

        <StaffEmploymentForm
          staffId={staffMember.id}
          employmentType={staffMember.employment_type}
          weeklyHours={staffMember.weekly_hours}
        />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.workThisMonth} — {period.label}
          </h2>
          <p className="mb-2 text-xs text-slate-400">
            {th.payBasis}: {isCasual ? th.paidByHour : th.paidByDay}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-xl p-3 ${isCasual ? "bg-blue-50" : "bg-slate-100"}`}>
              <p className={`text-xs ${isCasual ? "text-blue-700" : "text-slate-600"}`}>
                {th.totalHours}
              </p>
              <p className={`text-xl font-bold ${isCasual ? "text-blue-900" : "text-slate-900"}`}>
                {(workSummary?.totalHours ?? 0).toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3">
              <p className="text-xs text-purple-700">{th.overtimeHours}</p>
              <p className="text-xl font-bold text-purple-900">
                {(workSummary?.overtimeHours ?? 0).toFixed(1)}
              </p>
            </div>
            <div className={`rounded-xl p-3 ${isCasual ? "bg-slate-100" : "bg-blue-50"}`}>
              <p className={`text-xs ${isCasual ? "text-slate-600" : "text-blue-700"}`}>
                {th.daysWorked}
              </p>
              <p className={`text-xl font-bold ${isCasual ? "text-slate-900" : "text-blue-900"}`}>
                {workSummary?.daysWorked ?? 0}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.leaveBalance}
          </h2>
          {isCasual ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {th.leaveBalanceNotSetForCasual}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {balances.map((b) => (
                <div key={b.type} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-700">
                    {b.type === "sick" ? th.sickLeave : th.annualLeave}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{b.remaining}</p>
                  <p className="text-xs text-slate-500">{th.daysRemaining}</p>
                  <p className="mt-1 text-xs text-slate-400">{th.daysUsedOf(b.used, b.entitlement)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.recentLeaveRequests}
          </h2>
          <div className="space-y-2">
            {(leaveRequests ?? []).length === 0 ? (
              <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                {th.noLeaveRequests}
              </p>
            ) : (
              (leaveRequests ?? []).slice(0, 10).map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {req.leave_type === "sick" ? th.sickLeave : th.annualLeave} ·{" "}
                      {th.leaveDaysLabel(req.days)}
                    </p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(req.start_date).toLocaleDateString("th-TH")}
                    {req.reason && ` — ${req.reason}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {statusLabel(status)}
    </span>
  );
}

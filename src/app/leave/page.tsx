import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LeaveForm } from "@/components/leave-form";
import { LeaveReview } from "@/components/leave-review";
import { calculateLeaveBalances } from "@/lib/leave";
import { statusLabel, th } from "@/lib/i18n";
import type { LeaveRequest, Profile } from "@/types/database";

export default async function LeavePage() {
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

  const isManager = ["manager", "admin"].includes(profile.role);

  const { data: myRequests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("staff_id", user.id)
    .order("created_at", { ascending: false });

  const isCasual = profile.employment_type === "part_time";
  const myBalances = calculateLeaveBalances(myRequests ?? [], profile.weekly_hours);

  let allRequests: LeaveRequest[] = [];
  let teamBalances: {
    name: string;
    isCasual: boolean;
    balances: ReturnType<typeof calculateLeaveBalances>;
  }[] = [];

  if (isManager) {
    const { data } = await supabase
      .from("leave_requests")
      .select("*, profiles!leave_requests_staff_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    allRequests = (data ?? []) as unknown as LeaveRequest[];

    const { data: staffList } = await supabase
      .from("profiles")
      .select("id, full_name, weekly_hours, employment_type")
      .eq("is_active", true)
      .order("full_name");

    teamBalances = (staffList ?? []).map((staff) => {
      const staffRequests = allRequests.filter((r) => r.staff_id === staff.id);
      return {
        name: staff.full_name,
        isCasual: staff.employment_type === "part_time",
        balances: calculateLeaveBalances(staffRequests, staff.weekly_hours),
      };
    });
  }

  const pendingCount = allRequests.filter((r) => r.status === "pending").length;

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">{th.leaveTitle}</h1>
          {isManager && <p className="text-sm text-slate-500">{th.pendingLeaveReview(pendingCount)}</p>}
        </div>

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
              {myBalances.map((b) => (
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

        <LeaveForm />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {th.myLeaveRequests}
          </h2>
          <div className="space-y-2">
            {(myRequests ?? []).length === 0 ? (
              <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                {th.noLeaveRequests}
              </p>
            ) : (
              (myRequests ?? []).map((req) => (
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
                    {new Date(req.start_date).toLocaleDateString("th-TH", {
                      calendar: "gregory",
                    })}
                    {req.reason && ` — ${req.reason}`}
                  </p>
                  {req.review_notes && (
                    <p className="mt-1 text-xs text-slate-500">
                      {th.reviewNote}: {req.review_notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {isManager && (
          <>
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {th.teamTitle} — {th.leaveBalance}
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">{th.fullName}</th>
                      <th className="px-3 py-2 text-right">{th.sickLeave}</th>
                      <th className="px-3 py-2 text-right">{th.annualLeave}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamBalances.map((staff) => (
                      <tr key={staff.name} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          {staff.name}
                          {staff.isCasual && (
                            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {th.partTime}
                            </span>
                          )}
                        </td>
                        {staff.isCasual ? (
                          <td colSpan={2} className="px-3 py-2 text-right text-slate-400">
                            {th.leaveBalanceNotSet}
                          </td>
                        ) : (
                          staff.balances.map((b) => (
                            <td key={b.type} className="px-3 py-2 text-right">
                              {b.remaining}/{b.entitlement}
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {th.allLeaveRequests}
              </h2>
              <div className="space-y-3">
                {allRequests.length === 0 ? (
                  <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                    {th.noLeaveRequests}
                  </p>
                ) : (
                  allRequests.map((req) =>
                    req.status === "pending" ? (
                      <LeaveReview key={req.id} request={req} />
                    ) : (
                      <div
                        key={req.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {(req as LeaveRequest & { profiles?: { full_name: string } })
                              .profiles?.full_name ?? th.unknown}
                          </p>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {req.leave_type === "sick" ? th.sickLeave : th.annualLeave} ·{" "}
                          {th.leaveDaysLabel(req.days)}
                        </p>
                      </div>
                    )
                  )
                )}
              </div>
            </section>
          </>
        )}
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

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CorrectionForm } from "@/components/correction-form";
import { CorrectionReview } from "@/components/correction-review";
import { statusLabel, th } from "@/lib/i18n";
import type { CorrectionRequest, Profile } from "@/types/database";

export default async function CorrectionsPage() {
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

  const { data: myRecords } = await supabase
    .from("attendance")
    .select("*")
    .eq("staff_id", user.id)
    .order("check_in_at", { ascending: false })
    .limit(14);

  let requestsQuery = supabase
    .from("correction_requests")
    .select("*, attendance(*), profiles!correction_requests_requested_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (!isManager) {
    requestsQuery = requestsQuery.eq("requested_by", user.id);
  }

  const { data: requests } = await requestsQuery;

  const pendingCount = (requests ?? []).filter((r) => r.status === "pending").length;

  return (
    <AppShell profile={profile as Profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">{th.correctionsTitle}</h1>
          <p className="text-sm text-slate-500">
            {isManager ? th.pendingReview(pendingCount) : th.requestFix}
          </p>
        </div>

        {!isManager && <CorrectionForm records={myRecords ?? []} />}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isManager ? th.allRequests : th.myRequests}
          </h2>
          <div className="space-y-3">
            {(requests ?? []).length === 0 ? (
              <p className="rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                {th.noCorrectionRequests}
              </p>
            ) : (
              (requests ?? []).map((req) =>
                isManager && req.status === "pending" ? (
                  <CorrectionReview key={req.id} request={req as CorrectionRequest} />
                ) : (
                  <div
                    key={req.id}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {isManager
                          ? (req.profiles as { full_name: string })?.full_name
                          : th.yourRequest}
                      </p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{req.reason}</p>
                    {req.review_notes && (
                      <p className="mt-2 text-xs text-slate-500">
                        {th.reviewNote}: {req.review_notes}
                      </p>
                    )}
                  </div>
                )
              )
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

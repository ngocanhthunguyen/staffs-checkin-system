"use client";

import { useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { reviewLeaveRequest } from "@/app/actions/leave";
import { th } from "@/lib/i18n";
import type { LeaveRequest } from "@/types/database";

export function LeaveReview({ request }: { request: LeaveRequest }) {
  const [isPending, startTransition] = useTransition();

  function handleReview(status: "approved" | "rejected") {
    startTransition(async () => {
      await reviewLeaveRequest(request.id, status);
    });
  }

  const typeLabel = request.leave_type === "sick" ? th.sickLeave : th.annualLeave;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {(request as LeaveRequest & { profiles?: { full_name: string } }).profiles
              ?.full_name ?? th.unknown}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {typeLabel} · {th.leaveDaysLabel(request.days)} ·{" "}
            {new Date(request.start_date).toLocaleDateString("th-TH", {
              timeZone: "Asia/Bangkok",
              calendar: "gregory",
            })}
          </p>
          {request.reason && <p className="mt-1 text-xs text-slate-500">{request.reason}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {th.pending}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => handleReview("approved")}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {th.approve}
        </button>
        <button
          onClick={() => handleReview("rejected")}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          {th.reject}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { reviewCorrection } from "@/app/actions/attendance";
import { th } from "@/lib/i18n";
import type { CorrectionRequest } from "@/types/database";
import { Check, X, Loader2 } from "lucide-react";

export function CorrectionReview({ request }: { request: CorrectionRequest }) {
  const [isPending, startTransition] = useTransition();

  function handleReview(status: "approved" | "rejected") {
    startTransition(async () => {
      await reviewCorrection(request.id, status);
    });
  }

  const attendance = request.attendance;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {(request as CorrectionRequest & { profiles?: { full_name: string } }).profiles
              ?.full_name ?? th.unknown}
          </p>
          <p className="mt-1 text-sm text-slate-600">{request.reason}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {th.pending}
        </span>
      </div>

      {attendance && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div className="rounded-lg bg-white/60 p-2">
            <p className="font-medium text-slate-700">{th.currentCheckIn}</p>
            <p>
              {new Date(attendance.check_in_at).toLocaleString("th-TH", {
                calendar: "gregory",
              })}
            </p>
          </div>
          <div className="rounded-lg bg-white/60 p-2">
            <p className="font-medium text-slate-700">{th.currentCheckOut}</p>
            <p>
              {attendance.check_out_at
                ? new Date(attendance.check_out_at).toLocaleString("th-TH", {
                    calendar: "gregory",
                  })
                : "—"}
            </p>
          </div>
          {request.requested_check_in && (
            <div className="rounded-lg bg-green-100/60 p-2">
              <p className="font-medium text-green-800">{th.requestedCheckIn}</p>
              <p>
                {new Date(request.requested_check_in).toLocaleString("th-TH", {
                  calendar: "gregory",
                })}
              </p>
            </div>
          )}
          {request.requested_check_out && (
            <div className="rounded-lg bg-green-100/60 p-2">
              <p className="font-medium text-green-800">{th.requestedCheckOut}</p>
              <p>
                {new Date(request.requested_check_out).toLocaleString("th-TH", {
                  calendar: "gregory",
                })}
              </p>
            </div>
          )}
        </div>
      )}

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

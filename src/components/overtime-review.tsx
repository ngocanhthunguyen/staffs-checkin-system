"use client";

import { useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { reviewOvertime } from "@/app/actions/attendance";
import { th } from "@/lib/i18n";
import { formatDate, formatTime } from "@/lib/utils";

export interface PendingOtRecord {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  normal_hours: number | null;
  overtime_hours: number | null;
  profiles?: { full_name: string } | null;
}

export function OvertimeReview({ record }: { record: PendingOtRecord }) {
  const [isPending, startTransition] = useTransition();

  function handleReview(status: "approved" | "rejected") {
    startTransition(async () => {
      await reviewOvertime(record.id, status);
    });
  }

  const normal = Number(record.normal_hours ?? 0);
  const ot = Number(record.overtime_hours ?? 0);

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{record.profiles?.full_name ?? th.unknown}</p>
          <p className="mt-1 text-sm text-slate-700">{formatDate(record.check_in_at)}</p>
          <p className="text-xs text-slate-500">
            {formatTime(record.check_in_at)} →{" "}
            {record.check_out_at ? formatTime(record.check_out_at) : "—"}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {th.normalHoursShort} {normal.toFixed(1)} {th.hours}
            {" · "}
            <span className="font-semibold text-purple-700">
              {th.claimedOt} {ot.toFixed(1)} {th.hours}
            </span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-purple-200 px-2.5 py-0.5 text-xs font-medium text-purple-900">
          {th.otPendingApproval}
        </span>
      </div>

      <p className="mt-2 text-xs text-purple-800">{th.overtimeHint}</p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => handleReview("approved")}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {th.approveOt}
        </button>
        <button
          onClick={() => handleReview("rejected")}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          title={th.otRejectedHint}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          {th.rejectOt}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{th.otRejectedHint}</p>
    </div>
  );
}

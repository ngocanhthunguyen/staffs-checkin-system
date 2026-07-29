"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { requestLeave } from "@/app/actions/leave";
import { th } from "@/lib/i18n";

export function LeaveForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await requestLeave(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">{th.requestLeaveTitle}</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{th.leaveType}</label>
        <select
          name="leave_type"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          <option value="sick">{th.sickLeave}</option>
          <option value="annual">{th.annualLeave}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{th.startDate}</label>
          <input
            type="date"
            name="start_date"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {th.numberOfDays}
          </label>
          <input
            type="number"
            name="days"
            min="0.5"
            step="0.5"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{th.leaveReason}</label>
        <textarea
          name="reason"
          rows={2}
          placeholder={th.leaveReasonPlaceholder}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {th.leaveRequestSubmitted}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {th.submitLeaveRequest}
      </button>
    </form>
  );
}

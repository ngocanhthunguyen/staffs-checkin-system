"use client";

import { useState, useTransition } from "react";
import { requestCorrection } from "@/app/actions/attendance";
import { th } from "@/lib/i18n";
import type { Attendance } from "@/types/database";
import { Loader2 } from "lucide-react";

export function CorrectionForm({ records }: { records: Attendance[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await requestCorrection(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">{th.requestCorrection}</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{th.whichDay}</label>
        <select
          name="attendance_id"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          <option value="">{th.selectRecord}</option>
          {records.map((r) => (
            <option key={r.id} value={r.id}>
              {new Date(r.check_in_at).toLocaleDateString("th-TH")} —{" "}
              {new Date(r.check_in_at).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {th.correctCheckIn}
          </label>
          <input
            type="datetime-local"
            name="requested_check_in"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {th.correctCheckOut}
          </label>
          <input
            type="datetime-local"
            name="requested_check_out"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{th.reason}</label>
        <textarea
          name="reason"
          required
          rows={2}
          placeholder={th.reasonPlaceholder}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {th.requestSubmitted}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {th.submitRequest}
      </button>
    </form>
  );
}

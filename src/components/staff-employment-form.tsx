"use client";

import { useState, useTransition } from "react";
import { updateStaffEmployment } from "@/app/actions/staff";
import { th } from "@/lib/i18n";
import type { EmploymentType } from "@/types/database";

export function StaffEmploymentForm({
  staffId,
  employmentType,
  weeklyHours,
}: {
  staffId: string;
  employmentType: EmploymentType;
  weeklyHours: number;
}) {
  const [type, setType] = useState<EmploymentType>(employmentType);
  const [hours, setHours] = useState(String(weeklyHours));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(
    null
  );

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStaffEmployment(staffId, type, Number(hours));
      if (result?.error) {
        setMessage({ kind: "error", text: result.error });
      } else {
        setMessage({ kind: "success", text: th.employmentUpdated });
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {th.employmentType}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">{th.employmentType}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EmploymentType)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="full_time">{th.fullTime}</option>
            <option value="part_time">{th.partTime}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">{th.weeklyHours}</label>
          <input
            type="number"
            min={1}
            max={80}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={pending}
        className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? th.processing : th.saveChanges}
      </button>
      {message && (
        <p
          className={`mt-2 text-xs ${message.kind === "error" ? "text-red-600" : "text-green-600"}`}
        >
          {message.text}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-400">{th.weeklyHoursHint}</p>
    </div>
  );
}

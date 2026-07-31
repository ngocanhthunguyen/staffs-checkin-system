"use client";

import { useState, useTransition } from "react";
import { updateStaffRole } from "@/app/actions/staff";
import { roleLabel, th } from "@/lib/i18n";
import type { UserRole } from "@/types/database";

export function StaffRoleForm({
  staffId,
  role,
}: {
  staffId: string;
  role: UserRole;
}) {
  const [value, setValue] = useState<UserRole>(role);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(
    null
  );

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStaffRole(staffId, value);
      if (result?.error) {
        setMessage({ kind: "error", text: result.error });
      } else {
        setMessage({ kind: "success", text: th.roleUpdated });
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {th.changeRole}
      </p>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as UserRole)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {(["staff", "manager", "admin"] as UserRole[]).map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={pending || value === role}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? th.processing : th.saveChanges}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-xs ${message.kind === "error" ? "text-red-600" : "text-green-600"}`}
        >
          {message.text}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-400">{th.changeRoleHint}</p>
    </div>
  );
}

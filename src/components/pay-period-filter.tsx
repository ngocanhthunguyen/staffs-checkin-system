"use client";

import { th } from "@/lib/i18n";
import type { PayPeriodType } from "@/lib/pay-period";

interface PayPeriodFilterProps {
  type: PayPeriodType;
  month: string;
  fortnightStart: string;
  fortnightOptions: { key: string; label: string }[];
}

export function PayPeriodFilter({
  type,
  month,
  fortnightStart,
  fortnightOptions,
}: PayPeriodFilterProps) {
  return (
    <form action="/reports" method="get" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">{th.payPeriodLabel}</p>

      <div className="flex gap-2">
        <a
          href={`/reports?type=monthly&month=${month}`}
          className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium ${
            type === "monthly"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {th.payPeriodMonthly}
        </a>
        <a
          href={`/reports?type=fortnight&start=${fortnightStart}`}
          className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium ${
            type === "fortnight"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {th.payPeriodFortnight}
        </a>
      </div>

      {type === "monthly" ? (
        <div className="flex gap-2">
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input type="hidden" name="type" value="monthly" />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {th.go}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            name="start"
            defaultValue={fortnightStart}
            className="min-w-0 flex-1 truncate rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            {fortnightOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <input type="hidden" name="type" value="fortnight" />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {th.go}
          </button>
        </div>
      )}
    </form>
  );
}

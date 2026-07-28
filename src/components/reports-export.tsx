"use client";

import { Download } from "lucide-react";
import { th } from "@/lib/i18n";
import type { Attendance } from "@/types/database";

interface SummaryRow {
  id: string;
  name: string;
  department: string | null;
  days: number;
  hours: number;
}

export function ReportsExport({
  month,
  summary,
  records,
}: {
  month: string;
  summary: SummaryRow[];
  records: Attendance[];
}) {
  function exportCSV() {
    const lines = [
      "พนักงาน / Staff,แผนก / Department,จำนวนวัน / Days,ชั่วโมงรวม / Total Hours",
      ...summary.map(
        (s) =>
          `"${s.name}","${s.department ?? ""}",${s.days},${s.hours.toFixed(2)}`
      ),
      "",
      "วันที่ / Date,พนักงาน / Staff,เข้างาน / Check In,ออกงาน / Check Out,ชั่วโมง / Hours",
      ...records.map((r) => {
        const checkIn = new Date(r.check_in_at);
        const checkOut = r.check_out_at ? new Date(r.check_out_at) : null;
        const hours =
          ((checkOut?.getTime() ?? Date.now()) - checkIn.getTime()) / 3600000;
        return `"${checkIn.toLocaleDateString("th-TH")}","${(r as Attendance & { profiles?: { full_name: string } }).profiles?.full_name ?? ""}","${checkIn.toLocaleTimeString("th-TH")}","${checkOut?.toLocaleTimeString("th-TH") ?? ""}",${hours.toFixed(2)}`;
      }),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canaaustralasia-attendance-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCSV}
      className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <Download className="h-4 w-4" />
      {th.exportCsv}
    </button>
  );
}

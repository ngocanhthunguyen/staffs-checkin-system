"use client";

import { Download } from "lucide-react";
import { COMPANY_NAME, employmentLabel, th } from "@/lib/i18n";
import type { Attendance } from "@/types/database";
import { getShiftHourSplit, type PayPeriod, type PayrollSummaryRow } from "@/lib/pay-period";

function downloadCsv(filename: string, lines: string[]) {
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function periodHeader(period: PayPeriod, title: string): string[] {
  return [
    `${COMPANY_NAME} - ${title}`,
    `Pay Period / รอบจ่ายเงิน:,${period.label}`,
    `From / ตั้งแต่:,${period.start.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}`,
    `To / ถึง:,${period.end.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}`,
  ];
}

function payBasisLabel(employmentType: PayrollSummaryRow["employmentType"]) {
  return employmentType === "part_time"
    ? "Paid by hour / รายชั่วโมง"
    : "Paid by day / รายวัน";
}

function staffName(r: Attendance): string {
  return (
    (r as Attendance & { profiles?: { full_name: string } }).profiles?.full_name ?? ""
  );
}

export function ReportsExport({
  period,
  summary,
  records,
}: {
  period: PayPeriod;
  summary: PayrollSummaryRow[];
  records: Attendance[];
}) {
  function exportNormal() {
    const totalNormal = summary.reduce((s, r) => s + r.regularHours, 0);

    const detailRows = records
      .map((r) => {
        const split = getShiftHourSplit(r);
        if (!split || !r.check_out_at || split.normal <= 0) return null;
        const checkIn = new Date(r.check_in_at);
        const checkOut = new Date(r.check_out_at);
        return `"${checkIn.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}","${staffName(r)}","${checkIn.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })}","${checkOut.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })}",${split.normal.toFixed(2)}`;
      })
      .filter((row): row is string => row != null);

    const lines = [
      ...periodHeader(period, "Normal Hours Export / ส่งออกชั่วโมงปกติ"),
      `Total Normal Hours / ชั่วโมงปกติรวม:,${totalNormal.toFixed(2)}`,
      "",
      "พนักงาน / Staff,แผนก / Department,ประเภท / Employment,รูปแบบจ่ายเงิน / Pay Basis,วันทำงาน / Days Worked,ชั่วโมงปกติ / Normal Hours,ลืมออกงาน / Missing Check-out",
      ...summary.map(
        (s) =>
          `"${s.name}","${s.department ?? ""}","${employmentLabel(s.employmentType)}","${payBasisLabel(s.employmentType)}",${s.daysWorked},${s.regularHours.toFixed(2)},${s.incompleteShifts}`
      ),
      "",
      "วันที่ / Date,พนักงาน / Staff,เข้างาน / Check In,ออกงาน / Check Out,ชั่วโมงปกติ / Normal Hours",
      ...detailRows,
    ];

    downloadCsv(`canaaustralasia-normal-hours-${period.key}.csv`, lines);
  }

  function exportOvertime() {
    const totalOt = summary.reduce((s, r) => s + r.overtimeHours, 0);
    const totalPending = summary.reduce((s, r) => s + r.pendingOvertimeHours, 0);

    // Detail: only approved OT hours (payable). Pending listed separately below.
    const approvedDetail = records
      .map((r) => {
        const split = getShiftHourSplit(r);
        if (!split || !r.check_out_at || split.overtime <= 0) return null;
        const checkIn = new Date(r.check_in_at);
        const checkOut = new Date(r.check_out_at);
        return `"${checkIn.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}","${staffName(r)}","${checkIn.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })}","${checkOut.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })}",${split.overtime.toFixed(2)},approved`;
      })
      .filter((row): row is string => row != null);

    const pendingDetail = records
      .map((r) => {
        const split = getShiftHourSplit(r);
        if (!split || !r.check_out_at || split.pendingOvertime <= 0) return null;
        const checkIn = new Date(r.check_in_at);
        const checkOut = new Date(r.check_out_at);
        return `"${checkIn.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}","${staffName(r)}","${checkIn.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })}","${checkOut.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })}",${split.pendingOvertime.toFixed(2)},pending`;
      })
      .filter((row): row is string => row != null);

    const lines = [
      ...periodHeader(period, "Overtime (OT) Hours Export / ส่งออกชั่วโมง OT"),
      `Total Approved OT Hours / ชั่วโมง OT ที่อนุมัติแล้ว:,${totalOt.toFixed(2)}`,
      `Pending OT Hours (not paid as OT yet) / OT รออนุมัติ:,${totalPending.toFixed(2)}`,
      "",
      "พนักงาน / Staff,แผนก / Department,ประเภท / Employment,รูปแบบจ่ายเงิน / Pay Basis,วันทำงาน / Days Worked,ชั่วโมง OT อนุมัติ / Approved OT,OT รออนุมัติ / Pending OT",
      ...summary
        .filter((s) => s.overtimeHours > 0 || s.pendingOvertimeHours > 0)
        .map(
          (s) =>
            `"${s.name}","${s.department ?? ""}","${employmentLabel(s.employmentType)}","${payBasisLabel(s.employmentType)}",${s.daysWorked},${s.overtimeHours.toFixed(2)},${s.pendingOvertimeHours.toFixed(2)}`
        ),
      "",
      "วันที่ / Date,พนักงาน / Staff,เข้างาน / Check In,ออกงาน / Check Out,ชั่วโมง OT / OT Hours,สถานะ / Status",
      ...approvedDetail,
      ...(pendingDetail.length
        ? ["", "--- Pending OT (awaiting approval) / OT รออนุมัติ ---", ...pendingDetail]
        : []),
    ];

    downloadCsv(`canaaustralasia-ot-hours-${period.key}.csv`, lines);
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        onClick={exportNormal}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Download className="h-4 w-4" />
        {th.exportNormalHours}
      </button>
      <button
        onClick={exportOvertime}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
      >
        <Download className="h-4 w-4" />
        {th.exportOtHours}
      </button>
    </div>
  );
}

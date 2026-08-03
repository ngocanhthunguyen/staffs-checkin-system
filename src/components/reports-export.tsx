"use client";

import { Download } from "lucide-react";
import { COMPANY_NAME, employmentLabel, th } from "@/lib/i18n";
import type { Attendance } from "@/types/database";
import { getShiftHourSplit, type PayPeriod, type PayrollSummaryRow } from "@/lib/pay-period";

export function ReportsExport({
  period,
  summary,
  records,
}: {
  period: PayPeriod;
  summary: PayrollSummaryRow[];
  records: Attendance[];
}) {
  function exportCSV() {
    const periodLabel = period.label;
    const totalHours = summary.reduce((s, r) => s + r.totalHours, 0);
    const totalOvertime = summary.reduce((s, r) => s + r.overtimeHours, 0);

    const lines = [
      `${COMPANY_NAME} - Payroll Export / ส่งออกเงินเดือน`,
      `Pay Period / รอบจ่ายเงิน:,${periodLabel}`,
      `From / ตั้งแต่:,${period.start.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}`,
      `To / ถึง:,${period.end.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}`,
      `Total Payable Hours / ชั่วโมงจ่ายเงินรวม:,${totalHours.toFixed(2)}`,
      `Total Overtime Hours (approved) / ชั่วโมง OT ที่อนุมัติแล้ว:,${totalOvertime.toFixed(2)}`,
      `Pending OT Hours / OT รออนุมัติ:,${summary.reduce((s, r) => s + r.pendingOvertimeHours, 0).toFixed(2)}`,
      "",
      "พนักงาน / Staff,แผนก / Department,ประเภท / Employment,รูปแบบจ่ายเงิน / Pay Basis,วันทำงาน / Days Worked,ชั่วโมงปกติ / Normal Hours,ชั่วโมง OT อนุมัติ / Approved OT,OT รออนุมัติ / Pending OT,ชั่วโมงจ่ายรวม / Total Payable Hours,ลืมออกงาน / Missing Check-out",
      ...summary.map((s) => {
        const payBasis =
          s.employmentType === "part_time"
            ? "Paid by hour / รายชั่วโมง"
            : "Paid by day / รายวัน";
        return `"${s.name}","${s.department ?? ""}","${employmentLabel(s.employmentType)}","${payBasis}",${s.daysWorked},${s.regularHours.toFixed(2)},${s.overtimeHours.toFixed(2)},${s.pendingOvertimeHours.toFixed(2)},${s.totalHours.toFixed(2)},${s.incompleteShifts}`;
      }),
      "",
      "วันที่ / Date,พนักงาน / Staff,เข้างาน / Check In,ออกงาน / Check Out,ชั่วโมงปกติ / Normal Hours,ชั่วโมง OT / OT Hours,สถานะ OT / OT Status,ชั่วโมงรวม / Total Hours,สถานะ / Status",
      ...records.map((r) => {
        const checkIn = new Date(r.check_in_at);
        const checkOut = r.check_out_at ? new Date(r.check_out_at) : null;
        const split = getShiftHourSplit(r);
        const otStatus = split?.overtimeStatus ?? "";
        const status = checkOut
          ? "Complete / เสร็จสิ้น"
          : "Incomplete / ไม่ครบ (not paid)";
        return `"${checkIn.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory" })}","${(r as Attendance & { profiles?: { full_name: string } }).profiles?.full_name ?? ""}","${checkIn.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })}","${checkOut ? checkOut.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" }) : ""}",${split ? split.normal.toFixed(2) : ""},${split ? split.declaredOvertime.toFixed(2) : ""},"${otStatus}",${split ? split.total.toFixed(2) : "0.00"},"${status}"`;
      }),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canaaustralasia-payroll-${period.key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCSV}
      className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
    >
      <Download className="h-4 w-4" />
      {th.exportPayroll}
    </button>
  );
}

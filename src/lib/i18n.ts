export const COMPANY_NAME = "Canaaustralasia";

/** Bilingual label: Thai / English */
function bi(th: string, en: string): string {
  return `${th} / ${en}`;
}

export const th = {
  appName: bi("ลงเวลาเข้า-ออกงาน", "Staff Check-In"),
  companyTagline: COMPANY_NAME,

  // Auth
  signIn: bi("เข้าสู่ระบบ", "Sign In"),
  signOut: bi("ออกจากระบบ", "Sign Out"),
  createAccount: bi("สร้างบัญชี", "Create Account"),
  fullName: bi("ชื่อ-นามสกุล", "Full Name"),
  email: bi("อีเมล", "Email"),
  password: bi("รหัสผ่าน", "Password"),
  signInPrompt: bi("เข้าสู่ระบบเพื่อลงเวลา", "Sign in to check in/out"),
  signUpPrompt: bi("สร้างบัญชีใหม่", "Create your account"),
  yourName: bi("ชื่อของคุณ", "Your name"),
  emailPlaceholder: "you@company.com",
  accountCreated: bi(
    "สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ",
    "Account created! Please sign in."
  ),
  alreadyHaveAccount: bi("มีบัญชีอยู่แล้ว?", "Already have an account?"),
  firstTimeHere: bi("ใช้งานครั้งแรก?", "First time here?"),
  homeScreenTip: bi(
    "เคล็ดลับ: เพิ่มหน้านี้ไปที่หน้าจอหลักเพื่อใช้งานสะดวก",
    "Tip: Add this page to your home screen for quick access"
  ),

  // Nav (shorter English for bottom bar)
  checkIn: bi("เข้างาน", "Check In"),
  checkOut: bi("ออกงาน", "Check Out"),
  history: bi("ประวัติ", "History"),
  corrections: bi("แก้ไขเวลา", "Corrections"),
  dashboard: bi("แดชบอร์ด", "Dashboard"),
  reports: bi("เงินเดือน", "Payroll"),
  team: bi("ทีมงาน", "Team"),
  leave: bi("ลาหยุด", "Leave"),

  // Check-in panel
  checkedIn: bi("คุณลงเวลาเข้างานแล้ว", "You're checked in"),
  checkedOut: bi("คุณยังไม่ได้ลงเวลาเข้างาน", "You're not checked in yet"),
  since: bi("ตั้งแต่", "Since"),
  today: bi("วันนี้", "today"),
  processing: bi("กำลังดำเนินการ...", "Processing..."),
  locationCheck: bi("ตรวจสอบตำแหน่งสำหรับ", "Location check for"),
  radius: bi("รัศมี", "radius"),
  takePhoto: bi("ถ่ายรูปเพื่อลงเวลา", "Take a photo to check in/out"),
  capturePhoto: bi("ถ่าย", "Capture"),
  retakePhoto: bi("ถ่ายใหม่", "Retake"),
  startingCamera: bi("กำลังเปิดกล้อง...", "Starting camera..."),
  cameraStuckHint: bi(
    "กล้องไม่แสดงภาพ ลองปิดแอปอื่นที่ใช้กล้องแล้วลองใหม่",
    "Camera isn't showing a picture. Close other apps using the camera and try again."
  ),
  photoRequired: bi(
    "กรุณาถ่ายรูปก่อนลงเวลา",
    "Please take a photo before checking in/out"
  ),
  photoError: bi(
    "ไม่สามารถใช้กล้องได้ กรุณาลองใหม่",
    "Could not use the camera. Please try again."
  ),
  photoRequiredHint: bi(
    "ต้องถ่ายรูปทุกครั้งที่ลงเวลา เพื่อป้องกันการลงเวลาแทนกัน",
    "A photo is required every time to prevent buddy punching"
  ),
  viewPhoto: bi("ดูรูป", "View"),
  checkInPhoto: bi("รูปตอนเข้า", "Check-in photo"),
  checkOutPhoto: bi("รูปตอนออก", "Check-out photo"),
  gpsError: bi(
    "ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS แล้วลองใหม่",
    "Could not get location. Please enable GPS and try again."
  ),
  checkoutError: bi(
    "ลงเวลาออกงานไม่สำเร็จ กรุณาลองใหม่",
    "Check-out failed. Please try again."
  ),

  // Server errors
  notAuthenticated: bi("กรุณาเข้าสู่ระบบ", "Please sign in"),
  accountInactive: bi("บัญชีของคุณถูกระงับ", "Your account is inactive"),
  alreadyCheckedIn: bi("คุณลงเวลาเข้างานแล้ว", "You are already checked in"),
  notCheckedIn: bi("คุณยังไม่ได้ลงเวลาเข้างาน", "You are not checked in"),
  geofenceError: (radius: number, site: string, distance?: number | null) =>
    bi(
      `ต้องอยู่ในรัศมี ${radius} เมตรจาก ${site} จึงจะลงเวลาเข้างานได้${
        distance != null ? ` (ตอนนี้คุณอยู่ห่างประมาณ ${distance} เมตร)` : ""
      }`,
      `You must be within ${radius}m of ${site} to check in${
        distance != null ? ` (you're about ${distance}m away)` : ""
      }`
    ),
  attendanceReasonRequired: bi(
    "กรุณาเลือกวันและระบุเหตุผล",
    "Please select a day and provide a reason"
  ),
  unauthorized: bi("ไม่มีสิทธิ์เข้าถึง", "Unauthorized"),
  requestNotFound: bi("ไม่พบคำขอ", "Request not found"),

  // History
  myHistory: bi("ประวัติของฉัน", "My History"),
  last30Days: bi("30 วันล่าสุด", "Last 30 days"),
  totalHours: bi("รวม", "Total"),
  noRecords: bi("ยังไม่มีข้อมูลการลงเวลา", "No attendance records yet"),
  complete: bi("เสร็จสิ้น", "Complete"),
  open: bi("ยังไม่ออกงาน", "Still in"),
  hours: bi("ชม.", "hrs"),

  // Dashboard
  todayDashboard: bi("สรุปวันนี้", "Today's Dashboard"),
  checkedInCount: bi("เข้างานแล้ว", "Checked in"),
  checkedOutCount: bi("ออกงานแล้ว", "Checked out"),
  notInYet: bi("ยังไม่เข้างาน", "Not in yet"),
  currentlyIn: bi("กำลังอยู่ที่ทำงาน", "Currently in"),
  notCheckedInList: bi("ยังไม่ลงเวลาเข้างาน", "Not checked in"),
  noOneCheckedIn: bi("ยังไม่มีใครลงเวลาเข้างาน", "No one checked in right now"),
  absent: bi("ขาดงาน", "Absent"),
  unknown: bi("ไม่ทราบชื่อ", "Unknown"),
  inTime: bi("เข้า", "In"),
  outTime: bi("ออก", "Out"),

  // Reports / Payroll
  payrollReport: bi("เงินเดือน & ลงเวลา", "Payroll & Timesheets"),
  monthlyReport: bi("รายงานรายเดือน", "Monthly Report"),
  payPeriodMonthly: bi("รายเดือน", "Monthly"),
  payPeriodFortnight: bi("รายปักษ์ (14 วัน)", "Fortnightly (14 days)"),
  payPeriodLabel: bi("รอบจ่ายเงิน", "Pay period"),
  currentPeriod: bi("รอบปัจจุบัน", "Current period"),
  summaryByStaff: bi("สรุปตามพนักงาน (สำหรับจ่ายเงิน)", "Summary by staff (for payroll)"),
  allRecords: bi("รายการทั้งหมด", "All records"),
  noRecordsThisMonth: bi("ไม่มีข้อมูลในรอบนี้", "No records for this period"),
  days: bi("วัน", "days"),
  daysWorked: bi("วันทำงาน", "Days worked"),
  stillIn: bi("ยังไม่ออก", "Still in"),
  incompleteShifts: bi("ลืมลงเวลาออก", "Missing check-out"),
  incompleteWarning: bi(
    "มีการลงเวลาไม่ครบ — ไม่นับในชั่วโมงจ่ายเงิน จนกว่าจะแก้ไข",
    "Incomplete entries are excluded from payable hours until fixed"
  ),
  totalPayableHours: bi("ชั่วโมงจ่ายเงินรวม", "Total payable hours"),
  exportPayroll: bi("ส่งออกเงินเดือน", "Export payroll"),
  go: bi("ดู", "Go"),
  exportCsv: bi("ส่งออก CSV", "Export CSV"),
  myPayPeriodHours: bi("ชั่วโมงรอบจ่ายเงินนี้", "Hours this pay period"),

  // Corrections
  correctionsTitle: bi("แก้ไขเวลา", "Corrections"),
  pendingReview: (n: number) =>
    bi(`รออนุมัติ ${n} รายการ`, `${n} pending review`),
  requestFix: bi(
    "ขอแก้ไขเวลาเข้า-ออกงานที่ผิด",
    "Request a fix for wrong check-in/out times"
  ),
  allRequests: bi("คำขอทั้งหมด", "All requests"),
  myRequests: bi("คำขอของฉัน", "My requests"),
  noCorrectionRequests: bi("ไม่มีคำขอแก้ไข", "No correction requests"),
  yourRequest: bi("คำขอของคุณ", "Your request"),
  reviewNote: bi("หมายเหตุ", "Review note"),
  requestCorrection: bi("ขอแก้ไขเวลา", "Request correction"),
  whichDay: bi("วันไหน?", "Which day?"),
  selectRecord: bi("เลือกรายการ...", "Select a record..."),
  correctCheckIn: bi("เวลาเข้างานที่ถูกต้อง", "Correct check-in"),
  correctCheckOut: bi("เวลาออกงานที่ถูกต้อง", "Correct check-out"),
  reason: bi("เหตุผล", "Reason"),
  reasonPlaceholder: bi(
    "เช่น ลืมลงเวลาเข้างานตอนมาถึง",
    "e.g. Forgot to check in when I arrived"
  ),
  submitRequest: bi("ส่งคำขอ", "Submit request"),
  requestSubmitted: bi(
    "ส่งคำขอแล้ว! ผู้จัดการจะตรวจสอบให้",
    "Request submitted! Your manager will review it."
  ),
  pending: bi("รออนุมัติ", "Pending"),
  approved: bi("อนุมัติแล้ว", "Approved"),
  rejected: bi("ปฏิเสธ", "Rejected"),
  currentCheckIn: bi("เวลาเข้างานปัจจุบัน", "Current check-in"),
  currentCheckOut: bi("เวลาออกงานปัจจุบัน", "Current check-out"),
  requestedCheckIn: bi("เวลาเข้างานที่ขอแก้", "Requested check-in"),
  requestedCheckOut: bi("เวลาออกงานที่ขอแก้", "Requested check-out"),
  approve: bi("อนุมัติ", "Approve"),
  reject: bi("ปฏิเสธ", "Reject"),

  // Leave
  leaveTitle: bi("ลาหยุด", "Leave"),
  leaveBalance: bi("วันลาคงเหลือ", "Leave balance"),
  sickLeave: bi("ลาป่วย", "Sick leave"),
  annualLeave: bi("ลาพักร้อน", "Annual leave"),
  daysUsedOf: (used: number, total: number) =>
    bi(`ใช้ไป ${used} จาก ${total} วัน`, `${used} of ${total} days used`),
  daysRemaining: bi("วันคงเหลือ", "days remaining"),
  requestLeaveTitle: bi("ขอวันลา", "Request leave"),
  leaveType: bi("ประเภทการลา", "Leave type"),
  startDate: bi("วันที่เริ่มลา", "Start date"),
  numberOfDays: bi("จำนวนวัน", "Number of days"),
  leaveReason: bi("เหตุผล (ถ้ามี)", "Reason (optional)"),
  leaveReasonPlaceholder: bi("เช่น ไม่สบาย, ธุระส่วนตัว", "e.g. Feeling unwell, personal matter"),
  submitLeaveRequest: bi("ส่งคำขอลา", "Submit leave request"),
  leaveRequestSubmitted: bi(
    "ส่งคำขอลาแล้ว! ผู้จัดการจะตรวจสอบให้",
    "Leave request submitted! Your manager will review it."
  ),
  myLeaveRequests: bi("คำขอลาของฉัน", "My leave requests"),
  allLeaveRequests: bi("คำขอลาทั้งหมด", "All leave requests"),
  noLeaveRequests: bi("ไม่มีคำขอลา", "No leave requests"),
  pendingLeaveReview: (n: number) =>
    bi(`รออนุมัติ ${n} คำขอลา`, `${n} leave requests pending review`),
  leaveDaysLabel: (days: number) => bi(`${days} วัน`, `${days} day${days === 1 ? "" : "s"}`),
  notEnoughLeaveBalance: bi(
    "วันลาคงเหลือไม่พอ",
    "Not enough remaining leave balance for this request"
  ),
  invalidLeaveDays: bi("จำนวนวันไม่ถูกต้อง", "Please enter a valid number of days"),
  leaveBalanceNotSetForCasual: bi(
    "บริษัทยังไม่ได้กำหนดจำนวนวันลาสำหรับพนักงานชั่วคราว — คุณยังสามารถส่งคำขอลาด้านล่างได้ตามปกติ ผู้ดูแลระบบจะพิจารณาเป็นรายกรณี",
    "Leave day entitlements haven't been finalized for casual staff yet — you can still submit a request below as normal, and it'll be reviewed case-by-case by an admin."
  ),
  leaveBalanceNotSet: bi("ยังไม่กำหนด", "Not set"),

  // Reports / overtime
  regularHours: bi("ชั่วโมงปกติ", "Regular hours"),
  overtimeHours: bi("ชั่วโมงล่วงเวลา (OT)", "Overtime (OT) hours"),
  overtimeHint: bi(
    "ชั่วโมงเกิน 8 ชม./วัน นับเป็นล่วงเวลา",
    "Hours beyond 8/day count as overtime"
  ),

  // Staff profile detail
  staffProfile: bi("ข้อมูลพนักงาน", "Staff Profile"),
  backToTeam: bi("กลับไปที่ทีมงาน", "Back to Team"),
  workThisMonth: bi("การทำงานเดือนนี้", "This month's work"),
  recentLeaveRequests: bi("คำขอลาล่าสุด", "Recent leave requests"),
  checkInOutHistory: bi("ประวัติเข้า-ออกงาน", "Check-in / check-out history"),
  noAttendanceThisMonth: bi("ไม่มีการเข้างานในเดือนนี้", "No check-ins this month"),

  // Employment type
  employmentType: bi("ประเภทการจ้างงาน", "Employment type"),
  fullTime: bi("เต็มเวลา", "Full-time"),
  partTime: bi("ชั่วคราว (Casual)", "Casual"),
  weeklyHours: bi("ชั่วโมงทำงาน/สัปดาห์", "Hours per week"),
  weeklyHoursHint: bi(
    "ใช้คำนวณสัดส่วนวันลาสำหรับพนักงานชั่วคราว เทียบกับเต็มเวลา 48 ชม./สัปดาห์",
    "Used to prorate sick/annual leave for casual staff, compared to a full-time 48 hrs/week"
  ),
  saveChanges: bi("บันทึกการเปลี่ยนแปลง", "Save changes"),
  employmentUpdated: bi("อัปเดตข้อมูลการจ้างงานแล้ว", "Employment details updated"),
  invalidWeeklyHours: bi(
    "กรุณาระบุชั่วโมงทำงานต่อสัปดาห์ให้ถูกต้อง (1-80)",
    "Please enter valid weekly hours (1-80)"
  ),
  paidByDay: bi("จ่ายเป็นรายวัน", "Paid by day"),
  paidByHour: bi("จ่ายเป็นรายชั่วโมง", "Paid by hour"),
  payBasis: bi("รูปแบบการจ่ายเงิน", "Pay basis"),

  // Team
  teamTitle: bi("ทีมงาน", "Team"),
  members: bi("คน", "members"),
  inactive: bi("ไม่ใช้งาน", "Inactive"),
  promoteManager: bi("ตั้งเป็นผู้จัดการ", "Promote a manager"),
  promoteManagerHint: bi(
    "ไปที่ Supabase → Table Editor → profiles → เปลี่ยน role เป็น manager หรือ admin",
    "In Supabase → Table Editor → profiles → change role to manager or admin"
  ),
  noSiteWarning: bi(
    "ไม่ได้ผูกไซต์ — ไม่มีการตรวจสอบ GPS/Wi-Fi",
    "No site linked — GPS/Wi-Fi checks are skipped"
  ),

  // Roles
  roleStaff: bi("พนักงาน", "Staff"),
  roleManager: bi("ผู้จัดการ", "Manager"),
  roleAdmin: bi("ผู้ดูแลระบบ", "Admin"),
} as const;

export function roleLabel(role: string): string {
  switch (role) {
    case "manager":
      return th.roleManager;
    case "admin":
      return th.roleAdmin;
    default:
      return th.roleStaff;
  }
}

export function employmentLabel(type: string | null | undefined): string {
  return type === "part_time" ? th.partTime : th.fullTime;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return th.pending;
    case "approved":
      return th.approved;
    case "rejected":
      return th.rejected;
    default:
      return status;
  }
}

/** Split bilingual string into two lines for compact UI */
export function splitBi(label: string): { th: string; en: string } {
  const [thLine, enLine] = label.split(" / ");
  return { th: thLine ?? label, en: enLine ?? "" };
}

export const LOCALE = "th-TH";

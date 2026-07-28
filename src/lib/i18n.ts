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
  reports: bi("รายงาน", "Reports"),
  team: bi("ทีมงาน", "Team"),

  // Check-in panel
  checkedIn: bi("คุณลงเวลาเข้างานแล้ว", "You're checked in"),
  checkedOut: bi("คุณยังไม่ได้ลงเวลาเข้างาน", "You're not checked in yet"),
  since: bi("ตั้งแต่", "Since"),
  today: bi("วันนี้", "today"),
  processing: bi("กำลังดำเนินการ...", "Processing..."),
  locationCheck: bi("ตรวจสอบตำแหน่งสำหรับ", "Location check for"),
  radius: bi("รัศมี", "radius"),
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
  geofenceError: (radius: number, site: string) =>
    bi(
      `ต้องอยู่ในรัศมี ${radius} เมตรจาก ${site} จึงจะลงเวลาเข้างานได้`,
      `You must be within ${radius}m of ${site} to check in`
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

  // Reports
  monthlyReport: bi("รายงานรายเดือน", "Monthly Report"),
  summaryByStaff: bi("สรุปตามพนักงาน", "Summary by staff"),
  allRecords: bi("รายการทั้งหมด", "All records"),
  noRecordsThisMonth: bi("ไม่มีข้อมูลในเดือนนี้", "No records for this month"),
  days: bi("วัน", "days"),
  stillIn: bi("ยังไม่ออก", "Still in"),
  go: bi("ดู", "Go"),
  exportCsv: bi("ส่งออก CSV", "Export CSV"),

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

  // Team
  teamTitle: bi("ทีมงาน", "Team"),
  members: bi("คน", "members"),
  inactive: bi("ไม่ใช้งาน", "Inactive"),
  promoteManager: bi("ตั้งเป็นผู้จัดการ", "Promote a manager"),
  promoteManagerHint: bi(
    "ไปที่ Supabase → Table Editor → profiles → เปลี่ยน role เป็น manager หรือ admin",
    "In Supabase → Table Editor → profiles → change role to manager or admin"
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

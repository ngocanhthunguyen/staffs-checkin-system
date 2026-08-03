export type UserRole = "staff" | "manager" | "admin";
export type CorrectionStatus = "pending" | "approved" | "rejected";
export type LeaveType = "sick" | "annual";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type EmploymentType = "full_time" | "part_time";
export type OvertimeStatus = "none" | "pending" | "approved" | "rejected";

export interface Site {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  allowed_ips: string[] | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string | null;
  site_id: string | null;
  is_active: boolean;
  employment_type: EmploymentType;
  weekly_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  staff_id: string;
  site_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_in_photo_path: string | null;
  check_out_photo_path: string | null;
  /** Declared at check-out. Null while open or on legacy records. */
  normal_hours: number | null;
  /** Declared at check-out. Null while open or on legacy records. */
  overtime_hours: number | null;
  overtime_status: OvertimeStatus;
  overtime_reviewed_by: string | null;
  overtime_reviewed_at: string | null;
  overtime_review_notes: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface CorrectionRequest {
  id: string;
  attendance_id: string;
  requested_by: string;
  reason: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  status: CorrectionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  attendance?: Attendance;
  profiles?: Profile;
}

export interface LeaveRequest {
  id: string;
  staff_id: string;
  leave_type: LeaveType;
  start_date: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface TodayStatus {
  isCheckedIn: boolean;
  attendance: Attendance | null;
  hoursToday: number;
}

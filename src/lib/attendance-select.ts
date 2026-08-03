/**
 * After migration 010 added `overtime_reviewed_by → profiles`, there are two
 * FKs from attendance to profiles (staff_id and overtime_reviewed_by).
 * PostgREST then rejects ambiguous embeds like `profiles(...)` and the
 * dashboard/reports look empty even though SQL still has the rows.
 *
 * Always pin the embed to staff_id.
 */
export const ATTENDANCE_WITH_STAFF =
  "*, profiles!staff_id(full_name, department, role, employment_type)";

export const ATTENDANCE_WITH_STAFF_BASIC =
  "*, profiles!staff_id(full_name, department, role)";

export const ATTENDANCE_WITH_STAFF_NAME =
  "id, check_in_at, check_out_at, normal_hours, overtime_hours, overtime_status, profiles!staff_id(full_name)";

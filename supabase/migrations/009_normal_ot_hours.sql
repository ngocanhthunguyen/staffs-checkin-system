-- Staff declare Normal vs OT hours at check-out as two separate fields.
-- Run once in Supabase SQL Editor.
--
-- Replaces the old auto "anything over 8 hrs = OT" rule going forward.
-- Each completed shift stores normal_hours and overtime_hours explicitly
-- so payroll can treat them as two separate data columns. No approval
-- step — admins just see whatever the staff member recorded.

alter table public.attendance
  add column if not exists normal_hours numeric(6, 2),
  add column if not exists overtime_hours numeric(6, 2);

comment on column public.attendance.normal_hours is
  'Normal (non-OT) hours declared by staff at check-out. Null = incomplete or legacy record.';
comment on column public.attendance.overtime_hours is
  'Overtime hours declared by staff at check-out. Null = incomplete or legacy record.';

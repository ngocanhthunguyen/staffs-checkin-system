-- OT claims need manager/admin approval before they count in payroll.
-- Run once in Supabase SQL Editor (after migration 009).

do $$ begin
  create type public.overtime_status as enum ('none', 'pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

alter table public.attendance
  add column if not exists overtime_status public.overtime_status not null default 'none';

alter table public.attendance
  add column if not exists overtime_reviewed_by uuid references public.profiles(id),
  add column if not exists overtime_reviewed_at timestamptz,
  add column if not exists overtime_review_notes text;

comment on column public.attendance.overtime_status is
  'none = no OT claimed; pending = staff claimed OT awaiting review; approved/rejected = manager decision.';

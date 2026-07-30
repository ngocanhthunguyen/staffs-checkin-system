-- Security hardening: run this once in Supabase SQL Editor before staff launch.
--
-- Found while reviewing the app before rollout: the Supabase anon key + a
-- user's own session are exposed in the browser by design (this is normal
-- for Supabase), which means RLS policies — not the app's UI — are the real
-- security boundary. A few policies were too permissive:
--
-- 1. Sign-up let the CLIENT pass an arbitrary `role` in user metadata, and
--    the new-user trigger trusted it. Anyone could have signed up directly
--    against the Supabase API (bypassing the app's hard-coded "staff" role)
--    and granted themselves 'admin' or 'manager'.
-- 2. "Users can update own profile" had no column restrictions, so any
--    signed-in staff member could call the Supabase client directly (e.g.
--    from the browser console) to set their own role/is_active/
--    employment_type/weekly_hours/site_id.
-- 3. "Staff can update own open attendance" had no column restrictions and
--    didn't check the record was still open, so a staff member could
--    tamper with their own check-in time/GPS/photo, or even reopen an
--    already-closed shift — bypassing the geofence/selfie anti-cheat
--    checks entirely.
--
-- None of this was reachable through the app's own UI, but all of it was
-- reachable by anyone willing to open devtools, so it's worth closing off.

-- 1. Never trust a client-supplied role at signup. New accounts are always
--    'staff'; promote people to manager/admin afterwards from the Team page
--    or Supabase Table Editor.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, site_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'staff',
    (select id from public.sites order by created_at limit 1)
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Block staff from changing their own privileged profile fields directly.
--    Managers/admins are unaffected (that's how the Team page edits work).
create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  -- service_role (e.g. server-only cron/admin jobs) bypasses this check;
  -- it never runs with an end-user's session anyway.
  if public.is_manager_or_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.employment_type is distinct from old.employment_type
    or new.weekly_hours is distinct from old.weekly_hours
    or new.site_id is distinct from old.site_id
  then
    raise exception 'Not authorized to change this field. Ask a manager or admin.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_prevent_escalation on public.profiles;
create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- 3. Staff can only ever fill in the check-out side of their OWN still-open
--    attendance record — never touch check-in details or a closed record.
--    Any other change (including by a manager who wants to fix a mistake)
--    should go through the correction-request flow, except managers/admins
--    are still allowed to update directly (e.g. approving a correction).
create or replace function public.prevent_attendance_tampering()
returns trigger as $$
begin
  -- service_role bypass: the photo-cleanup cron job nulls out photo paths on
  -- old (already closed) records using the service-role key, which must
  -- still be allowed through.
  if public.is_manager_or_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  if old.check_out_at is not null then
    raise exception 'This record is already closed — submit a correction request instead.';
  end if;

  if new.staff_id is distinct from old.staff_id
    or new.site_id is distinct from old.site_id
    or new.check_in_at is distinct from old.check_in_at
    or new.check_in_lat is distinct from old.check_in_lat
    or new.check_in_lng is distinct from old.check_in_lng
    or new.check_in_photo_path is distinct from old.check_in_photo_path
  then
    raise exception 'Cannot modify check-in details directly.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists attendance_prevent_tampering on public.attendance;
create trigger attendance_prevent_tampering
  before update on public.attendance
  for each row execute function public.prevent_attendance_tampering();

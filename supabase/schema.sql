-- Staff Attendance System Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Sites (offices/locations)
create table public.sites (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  latitude double precision,
  longitude double precision,
  geofence_radius_m integer default 150,
  -- Office's static public IP address(es). If set, check-in/out is only
  -- allowed when the request comes from one of these IPs (in addition to
  -- the GPS geofence check). Leave empty/null to skip this check.
  allowed_ips text[],
  created_at timestamptz default now()
);

-- User profiles (extends Supabase auth.users)
create type public.user_role as enum ('staff', 'manager', 'admin');
create type public.employment_type as enum ('full_time', 'part_time');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'staff',
  department text,
  site_id uuid references public.sites(id),
  is_active boolean default true,
  employment_type public.employment_type not null default 'full_time',
  -- Contracted hours/week. Full-time = 48 (standard). Part-time staff should
  -- have this set to their actual hours so sick/annual leave is prorated
  -- against the full-time entitlement (30 sick / 7 annual days).
  weekly_hours numeric(5, 1) not null default 48,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Attendance records
create table public.attendance (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  site_id uuid references public.sites(id),
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_out_lat double precision,
  check_out_lng double precision,
  check_in_photo_path text,
  check_out_photo_path text,
  -- Declared by staff at check-out as two separate values (not auto-split).
  -- Null while the shift is still open, or for legacy records before this column existed.
  normal_hours numeric(6, 2),
  overtime_hours numeric(6, 2),
  notes text,
  created_at timestamptz default now()
);

-- Correction requests
create type public.correction_status as enum ('pending', 'approved', 'rejected');

create table public.correction_requests (
  id uuid primary key default uuid_generate_v4(),
  attendance_id uuid not null references public.attendance(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  requested_check_in timestamptz,
  requested_check_out timestamptz,
  status public.correction_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz default now()
);

-- Leave requests (sick / annual leave)
create type public.leave_type as enum ('sick', 'annual');
create type public.leave_status as enum ('pending', 'approved', 'rejected');

create table public.leave_requests (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  leave_type public.leave_type not null,
  start_date date not null,
  days numeric(4, 1) not null check (days > 0),
  reason text,
  status public.leave_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz default now()
);

-- Indexes
create index attendance_staff_id_idx on public.attendance(staff_id);
create index attendance_check_in_at_idx on public.attendance(check_in_at);
create index correction_requests_status_idx on public.correction_requests(status);
create index leave_requests_staff_id_idx on public.leave_requests(staff_id);
create index leave_requests_status_idx on public.leave_requests(status);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- New staff are auto-assigned to the first/only site so GPS and
  -- office-network checks apply to them immediately. If you add more
  -- sites later, reassign specific staff manually in Table Editor.
  --
  -- Role is always hard-coded to 'staff' here — never trust a role coming
  -- from the client's sign-up request metadata, since the Supabase anon
  -- key is public and anyone could otherwise self-signup as an admin.
  -- Promote people to manager/admin afterwards from the Team page.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Row Level Security
alter table public.sites enable row level security;
alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.correction_requests enable row level security;
alter table public.leave_requests enable row level security;

-- Helper: check if user is manager or admin
create or replace function public.is_manager_or_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'admin') and is_active = true
  );
$$ language sql security definer stable;

-- Sites policies
create policy "Anyone authenticated can view sites"
  on public.sites for select to authenticated using (true);

create policy "Managers can manage sites"
  on public.sites for all to authenticated
  using (public.is_manager_or_admin())
  with check (public.is_manager_or_admin());

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_manager_or_admin());

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Managers can update all profiles"
  on public.profiles for update to authenticated
  using (public.is_manager_or_admin());

-- A staff member's own "update own profile" policy above has no column
-- restrictions (Postgres RLS is row-level, not column-level), so without
-- this trigger a staff member could call the Supabase client directly
-- (e.g. from the browser console) to set their own role/is_active/
-- employment_type/weekly_hours/site_id. Managers/admins are unaffected for
-- most fields, but changing `role` specifically requires an actual admin —
-- otherwise a manager could grant themselves admin via the same devtools
-- route, bypassing the app's admin-only "Change role" feature.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
declare
  actor_is_admin boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role then
    select exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and is_active = true
    ) into actor_is_admin;

    if not actor_is_admin then
      raise exception 'Only an admin can change a teammate''s role.';
    end if;
  end if;

  if public.is_manager_or_admin() then
    return new;
  end if;

  if new.is_active is distinct from old.is_active
    or new.employment_type is distinct from old.employment_type
    or new.weekly_hours is distinct from old.weekly_hours
    or new.site_id is distinct from old.site_id
  then
    raise exception 'Not authorized to change this field. Ask a manager or admin.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- Attendance policies
create policy "Staff can view own attendance"
  on public.attendance for select to authenticated
  using (staff_id = auth.uid() or public.is_manager_or_admin());

create policy "Staff can insert own attendance"
  on public.attendance for insert to authenticated
  with check (staff_id = auth.uid());

create policy "Staff can update own open attendance"
  on public.attendance for update to authenticated
  using (staff_id = auth.uid())
  with check (staff_id = auth.uid());

create policy "Managers can update any attendance"
  on public.attendance for update to authenticated
  using (public.is_manager_or_admin());

-- The "update own open attendance" policy above has no column restrictions
-- and doesn't check the record is still open, so without this trigger a
-- staff member could tamper with their own check-in time/GPS/photo, or
-- reopen an already-closed shift, bypassing the geofence/selfie anti-cheat
-- checks entirely. Corrections to closed records must go through the
-- correction-request flow instead. Managers/admins are unaffected.
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

create trigger attendance_prevent_tampering
  before update on public.attendance
  for each row execute function public.prevent_attendance_tampering();

-- Correction requests policies
create policy "Staff can view own correction requests"
  on public.correction_requests for select to authenticated
  using (requested_by = auth.uid() or public.is_manager_or_admin());

create policy "Staff can create correction requests"
  on public.correction_requests for insert to authenticated
  with check (requested_by = auth.uid());

create policy "Managers can update correction requests"
  on public.correction_requests for update to authenticated
  using (public.is_manager_or_admin());

-- Leave requests policies
create policy "Staff can view own leave requests"
  on public.leave_requests for select to authenticated
  using (staff_id = auth.uid() or public.is_manager_or_admin());

create policy "Staff can create own leave requests"
  on public.leave_requests for insert to authenticated
  with check (staff_id = auth.uid());

create policy "Managers can update leave requests"
  on public.leave_requests for update to authenticated
  using (public.is_manager_or_admin());

-- Seed default office site (Bangkok example — update coordinates for your office)
insert into public.sites (name, latitude, longitude, geofence_radius_m)
values ('Main Office', 13.7563, 100.5018, 150);

-- Realtime for live dashboard
alter publication supabase_realtime add table public.attendance;

-- Selfie-on-check-in/out: private storage bucket + policies
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

drop policy if exists "Staff can upload own checkin photos" on storage.objects;
create policy "Staff can upload own checkin photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'checkin-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Staff and managers can view checkin photos" on storage.objects;
create policy "Staff and managers can view checkin photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'checkin-photos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_manager_or_admin()
  )
);

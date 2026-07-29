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

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'staff',
  department text,
  site_id uuid references public.sites(id),
  is_active boolean default true,
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

-- Indexes
create index attendance_staff_id_idx on public.attendance(staff_id);
create index attendance_check_in_at_idx on public.attendance(check_in_at);
create index correction_requests_status_idx on public.correction_requests(status);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- New staff are auto-assigned to the first/only site so GPS and
  -- office-network checks apply to them immediately. If you add more
  -- sites later, reassign specific staff manually in Table Editor.
  insert into public.profiles (id, full_name, email, role, site_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'staff'),
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

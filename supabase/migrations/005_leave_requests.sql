-- Leave requests (sick / annual leave): run this once in Supabase SQL Editor
-- Staff submit a leave request, a manager/admin approves or rejects it, and
-- the app tracks each staff member's remaining balance for the year
-- (30 sick days + 7 annual leave days, per calendar year).

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

create index leave_requests_staff_id_idx on public.leave_requests(staff_id);
create index leave_requests_status_idx on public.leave_requests(status);

alter table public.leave_requests enable row level security;

create policy "Staff can view own leave requests"
  on public.leave_requests for select to authenticated
  using (staff_id = auth.uid() or public.is_manager_or_admin());

create policy "Staff can create own leave requests"
  on public.leave_requests for insert to authenticated
  with check (staff_id = auth.uid());

create policy "Managers can update leave requests"
  on public.leave_requests for update to authenticated
  using (public.is_manager_or_admin());

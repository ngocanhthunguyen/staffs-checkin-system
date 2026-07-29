-- Full-time vs part-time staff: run this once in Supabase SQL Editor.
-- `weekly_hours` drives leave proration for part-time staff (30 sick / 7 annual
-- days are the full-time entitlement at 48 hrs/week; part-timers get a
-- proportional share based on their weekly hours).

create type public.employment_type as enum ('full_time', 'part_time');

alter table public.profiles
  add column if not exists employment_type public.employment_type not null default 'full_time';

alter table public.profiles
  add column if not exists weekly_hours numeric(5, 1) not null default 48;

-- Example: mark someone part-time working 24 hrs/week (gives them ~half the
-- sick/annual leave entitlement automatically). Adjust name/hours as needed:
-- update public.profiles
-- set employment_type = 'part_time', weekly_hours = 24
-- where full_name = 'Staff Name';

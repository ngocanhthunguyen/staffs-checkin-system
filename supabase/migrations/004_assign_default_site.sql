-- Fix: staff accounts were never assigned a site_id on signup, which meant
-- BOTH the GPS geofence check and the office-network (IP) check were being
-- silently skipped for every staff member. Run this once in Supabase SQL
-- Editor to fix existing accounts and prevent this for future sign-ups.

-- 1. Backfill: assign every profile without a site to your (first/only) site.
update public.profiles
set site_id = (select id from public.sites order by created_at limit 1)
where site_id is null;

-- 2. Fix future sign-ups: auto-assign new staff to that same site.
create or replace function public.handle_new_user()
returns trigger as $$
begin
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

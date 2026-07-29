-- Office Wi-Fi/network verification: run this once in Supabase SQL Editor
-- Adds an allowed_ips column to sites. When set, staff must be checking in
-- from your office's internet connection (static public IP) in addition to
-- being within the GPS geofence.

alter table public.sites
  add column if not exists allowed_ips text[];

-- Example: after finding your office's static public IP (e.g. via
-- whatismyip.com from the office Wi-Fi), set it on your site like this:
--
-- update public.sites
-- set allowed_ips = array['203.0.113.10']
-- where name = 'Main Office';
--
-- You can list more than one IP (e.g. a backup line) by adding more values:
-- array['203.0.113.10', '203.0.113.11']
--
-- To remove the restriction again, set it back to null:
-- update public.sites set allowed_ips = null where name = 'Main Office';

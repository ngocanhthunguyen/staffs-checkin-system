-- Tighten role changes to admins only: run this once in Supabase SQL Editor.
--
-- Found while reviewing the new in-app "Change role" feature: the app's UI
-- and server action correctly restrict promoting someone to manager/admin to
-- admins only, but the underlying `profiles_prevent_escalation` trigger from
-- migration 007 only checked "is this a manager or admin" — it didn't tell
-- the two apart. That meant a manager could still bypass the app entirely
-- (e.g. via the browser console, calling the Supabase client directly with
-- their own logged-in session) and grant themselves or a colleague the admin
-- role, since the trigger would have let any manager through.
--
-- This updates the trigger so changing the `role` column specifically
-- requires the acting user to actually be an admin. All other
-- manager-or-admin-editable fields (is_active, employment_type,
-- weekly_hours, site_id) are unaffected — managers can still edit those.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
declare
  actor_is_admin boolean;
begin
  -- service_role (e.g. server-only cron/admin jobs) bypasses this check;
  -- it never runs with an end-user's session anyway.
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

-- Trigger already exists from migration 007 and points at this same function
-- name, so no need to re-create it — `create or replace function` above is
-- enough to swap in the new logic.

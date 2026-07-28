-- Selfie-on-check-in/out: run this once in Supabase SQL Editor
-- Adds photo columns to attendance + a private storage bucket with RLS policies

-- 1. Add photo path columns
alter table public.attendance
  add column if not exists check_in_photo_path text,
  add column if not exists check_out_photo_path text;

-- 2. Create a private bucket for check-in/out photos
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

-- 3. Storage policies: staff upload/view their own photos, managers/admins view all
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

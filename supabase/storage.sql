-- ===========================================================================
-- Friendlie — Storage bucket for profile photos
-- Run AFTER schema.sql. Creates a public `photos` bucket and policies so each
-- member can upload/manage files under a folder named after their user id.
-- ===========================================================================

-- Public bucket: photos are readable by anyone with the URL (profile images).
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Anyone can read photos (the bucket is public).
drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects
  for select using (bucket_id = 'photos');

-- A member can upload only into their own folder: photos/<auth.uid()>/...
drop policy if exists "photos owner insert" on storage.objects;
create policy "photos owner insert" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos owner update" on storage.objects;
create policy "photos owner update" on storage.objects
  for update using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos owner delete" on storage.objects;
create policy "photos owner delete" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

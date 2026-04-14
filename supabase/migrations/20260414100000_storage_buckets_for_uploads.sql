-- Storage buckets + policies for profile avatars and plan banner uploads
-- This enables first-party uploads instead of only URL-based image fields.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-images', 'profile-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('plan-banners', 'plan-banners', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- PROFILE IMAGES
-- Path convention: <auth.uid()>/<filename>
drop policy if exists "Profile images public read" on storage.objects;
create policy "Profile images public read"
on storage.objects for select
using (bucket_id = 'profile-images');

drop policy if exists "Profile images own upload" on storage.objects;
create policy "Profile images own upload"
on storage.objects for insert
with check (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Profile images own update" on storage.objects;
create policy "Profile images own update"
on storage.objects for update
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Profile images own delete" on storage.objects;
create policy "Profile images own delete"
on storage.objects for delete
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- PLAN BANNERS
-- Path convention: <auth.uid()>/<plan-id>/<filename>
drop policy if exists "Plan banners public read" on storage.objects;
create policy "Plan banners public read"
on storage.objects for select
using (bucket_id = 'plan-banners');

drop policy if exists "Plan banners host upload" on storage.objects;
create policy "Plan banners host upload"
on storage.objects for insert
with check (
  bucket_id = 'plan-banners'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Plan banners host update" on storage.objects;
create policy "Plan banners host update"
on storage.objects for update
using (
  bucket_id = 'plan-banners'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'plan-banners'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Plan banners host delete" on storage.objects;
create policy "Plan banners host delete"
on storage.objects for delete
using (
  bucket_id = 'plan-banners'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- Post image uploads: Supabase Storage bucket + RLS
-- Published posts are publicly readable, so bucket objects are public-read.
-- Writes are scoped to the owning publication via a `<publication_id>/...`
-- storage path convention, checked against publications.owner_id.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "post-images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "writers can upload images into their own publication folder"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.publications p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "writers can update images in their own publication folder"
  on storage.objects for update
  using (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.publications p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "writers can delete images in their own publication folder"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.publications p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

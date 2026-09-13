-- ============================================================================
-- Fix post-images storage policies: the EXISTS subquery joins
-- public.publications, which also has a `name` column. That shadowed the
-- intended storage.objects.name reference inside storage.foldername(name),
-- so the folder check ran against the publication's display name (e.g.
-- "My Blog") instead of the uploaded object's path -- which never contains
-- a '/', so foldername() returned nothing, the EXISTS never matched, and
-- every image insert/update/delete was denied by RLS regardless of owner.
-- ============================================================================

drop policy "writers can upload images into their own publication folder" on storage.objects;
drop policy "writers can update images in their own publication folder" on storage.objects;
drop policy "writers can delete images in their own publication folder" on storage.objects;

create policy "writers can upload images into their own publication folder"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.publications p
      where p.id::text = (storage.foldername(storage.objects.name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "writers can update images in their own publication folder"
  on storage.objects for update
  using (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.publications p
      where p.id::text = (storage.foldername(storage.objects.name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "writers can delete images in their own publication folder"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.publications p
      where p.id::text = (storage.foldername(storage.objects.name))[1]
        and p.owner_id = auth.uid()
    )
  );

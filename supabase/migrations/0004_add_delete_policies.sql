-- ============================================================================
-- Add owner-scoped DELETE policies for publications and posts.
-- No DELETE policy existed before this migration -- both tables had RLS
-- enabled but zero delete policies, so all deletes were silently denied.
-- Publication delete cascades to its posts via the existing
-- `posts.publication_id references publications on delete cascade` FK.
-- ============================================================================

create policy "owners can delete their publication"
  on public.publications for delete
  using (auth.uid() = owner_id);

create policy "writers can delete their own posts"
  on public.posts for delete
  using (
    exists (
      select 1 from public.publications p
      where p.id = posts.publication_id and p.owner_id = auth.uid()
    )
  );

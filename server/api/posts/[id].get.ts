export default defineEventHandler(async (event) => {
  const { client } = await requireSupabaseUser(event)
  const id = getRouterParam(event, 'id')

  const { data, error } = await client
    .from('posts')
    .select('id, title, slug, excerpt, body, visibility, status, publication_id, published_at, created_at, publications(subdomain, name)')
    .eq('id', id)
    .maybeSingle()

  if (error) mapPostgrestError(error)
  return notFoundIfMissing(data)
})

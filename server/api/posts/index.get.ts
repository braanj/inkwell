export default defineEventHandler(async (event) => {
  const { client, userId } = await requireSupabaseUser(event)
  const query = getQuery(event)
  const publicationId = requireString(query.publicationId, 'publicationId')

  const { data: publication, error: pubError } = await client
    .from('publications')
    .select('id')
    .eq('id', publicationId)
    .eq('owner_id', userId)
    .maybeSingle()
  if (pubError) mapPostgrestError(pubError)
  notFoundIfMissing(publication)

  const { data, error } = await client
    .from('posts')
    .select('id, title, status, visibility, published_at, created_at')
    .eq('publication_id', publicationId)
    .order('created_at', { ascending: false })

  if (error) mapPostgrestError(error)
  return data
})

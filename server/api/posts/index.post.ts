export default defineEventHandler(async (event) => {
  const { client, userId } = await requireSupabaseUser(event)
  const body = await readBody(event)

  const publicationId = requireString(body?.publicationId, 'publicationId')
  const title = requireString(body?.title, 'title')
  const excerpt = typeof body?.excerpt === 'string' && body.excerpt.trim() ? body.excerpt.trim() : null
  const postBody = body?.body ?? {}
  const visibility = optionalEnum(body?.visibility, VISIBILITY_VALUES, 'visibility') ?? 'public'
  const status = optionalEnum(body?.status, STATUS_VALUES, 'status') ?? 'draft'
  const slug = slugify(title) || crypto.randomUUID().slice(0, 8)

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
    .insert({
      publication_id: publicationId,
      title,
      slug,
      excerpt,
      body: postBody,
      visibility,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null
    })
    .select('id, title, slug, excerpt, body, visibility, status, publication_id, published_at, created_at')
    .single()

  if (error) mapPostgrestError(error)

  setResponseStatus(event, 201)
  return data
})

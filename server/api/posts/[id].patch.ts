export default defineEventHandler(async (event) => {
  const { client } = await requireSupabaseUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const patch: Record<string, unknown> = {}
  if (body?.title !== undefined) patch.title = requireString(body.title, 'title')
  if (body?.excerpt !== undefined) {
    patch.excerpt = typeof body.excerpt === 'string' && body.excerpt.trim() ? body.excerpt.trim() : null
  }
  if (body?.visibility !== undefined) patch.visibility = optionalEnum(body.visibility, VISIBILITY_VALUES, 'visibility')
  if (body?.body !== undefined) patch.body = body.body

  if (body?.status !== undefined) {
    const status = optionalEnum(body.status, STATUS_VALUES, 'status')
    patch.status = status

    if (status === 'published') {
      const { data: current, error: currentError } = await client
        .from('posts')
        .select('status')
        .eq('id', id)
        .maybeSingle()
      if (currentError) mapPostgrestError(currentError)
      const existing = notFoundIfMissing(current)
      if (existing.status !== 'published') patch.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await client
    .from('posts')
    .update(patch)
    .eq('id', id)
    .select('id, title, slug, excerpt, body, visibility, status, publication_id, published_at, created_at')
    .maybeSingle()

  if (error) mapPostgrestError(error)
  return notFoundIfMissing(data)
})

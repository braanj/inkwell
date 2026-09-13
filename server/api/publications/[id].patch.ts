export default defineEventHandler(async (event) => {
  const { client } = await requireSupabaseUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const patch: Record<string, unknown> = {}
  if (body?.name !== undefined) patch.name = requireString(body.name, 'name')
  if (body?.subdomain !== undefined) patch.subdomain = requireSubdomain(body.subdomain)
  if (body?.description !== undefined) {
    patch.description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null
  }

  const { data, error } = await client
    .from('publications')
    .update(patch)
    .eq('id', id)
    .select('id, name, subdomain, description, created_at')
    .maybeSingle()

  if (error) mapPostgrestError(error)
  return notFoundIfMissing(data)
})

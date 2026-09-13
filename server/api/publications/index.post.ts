export default defineEventHandler(async (event) => {
  const { client, userId } = await requireSupabaseUser(event)
  const body = await readBody(event)

  const name = requireString(body?.name, 'name')
  const subdomain = requireSubdomain(body?.subdomain)
  const description = typeof body?.description === 'string' && body.description.trim() ? body.description.trim() : null

  const { data, error } = await client
    .from('publications')
    .insert({ owner_id: userId, name, subdomain, description })
    .select('id, name, subdomain, description, created_at')
    .single()

  if (error) mapPostgrestError(error)

  setResponseStatus(event, 201)
  return data
})

export default defineEventHandler(async (event) => {
  const { client } = await requireSupabaseUser(event)
  const id = getRouterParam(event, 'id')

  const { data, error } = await client
    .from('publications')
    .select('id, name, subdomain, description, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) mapPostgrestError(error)
  return notFoundIfMissing(data)
})

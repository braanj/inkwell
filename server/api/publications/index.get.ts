export default defineEventHandler(async (event) => {
  const { client, userId } = await requireSupabaseUser(event)

  const { data, error } = await client
    .from('publications')
    .select('id, name, subdomain, description, created_at')
    .eq('owner_id', userId)
    .maybeSingle()

  if (error) mapPostgrestError(error)
  return data
})

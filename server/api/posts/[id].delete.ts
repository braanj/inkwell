export default defineEventHandler(async (event) => {
  const { client } = await requireSupabaseUser(event)
  const id = getRouterParam(event, 'id')

  const { data, error } = await client
    .from('posts')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) mapPostgrestError(error)
  return notFoundIfMissing(data)
})

export function useApi() {
  const client = useSupabaseClient()

  async function authHeader() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Not signed in')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  async function apiFetch<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    return $fetch<T>(path, { ...opts, headers: { ...(await authHeader()), ...(opts?.headers as object) } })
  }

  return { apiFetch }
}

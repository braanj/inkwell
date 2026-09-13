import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export async function requireSupabaseUser(event: H3Event): Promise<{ client: SupabaseClient; userId: string }> {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing bearer token' })
  }

  const { public: { supabase: { url, key } } } = useRuntimeConfig(event)
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })

  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }

  return { client, userId: data.user.id }
}

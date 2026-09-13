import type { PostgrestError } from '@supabase/supabase-js'

/** Postgres unique_violation -> 400; check_violation -> 400; everything else -> 500. */
export function mapPostgrestError(error: PostgrestError): never {
  if (error.code === '23505') badRequestError('That value is already taken.')
  if (error.code === '23514') badRequestError('Invalid value.')
  throw createError({ statusCode: 500, statusMessage: error.message })
}

function badRequestError(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

/**
 * .single()/.maybeSingle() after an owner-scoped read/update/delete returned no
 * row -- either the id doesn't exist or the caller isn't the owner (RLS silently
 * filtered it out). Both cases map to 404, never 403, so the API never leaks
 * whether a given id belongs to someone else.
 */
export function notFoundIfMissing<T>(row: T | null | undefined): T {
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return row
}

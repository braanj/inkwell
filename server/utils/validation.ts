export const SUBDOMAIN_RE = /^[a-z0-9-]{3,40}$/
export const VISIBILITY_VALUES = ['public', 'subscribers', 'paid'] as const
export const STATUS_VALUES = ['draft', 'published'] as const

export type Visibility = (typeof VISIBILITY_VALUES)[number]
export type Status = (typeof STATUS_VALUES)[number]

export function badRequest(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) badRequest(`${field} is required`)
  return (value as string).trim()
}

export function requireSubdomain(value: unknown): string {
  const subdomain = requireString(value, 'subdomain').toLowerCase()
  if (!SUBDOMAIN_RE.test(subdomain)) badRequest('subdomain must be 3-40 lowercase letters, numbers, or hyphens')
  return subdomain
}

export function optionalEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    badRequest(`${field} must be one of: ${allowed.join(', ')}`)
  }
  return value as T
}

/**
 * The client's address as the reverse proxy reports it. In production the site runs behind
 * one proxy that sets these headers; a direct connection without them counts as one client.
 */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded !== undefined && forwarded !== '') return forwarded
  return headers.get('x-real-ip')?.trim() ?? 'direct'
}

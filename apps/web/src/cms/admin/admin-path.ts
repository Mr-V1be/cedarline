/** Request header with the CMS path being served, set by the proxy. */
export const ADMIN_PATH_HEADER = 'x-cedarline-admin-path'

export type AdminEntity =
  | { readonly kind: 'collection'; readonly slug: string }
  | { readonly kind: 'global'; readonly slug: string }

const ENTITY_PATH = /^\/admin\/(collections|globals)\/([a-z0-9-]+)(?:\/|$)/

/** The collection or global an admin path is about, if any. */
export function adminEntityOf(path: string | null): AdminEntity | null {
  const match = path === null ? null : ENTITY_PATH.exec(path)
  if (match === null) return null
  const [, section, slug = ''] = match
  return section === 'collections' ? { kind: 'collection', slug } : { kind: 'global', slug }
}

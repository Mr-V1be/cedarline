/**
 * Sections of the site. The footer lists all of them; `header` marks the ones that also fit
 * the header bar, the rest are a click away in the menu and the footer.
 */
export const SITE_NAVIGATION = [
  { key: 'projects', href: '/projects', header: true },
  { key: 'configurator', href: '/configurator', header: true },
  { key: 'objects', href: '/objects', header: true },
  { key: 'production', href: '/production', header: true },
  { key: 'calculator', href: '/calculator', header: false },
  { key: 'articles', href: '/articles', header: true },
  { key: 'contacts', href: '/contacts', header: true },
] as const

export type NavigationKey = (typeof SITE_NAVIGATION)[number]['key']

/** Legal pages linked from the footer and from consent checkboxes. */
export const LEGAL_LINKS = [{ key: 'privacy', href: '/privacy' }] as const

export type LegalKey = (typeof LEGAL_LINKS)[number]['key']

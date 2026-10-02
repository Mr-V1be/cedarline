/** Primary sections of the site; header, menu and footer render this list. */
export const SITE_NAVIGATION = [
  { key: 'projects', href: '/projects' },
  { key: 'technology', href: '/#technology' },
  { key: 'process', href: '/#process' },
  { key: 'built', href: '/#built' },
] as const

export type NavigationKey = (typeof SITE_NAVIGATION)[number]['key']

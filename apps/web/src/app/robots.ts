import type { MetadataRoute } from 'next'

import { env } from '@/config/env'

/** Public pages are open to crawlers; the CMS, APIs and private links are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/files/og/'],
        disallow: ['/admin', '/api', '/render', '/files', '/c/', '/en/c/', '/mail/', '/en/mail/'],
      },
    ],
    sitemap: `${env.SITE_URL}/sitemap.xml`,
    host: env.SITE_URL,
  }
}
